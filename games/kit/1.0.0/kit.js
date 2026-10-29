// Lumos game kit 1.0.0. Shared by every game bundle (docs/GAME_KIT.md): the contract v2 handshake, the narrator, the
// manipulatives (ten-frame, number path, number line), each drawn twice (a picture twin you tap and a buttons twin you
// can use with a keyboard, both writing the same answer), and the session flow: Teach (a demonstrator on the same
// manipulative) → Play (a guided item) → Prove (unaided items), with the server's scaffold ladder on a miss.
// No network (CSP connect-src 'none'), no storage, no engine, no timers shown. The SERVER decides every answer.
// A released kit version is never edited: a change is a new folder, and bundles name the version they use.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith("on")) e[k] = v;
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, String(v));
    }
    e.append(...kids.flat().filter((x) => x != null));
    return e;
  };
  const svg = (tag, attrs = {}) => {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    return e;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------------------------------------------------------------- contract v2 (GAME_CONTRACT.md)
  let port = null, start = null, pending = null, game = null;
  const send = (m) => port && port.postMessage({ lumos: 2, ...m });
  // Handshake: accept exactly one port, only from our parent frame and our own origin. Never window.postMessage.
  addEventListener("message", (e) => {
    const m = e.data;
    if (port || e.source !== parent || e.origin !== location.origin || !m || m.lumos !== 2 || m.type !== "connect" || !e.ports[0]) return;
    port = e.ports[0];
    port.onmessage = (ev) => onShell(ev.data);
    send({ type: "ready" });
  });
  function onShell(m) {
    if (!m || m.lumos !== 2) return;
    if (m.type === "start" && !start && game && typeof m.token === "string" && Array.isArray(m.items) && m.progress && m.skill && m.accessibility) {
      start = m;
      begin();
    } else if (m.type === "feedback" && pending && m.seq === pending.seq) { const p = pending; pending = null; p.resolve(m); }
    else if (m.type === "stop" && start) finish();
  }

  // ---------------------------------------------------------------- narrator
  // Every prompt is spoken and shown with an icon, with a replay button. Speech goes to the shell, which uses on-device
  // speech synthesis only and puts every spoken line in the captions bar (captions rule: off by default, one tap, auto-on
  // when audio is unavailable). RECORDED-VOICE SWAP POINT: a later phase changes say() to play a recorded clip for the
  // same line, shipped inside the game folder; prompts, captions and the replay button stay exactly as they are.
  let lastPrompt = "";
  const say = (text) => send({ type: "speak", text });
  function prompt(text, icon) {
    lastPrompt = text;
    $("icon").textContent = icon || "";
    $("ptext").textContent = text;
    say(text);
  }

  // ---------------------------------------------------------------- the two twins
  // The picture twin (SVG, tap/click) and the buttons twin (semantic HTML, keyboard) render the same model, and both
  // write the same answer, so they score identically through the server's one checker. One is shown at a time.
  function setView(buttons) {
    document.body.classList.toggle("buttons", buttons);
    $("view").setAttribute("aria-pressed", String(buttons));
    $("view").textContent = buttons ? "🖼 Picture view" : "⌨ Buttons view";
  }
  /** Arrow keys move focus within a group of buttons (row width `cols`). */
  function arrows(group, cols) {
    group.addEventListener("keydown", (e) => {
      const list = [...group.querySelectorAll("button")], i = list.indexOf(document.activeElement);
      const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
      if (i < 0 || !d || !list[i + d]) return;
      e.preventDefault();
      list[i + d].focus();
    });
  }

  /**
   * Ten-frame(s): `frames` × 10 spaces, filled row by row (0–4 top row, 5–9 bottom; frame 2 is 10–19). Tap a space to
   * put a counter there (it snaps to the centre) or take it away. `locked` counters are already there and stay.
   */
  function tenFrame(parent, o) {
    const n = (o.frames || 1) * 10, locked = new Set(o.locked || []);
    let cells = new Set(locked);
    const pic = svg("svg", { viewBox: `0 0 308 ${(n / 5) * 60 + (n > 10 ? 24 : 8)}`, class: "visual frame", "aria-hidden": "true" });
    const group = h("div", { class: "dom framegrid", role: "group", "aria-label": o.label });
    const dots = [], btns = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 5), col = i % 5, x = 4 + col * 60, y = 4 + row * 60 + (row >= 2 ? 16 : 0);
      const g = svg("g", { "data-i": i, class: "cell" });
      g.append(svg("rect", { x, y, width: 60, height: 60 }), svg("circle", { cx: x + 30, cy: y + 30, r: 22 }));
      pic.append(g);
      dots.push(g);
      const label = `Frame ${Math.floor(i / 10) + 1}, row ${(row % 2) + 1}, space ${col + 1}`;
      const b = o.readOnly ? h("span", { class: "cellbtn", "data-label": label }) : h("button", { type: "button", class: "cellbtn", "data-i": i, "data-label": label });
      if (!o.readOnly) b.onclick = () => !busy && o.onTap(i);
      group.append(b);
      btns.push(b);
    }
    if (!o.readOnly) {
      pic.addEventListener("click", (e) => { const g = e.target.closest("[data-i]"); if (g) !busy && o.onTap(Number(g.dataset.i)); });
      arrows(group, 5);
    }
    const fig = h("figure", { class: "manip" }, h("figcaption", {}, o.label), pic, group);
    parent.append(fig);
    const update = () => dots.forEach((g, i) => {
      const on = cells.has(i), what = locked.has(i) ? "counter, already there" : on ? "counter" : "empty";
      g.classList.toggle("on", on); g.classList.toggle("locked", locked.has(i));
      btns[i].classList.toggle("on", on); btns[i].classList.toggle("locked", locked.has(i));
      btns[i].textContent = on ? "●" : "";
      if (o.readOnly) btns[i].setAttribute("aria-label", `${btns[i].dataset.label}: ${what}`);
      else { btns[i].setAttribute("aria-pressed", String(on)); btns[i].setAttribute("aria-label", `${btns[i].dataset.label}: ${what}`); }
    });
    update();
    return {
      get cells() { return [...cells].sort((a, b) => a - b); },
      toggle(i) { if (locked.has(i) || i < 0 || i >= n) return; cells.has(i) ? cells.delete(i) : cells.add(i); update(); },
      set(list) { cells = new Set([...locked, ...list]); update(); },
      /** Highlight spaces (scaffolds): "pulse" a space waiting for a counter, "mark" one counter being counted, "ghost" a model. */
      mark(list, cls) { list.forEach((i) => { dots[i]?.classList.add(cls); btns[i]?.classList.add(cls); }); },
      unmark() { for (const e of [...dots, ...btns]) e.classList.remove("pulse", "mark", "ghost"); },
      hide(on) { fig.hidden = on; },
      remove() { fig.remove(); },
    };
  }

  /** The number path: squares 0–max, in rows of 11, numbered. Tap a square; pieces, marks and jump arcs are drawn on it. */
  function numberPath(parent, o) {
    const W = 80, perRow = 11, rows = Math.ceil((o.max + 1) / perRow);
    const at = (n) => ({ x: 10 + (n % perRow) * W, y: 30 + Math.floor(n / perRow) * (W + 50) });
    const pic = svg("svg", { viewBox: `0 0 ${perRow * W + 20} ${rows * (W + 50) + 20}`, class: "visual path", "aria-hidden": "true" });
    const arcsG = svg("g", { class: "arcs" }), piecesG = svg("g");
    const list = h("ol", { class: "dom pathlist", "aria-label": o.label });
    const sq = [], btns = [];
    for (let n = 0; n <= o.max; n++) {
      const { x, y } = at(n), g = svg("g", { "data-n": n, class: "sq" });
      const t = svg("text", { x: x + W / 2, y: y + W / 2 + 10, "text-anchor": "middle" });
      t.textContent = String(n);
      g.append(svg("rect", { x: x + 3, y, width: W - 6, height: W, rx: 10 }), t, svg("circle", { class: "dot", cx: x + W / 2, cy: y + W + 14, r: 7 }));
      pic.append(g);
      sq.push(g);
      const b = h("button", { type: "button", "data-n": n }, String(n));
      b.onclick = () => !busy && o.onTap(n);
      list.append(h("li", {}, b));
      btns.push(b);
    }
    pic.append(arcsG, piecesG);
    pic.addEventListener("click", (e) => { const g = e.target.closest("[data-n]"); if (g) !busy && o.onTap(Number(g.dataset.n)); });
    arrows(list, perRow);
    const said = h("p", { class: "dom jumps" });
    parent.append(h("figure", { class: "manip" }, h("figcaption", {}, o.label), pic, list, said));
    const pieces = {}, colours = { 1: "piece1", 2: "piece2" }, names = { 1: "blue piece", 2: "green piece" };
    const label = () => btns.forEach((b, n) => {
      const here = Object.entries(pieces).filter(([, p]) => p === n).map(([k]) => names[k]);
      b.classList.toggle("here1", pieces[1] === n); b.classList.toggle("here2", pieces[2] === n);
      b.setAttribute("aria-label", `Square ${n}${here.length ? `, ${here.join(" and ")} here` : ""}${sq[n].classList.contains("star") ? ", the target" : ""}`);
    });
    label();
    return {
      /** Put a piece on a square, or (between = true) halfway past it: the "settles between squares" scaffold. */
      piece(k, n, between) {
        pieces[k] = n;
        piecesG.querySelector(`.${colours[k]}`)?.remove();
        if (n == null) return label();
        const { x, y } = at(n), c = svg("circle", { class: colours[k], cx: x + W / 2 + (between ? W / 2 : 0) + (k === 2 ? 14 : 0), cy: y - 14, r: 13 });
        piecesG.append(c);
        label();
      },
      /** Marks: the squares a child tapped. Arcs: jumps between squares (the contrast the counted-start scaffold shows). */
      marks(ns) { [sq, btns].forEach((l) => l.forEach((e, n) => e.classList.toggle("marked", ns.includes(n)))); },
      arcs(pairs, cls = "") {
        arcsG.replaceChildren(...pairs.map(([a, b]) => {
          const p = at(a), q = at(b), lift = Math.floor(a / perRow) === Math.floor(b / perRow) ? 26 : 0;
          return svg("path", { class: cls, d: `M${p.x + W / 2} ${p.y} Q${(p.x + q.x) / 2 + W / 2} ${p.y - 30 - lift} ${q.x + W / 2} ${q.y}` });
        }));
        said.textContent = pairs.length ? `Jumps: ${pairs.map(([a, b]) => `${a} to ${b}`).join(", ")}.` : "";
      },
      hl(ns, cls) { ns.forEach((n) => { sq[n]?.classList.add(cls); btns[n]?.classList.add(cls); }); label(); },
      unhl() { for (const e of [...sq, ...btns]) e.classList.remove("hl1", "hl2", "star"); label(); },
    };
  }

  /** An unmarked number line 0–max (ends labelled only). Tap the line to place; the place snaps to a whole number. */
  function numberLine(parent, o) {
    const X0 = 40, X1 = 960, x = (v) => X0 + (v / o.max) * (X1 - X0);
    const pic = svg("svg", { viewBox: "0 0 1000 170", class: "visual line", "aria-hidden": "true" });
    const marks = svg("g"), marker = svg("g", { class: "marker", visibility: "hidden" }), truth = svg("g", { class: "truth", visibility: "hidden" });
    const end = (v) => { const t = svg("text", { x: x(v), y: 125, "text-anchor": "middle" }); t.textContent = String(v); return t; };
    marker.append(svg("path", { d: "M0 40 l-16 -30 h32 z" }));
    truth.append(svg("circle", { cx: 0, cy: 70, r: 12 }), svg("text", { x: 0, y: 160, "text-anchor": "middle" }));
    const track = svg("rect", { class: "track", x: X0, y: 30, width: X1 - X0, height: 80 });
    pic.append(svg("line", { x1: X0, y1: 70, x2: X1, y2: 70 }), svg("line", { x1: X0, y1: 50, x2: X0, y2: 90 }), svg("line", { x1: X1, y1: 50, x2: X1, y2: 90 }),
      end(0), end(o.max), marks, truth, marker, track);
    // Coarse words for the buttons twin: a screen reader hears roughly where the place is, never the number itself.
    const where = (v) => ["at the very start", "near the start", "about a quarter of the way", "a bit before the middle", "near the middle",
      "a bit past the middle", "about three quarters of the way", "near the end", "at the very end"][Math.round((v / o.max) * 8)];
    const range = h("input", { type: "range", min: 0, max: o.max, step: 1, value: Math.round(o.max / 2) });
    const box = h("label", { class: "dom linelabel" }, o.label, range);
    const ticks = h("p", { class: "dom ticks" });
    parent.append(h("figure", { class: "manip" }, h("figcaption", { class: "visualonly" }, o.label), pic, box, ticks));
    let placed = null;
    const show = (v) => { placed = v; marker.setAttribute("transform", `translate(${x(v)} 30)`); marker.setAttribute("visibility", "visible");
      range.value = String(v); range.setAttribute("aria-valuetext", where(v)); };
    range.setAttribute("aria-valuetext", "not placed yet");
    range.addEventListener("input", () => !busy && o.onPlace(Number(range.value)));
    track.addEventListener("click", (e) => {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(pic.getScreenCTM().inverse());
      !busy && o.onPlace(Math.max(0, Math.min(o.max, Math.round(((p.x - X0) / (X1 - X0)) * o.max))));
    });
    return {
      get at() { return placed; },
      place(v) { if (v == null) { placed = null; marker.setAttribute("visibility", "hidden"); range.setAttribute("aria-valuetext", "not placed yet"); } else show(v); },
      /** Benchmarks revealed after a check: level 1 the halfway mark, level 2 quarters and every ten. */
      reveal(level) {
        const vs = level >= 2 ? [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90] : [50];
        marks.replaceChildren(...vs.flatMap((v) => {
          const big = v % 25 === 0, l = svg("line", { x1: x(v), y1: big ? 45 : 58, x2: x(v), y2: big ? 95 : 82 });
          return big ? [l, end(v)] : [l];
        }));
        ticks.textContent = `Marks shown: ${vs.filter((v) => v % 25 === 0).join(", ")}${level >= 2 ? ", and every ten" : ""}.`;
      },
      truth(v) { truth.setAttribute("transform", `translate(${x(v)} 0)`); truth.lastChild.textContent = String(v); truth.setAttribute("visibility", "visible");
        ticks.textContent += ` ${v} goes here: ${where(v)}.`; },
    };
  }

  // ---------------------------------------------------------------- the session flow
  // Items come from the server in order (warm-up, Teach→Play→Prove cycles, transfer). The game supplies, per item, a
  // controller made with the manipulatives above: { begin, ready, response, state, restore, model, again?, help, worked,
  // success }. The kit runs the loop: demonstrator if the server marked the item `model`, Check (explicit), Undo, a
  // save after every meaningful action, the ladder on a miss (scaffold 1 → 2 → worked solution → near-transfer item),
  // resume from the server's progress, and closure. A miss never restarts anything and never takes anything away.
  let items = [], idx = 0, seq = 0, misses = 0, tally = { correct: 0, total: 0 }, ctl = null, history = [], busy = false, finished = false;
  const token = () => start.token;
  const feedback = (text, cls = "hint") => { const f = $("feedback"); f.textContent = text || ""; f.className = cls; };
  const saveBoard = () => send({ type: "save", token: token(), state: { item: idx, board: ctl ? ctl.state() : null } });
  function refresh() {
    $("check").disabled = busy || !ctl || !ctl.ready();
    $("undo").disabled = busy || history.length < 2;
    $("again").hidden = !ctl || !ctl.again || busy;
  }
  const api = {
    say, prompt, wait, feedback, item: () => items[idx], index: () => idx, items: () => items,
    /** The child changed the board: one undo step, and a save so a killed tab resumes right here. */
    changed() { history.push(ctl.state()); saveBoard(); refresh(); },
    refresh,
  };

  function chrome() {
    document.body.append(
      h("header", { class: "bar" },
        h("p", { class: "prompt" }, h("span", { id: "icon", "aria-hidden": "true" }), h("span", { id: "ptext" })),
        h("button", { id: "replay", type: "button", class: "secondary", "aria-label": "Hear it again", onclick: () => lastPrompt && say(lastPrompt) }, "🔊"),
        h("button", { id: "view", type: "button", class: "secondary", "aria-pressed": "false", onclick: () => setView(!document.body.classList.contains("buttons")) })),
      h("section", { id: "intro", hidden: true }, h("h1", { id: "title" }), h("button", { id: "ready", type: "button", class: "big", onclick: ready }, "▶ Start")),
      h("section", { id: "play", hidden: true },
        h("h2", { id: "stage" }),
        h("div", { id: "area" }),
        h("div", { class: "controls" },
          h("button", { id: "undo", type: "button", class: "secondary", onclick: undo }, "↶ Undo"),
          h("button", { id: "again", type: "button", class: "secondary", hidden: true, onclick: () => ctl && ctl.again && !busy && ctl.again() }, "👀 Show me again"),
          h("button", { id: "next", type: "button", hidden: true }, "Next ➡"),
          h("button", { id: "check", type: "button", onclick: checkIt }, "✓ Check")),
        h("p", { id: "feedback", role: "status", "aria-live": "polite" })),
      h("section", { id: "end", hidden: true }, h("h1", {}, "All done! ⭐"), h("p", { id: "endline" })));
  }

  function begin() {
    chrome();
    document.body.classList.toggle("readable", !!start.accessibility.dyslexiaFont);
    setView(!!start.accessibility.accessibleMode);
    items = start.items.slice();
    ({ done: idx, seq, misses } = start.progress);
    tally = { correct: start.progress.correct || 0, total: seq };
    if (seq || start.resume) { // resumed: straight back to where the child stopped
      send({ type: "started", token: token() });
      return play(start.resume && start.resume.item === idx ? start.resume.board : null);
    }
    $("intro").hidden = false;
    $("title").textContent = `${game.icon} ${game.title}`;
    prompt(`${game.title}! Tap start.`, game.icon);
    $("ready").focus();
  }
  function ready() {
    send({ type: "started", token: token() }); // practice time starts now
    play(null);
  }

  async function play(board) {
    if (finished) return;
    if (idx >= items.length) return finish();
    const item = items[idx], stage = game.stages[item.stage];
    $("intro").hidden = true; $("play").hidden = false; $("next").hidden = true; $("check").hidden = false;
    feedback("");
    $("stage").textContent = `${stage.icon} ${stage.name}`;
    $("area").replaceChildren();
    ctl = game.mount(item, $("area"), api);
    history = [ctl.state()];
    busy = true; refresh();
    if (item.model && !misses && !board) { // Teach: the demonstrator, same task type on the same manipulative
      prompt(start.skill.workedExample, "👀");
      await wait(2600);
      await ctl.model();
      ctl.restore(history[0]);
      await wait(400);
    }
    if (board) ctl.restore(board);
    if (misses) await ctl.help(misses, {});
    history = [ctl.state()];
    busy = false;
    ctl.begin(misses > 0);
    refresh();
    saveBoard();
  }

  function undo() {
    if (busy || history.length < 2) return;
    history.pop();
    ctl.restore(history[history.length - 1]);
    saveBoard();
    refresh();
  }

  async function checkIt() {
    if (busy || !ctl || !ctl.ready()) return;
    busy = true; refresh();
    seq += 1;
    const fb = await new Promise((resolve) => {
      pending = { seq, resolve };
      send({ type: "attempt", token: token(), seq, verb: "answered", object: { item: idx }, result: { response: ctl.response() } });
    });
    if (finished) return;
    tally.total += 1;
    if (fb.correct) tally.correct += 1;
    if (fb.slowDown) { // no reward, no rung climbed
      feedback("Take your time. Look again, then check.");
      say("Take your time. Look again, then check.");
    } else if (fb.correct) {
      feedback(game.praise(items[idx]), "good");
      say(game.praise(items[idx]));
      await ctl.success(fb);
      await wait(start.rewardMs || 0); // the reward moment the bundle declares to the server
      misses = 0; idx += 1;
      return play(null);
    } else if (fb.worked) { // last rung: the worked solution, then (from the server) a near-transfer item
      if (fb.transfer) items.splice(idx + 1, 0, fb.transfer);
      feedback("Let's do this one together.");
      await ctl.worked(fb.worked);
      $("check").hidden = true; $("next").hidden = false; $("next").focus();
      prompt("Now you know how. Tap next.", "➡");
      await new Promise((r) => { $("next").onclick = r; });
      misses = 0; idx += 1;
      return play(null);
    } else {
      misses = fb.scaffold || misses + 1;
      feedback(fb.feedback || "Let's look again.");
      await ctl.help(misses, fb);
      history = [ctl.state()];
      saveBoard();
    }
    busy = false; refresh();
  }

  function finish() {
    if (finished || !start) return;
    finished = true;
    if (pending) { pending = null; }
    for (const id of ["intro", "play"]) $(id) && ($(id).hidden = true);
    if ($("end")) { $("end").hidden = false; $("endline").textContent = game.closure; }
    prompt(game.closure, "⭐");
    send({ type: "completed", token: token(), verb: "completed", result: { correct: tally.correct, total: tally.total } });
  }

  window.LumosKit = { run: (g) => { game = g; }, h, svg, wait, tenFrame, numberPath, numberLine };
})();
