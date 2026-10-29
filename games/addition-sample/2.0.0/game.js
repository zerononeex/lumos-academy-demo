// Addition sample game, contract v2. Deliberately tiny: proves the game-shell contract end to end.
// No network access (CSP connect-src 'none'), no storage, no engine. Plain Canvas + an HTML alternative.
// The SERVER chooses every question (start.questions) and decides every answer; this file only presents.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let port = null; // private channel to the shell, received in the handshake
  let start = null, seq = 0, solved = 0, attempts = 0, q = null, accessible = false, waiting = false, tiles = [];

  const send = (m) => port && port.postMessage({ lumos: 2, ...m });
  const say = (text) => send({ type: "speak", text });

  // Handshake: the shell's first message transfers a MessagePort. Accept exactly one, only from our parent
  // frame, and only from the origin this bundle is served from (the shell's own origin). Everything after,
  // in both directions, goes over that port: this game never posts to a window with targetOrigin "*".
  addEventListener("message", (e) => {
    const m = e.data;
    if (port || e.source !== parent || e.origin !== location.origin || !m || m.lumos !== 2 || m.type !== "connect" || !e.ports[0]) return;
    port = e.ports[0];
    port.onmessage = (ev) => onShell(ev.data);
    send({ type: "ready" });
  });

  function onShell(m) {
    if (!m || m.lumos !== 2) return;
    if (m.type === "start" && !start && typeof m.token === "string" && Array.isArray(m.questions) && m.skill && m.accessibility) {
      start = m;
      document.body.classList.toggle("readable", !!m.accessibility.dyslexiaFont);
      setMode(!!m.accessibility.accessibleMode);
      teach();
    } else if (m.type === "feedback" && start && m.seq === seq) onFeedback(m);
    else if (m.type === "stop" && start) finish();
  }

  // ---- teaching step first: a worked example before any question
  function teach() {
    $("teach").hidden = false;
    $("example").textContent = start.skill.workedExample;
    if (start.accessibility.readAloud) say(start.skill.workedExample);
    $("ready").focus();
  }
  $("ready").onclick = () => {
    $("teach").hidden = true; $("play").hidden = false;
    send({ type: "started", token: start.token }); // worked example done: practice time starts now
    next();
  };

  function next() {
    const [a, b] = start.questions[solved]; // the server's question set, in order
    q = { a, b };
    render();
    if (start.accessibility.readAloud) say(questionText());
  }
  const questionText = () => `What is ${q.a} plus ${q.b}?`;
  const blocksText = (n) => `${Math.floor(n / 10)} tens and ${n % 10} ones`;

  function submit(answer) {
    if (waiting || !Number.isInteger(answer)) return;
    waiting = true;
    seq += 1;
    send({ type: "attempt", token: start.token, seq, verb: "answered", object: { operands: [q.a, q.b] }, result: { response: answer } });
  }

  // The shell relays the SERVER's verdict. The game never decides what's correct.
  function onFeedback(m) {
    waiting = false;
    attempts += 1;
    const fb = $("feedback");
    if (m.slowDown) {
      fb.className = "feedback hint";
      fb.textContent = "Take your time. Look at the blocks and try again.";
    } else if (m.correct) {
      solved += 1;
      fb.className = "feedback good";
      fb.textContent = `Yes! ${q.a} + ${q.b} = ${q.a + q.b}.`;
      $("solved").textContent = `Solved today: ${solved}`;
      if (solved >= start.questions.length) return finish();
      return setTimeout(next, start.rewardMs); // short reward moment (declared to the server), then back to learning
    } else {
      fb.className = "feedback hint";
      fb.textContent = m.feedback || "Not quite. Let's try again.";
    }
    say(fb.textContent);
    render(); // remediation retry: same question again
  }

  function finish() {
    if (!start || $("end").hidden === false) return;
    $("play").hidden = true; $("teach").hidden = true; $("end").hidden = false;
    send({ type: "completed", token: start.token, verb: "completed", result: { correct: solved, total: attempts } });
  }

  // ---- presentation
  function setMode(on) {
    accessible = on;
    $("mode").setAttribute("aria-pressed", String(on));
    $("mode").textContent = on ? "Switch to picture mode" : "Switch to accessible mode";
    $("canvasMode").hidden = on;
    $("a11yMode").hidden = !on;
    if (q) render();
  }
  $("mode").onclick = () => setMode(!accessible);
  $("readq").onclick = () => q && say(`${questionText()} ${blocksText(q.a)}, plus ${blocksText(q.b)}.`);
  const check = () => $("answer").value !== "" && submit(Number($("answer").value));
  $("check").onclick = check;
  $("answer").addEventListener("keydown", (e) => e.key === "Enter" && check());

  function render() {
    if (accessible) {
      $("qtext").textContent = `${q.a} + ${q.b} = ?`;
      $("qblocks").textContent = `${blocksText(q.a)}, plus ${blocksText(q.b)}.`;
      $("answer").value = "";
      $("answer").focus();
      return;
    }
    const c = $("board"), g = c.getContext("2d");
    g.fillStyle = "#fffdf7"; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = "#1b1f3b"; g.font = "bold 40px system-ui"; g.fillText(`${q.a} + ${q.b} = ?`, 20, 50);
    drawBlocks(g, q.a, 20, 80); drawBlocks(g, q.b, 380, 80);
    // Answer tiles: the correct sum among likely-misconception distractors. Tap/click, never drag.
    const sum = q.a + q.b, noCarry = (Math.floor(q.a / 10) + Math.floor(q.b / 10)) * 10 + ((q.a + q.b) % 10);
    const opts = [...new Set([sum, noCarry, sum + 1, sum - 1, sum + 10])].slice(0, 4).sort((x, y) => x - y);
    tiles = opts.map((v, i) => ({ v, x: 20 + i * 175, y: 320, w: 160, h: 80 }));
    for (const t of tiles) {
      g.fillStyle = "#3a2fa8"; g.fillRect(t.x, t.y, t.w, t.h);
      g.fillStyle = "#fff"; g.font = "bold 36px system-ui"; g.fillText(String(t.v), t.x + 45, t.y + 52);
    }
  }
  function drawBlocks(g, n, x, y) {
    g.fillStyle = "#0f6b5c";
    for (let i = 0; i < Math.floor(n / 10); i++) g.fillRect(x + i * 22, y, 16, 160);       // tens rods
    for (let i = 0; i < n % 10; i++) g.fillRect(x + (i % 5) * 22, y + 180 + Math.floor(i / 5) * 22, 16, 16); // ones cubes
  }
  $("board").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect(), k = e.currentTarget.width / r.width;
    const px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
    const t = tiles.find((t) => px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h);
    if (t) submit(t.v);
  });
})();
