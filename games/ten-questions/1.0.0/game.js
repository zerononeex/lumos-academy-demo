// Ten questions: a PLACEHOLDER bundle, contract v2. Its only job is to close the loop (log in → play → finish → the
// teacher and parent see it). No network (CSP connect-src 'none'), no storage, no canvas, no engine.
// The SERVER chooses every question (start.questions + start.operators) and decides every answer; this only presents.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let port = null, start = null, seq = 0, solved = 0, attempts = 0, typed = "", waiting = false;

  const send = (m) => port && port.postMessage({ lumos: 2, ...m });
  const say = (text) => send({ type: "speak", text });

  // Handshake: accept exactly one port, only from our parent frame and our own origin (see GAME_CONTRACT.md).
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
      stones();
      $("teach").hidden = false;
      $("example").textContent = m.skill.workedExample;
      if (m.accessibility.readAloud) say(m.skill.workedExample);
      $("ready").focus();
    } else if (m.type === "feedback" && start && m.seq === seq) onFeedback(m);
    else if (m.type === "stop" && start) finish();
  }

  const op = () => (start.operators && start.operators[solved]) || "+";
  const q = () => start.questions[solved];
  const sign = () => (op() === "-" ? "−" : "+");
  const spoken = () => `What is ${q()[0]} ${op() === "-" ? "take away" : "plus"} ${q()[1]}?`;

  function stones() {
    $("stones").replaceChildren(...start.questions.map((_, i) => {
      const li = document.createElement("li");
      if (i < solved) li.className = "done";
      return li;
    }));
    $("stones").setAttribute("aria-label", `${solved} of ${start.questions.length} done`);
  }

  // Number pad: big buttons, 0–9, erase, check.
  for (const key of ["1", "2", "3", "4", "5", "⌫", "6", "7", "8", "9", "0", "✓"]) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = key;
    if (key === "⌫") { b.setAttribute("aria-label", "Erase"); b.className = "secondary"; }
    if (key === "✓") b.setAttribute("aria-label", "Check");
    b.onclick = () => press(key);
    $("pad").append(b);
  }
  addEventListener("keydown", (e) => {
    if ($("play").hidden) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") press("⌫");
    else if (e.key === "Enter" && e.target === document.body) press("✓");
  });

  function press(key) {
    if (waiting) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "✓") return submit();
    else if (typed.length < 3) typed += key;
    $("answer").textContent = typed;
  }

  $("ready").onclick = () => {
    $("teach").hidden = true; $("play").hidden = false;
    send({ type: "started", token: start.token }); // practice time starts now
    show();
  };
  $("readq").onclick = () => start && say($("play").hidden ? start.skill.workedExample : spoken());

  function show() {
    const [a, b] = q();
    $("qtext").textContent = `${a} ${sign()} ${b} = ?`;
    $("qtext").dataset.q = String(solved); // which question is showing (the reward pause keeps the last one up briefly)
    // Small numbers also get dots to count (K–1); bigger ones are numerals only.
    $("dots").textContent = a <= 10 && b <= 10 ? `${"●".repeat(a)}  ${sign()}  ${"●".repeat(b)}` : "";
    typed = ""; $("answer").textContent = "";
    if (start.accessibility.readAloud) say(spoken());
  }

  function submit() {
    if (!typed) return;
    waiting = true;
    seq += 1; attempts += 1;
    const [a, b] = q();
    send({ type: "attempt", token: start.token, seq, verb: "answered", object: { operands: [a, b] }, result: { response: Number(typed) } });
  }

  function onFeedback(m) {
    waiting = false;
    const fb = $("feedback");
    if (m.slowDown) { fb.textContent = "Take your time. Try it again."; fb.className = "hint"; typed = ""; $("answer").textContent = ""; return; }
    if (m.correct) {
      solved += 1;
      fb.textContent = "Yes! ⭐"; fb.className = "good";
      stones();
      if (solved >= start.questions.length) return finish();
      waiting = true; // the short reward moment the bundle declares to the server, then the next question
      setTimeout(() => { waiting = false; show(); }, start.rewardMs || 0);
    } else {
      fb.textContent = m.feedback || "Not quite. Try again."; fb.className = "hint";
      typed = ""; $("answer").textContent = "";
      say(fb.textContent);
    }
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    $("play").hidden = true; $("teach").hidden = true; $("end").hidden = false;
    send({ type: "completed", token: start.token, verb: "completed", result: { correct: solved, total: attempts } });
  }
})();
