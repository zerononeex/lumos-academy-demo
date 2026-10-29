// Lumos game kit 1.1.0. Shared by every game bundle (docs/GAME_KIT.md): the contract v2 handshake, the narrator, the
// manipulatives (ten-frame, number path, number line, and from 1.1.0 the bead rack, jump line, base-ten mat, pattern
// tiles and the stepper), each drawn twice (a picture twin you tap and a buttons twin you can use with a keyboard, both
// writing the same answer), and the session flow: Teach (a demonstrator on the same manipulative) → Play (a guided
// item) → Prove (unaided items), with the server's scaffold ladder on a miss. 1.1.0 is 1.0.0 plus additions only.
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
      const b = o.readOnly ? h("span", { class: "cellbtn", role: "img", "data-label": label }) : h("button", { type: "button", class: "cellbtn", "data-i": i, "data-label": label });
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
      const on = cells.has(i), extra = Object.keys(MARKS).filter((c) => g.classList.contains(c)).map((c) => `, ${MARKS[c]}`).join("");
      const what = (locked.has(i) ? "counter, already there" : on ? "counter" : "empty") + extra;
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
      /** Highlight spaces (scaffolds): "pulse" a space waiting for a counter, "mark" one counter being counted, "ghost" a model;
       * and (1.1.0) "tint" a counter moved across from the other group, "twice" one counted twice, "gone" one taken away. */
      mark(list, cls) { list.forEach((i) => { dots[i]?.classList.add(cls); btns[i]?.classList.add(cls); }); update(); },
      unmark() { for (const e of [...dots, ...btns]) e.classList.remove("pulse", "mark", "ghost", ...Object.keys(MARKS)); update(); },
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

  // ---------------------------------------------------------------- 1.1.0 additions
  /** Marks on counters and beads, and how the buttons twin says them. */
  const MARKS = { tint: "moved across", twice: "counted twice", gone: "taken away" };

  /**
   * A − value + stepper, the same control in both views (a group of buttons; the value is announced). Plank lengths,
   * place-value columns, digits, towers: a child never needs dozens of single taps.
   */
  function stepper(parent, o) {
    let value = o.value ?? o.min;
    const out = h("output", { class: "stepval", "aria-live": "polite" });
    const less = h("button", { type: "button", class: "secondary", "aria-label": `${o.label}: one less` }, "−");
    const more = h("button", { type: "button", class: "secondary", "aria-label": `${o.label}: one more` }, "+");
    const box = h("div", { class: "stepper", role: "group", "aria-label": o.label }, h("span", { class: "steplabel", "aria-hidden": "true" }, o.label), less, out, more);
    const show = () => { out.textContent = o.words ? o.words(value) : String(value); less.disabled = value <= o.min; more.disabled = value >= o.max; };
    const go = (d) => {
      if (busy) return;
      const v = Math.max(o.min, Math.min(o.max, value + d));
      if (v !== value) { value = v; show(); o.onChange && o.onChange(v); }
    };
    less.onclick = () => go(-1);
    more.onclick = () => go(1);
    parent.append(box);
    show();
    return { get value() { return value; }, set(v) { value = v; show(); } };
  }

  /**
   * A bead rack (rekenrek): two rows of 10 beads, 5 red then 5 white, read-only. `set(list)` pushes those beads to the
   * left (0–9 the top row, 10–19 the bottom, each row from the left); marks as on the ten-frame. The same set, mark
   * and unmark as a read-only `tenFrame`, so a game can show either one.
   */
  function beadRack(parent, o) {
    const pic = svg("svg", { viewBox: "0 0 560 150", class: "visual rack", "aria-hidden": "true" });
    for (let r = 0; r < 2; r++) pic.append(svg("line", { class: "wire", x1: 8, y1: 40 + r * 70, x2: 552, y2: 40 + r * 70 }));
    const beads = Array.from({ length: 20 }, (_, i) => {
      const c = svg("circle", { r: 15, cy: 40 + Math.floor(i / 10) * 70, class: `bead ${i % 10 < 5 ? "red" : "white"}` });
      pic.append(c);
      return c;
    });
    const said = h("p", { class: "dom racktext" });
    const fig = h("figure", { class: "manip" }, h("figcaption", {}, o.label), pic, said);
    parent.append(fig);
    let on = new Set();
    const update = () => {
      beads.forEach((b, i) => b.setAttribute("cx", String(on.has(i) ? 26 + (i % 10) * 32 : 248 + (i % 10) * 32)));
      const row = (r) => [...on].filter((i) => Math.floor(i / 10) === r).length;
      const marks = Object.entries(MARKS).map(([c, w]) => [beads.filter((b) => b.classList.contains(c)).length, w]).filter(([n]) => n).map(([n, w]) => `${n} ${w}`);
      said.textContent = `Top row: ${row(0)} of 10 beads pushed over. Bottom row: ${row(1)} of 10.${marks.length ? ` (${marks.join(", ")}.)` : ""}`;
    };
    update();
    return {
      get cells() { return [...on].sort((a, b) => a - b); },
      set(list) { on = new Set(list); update(); },
      mark(list, cls) { list.forEach((i) => beads[i]?.classList.add(cls)); update(); },
      unmark() { beads.forEach((b) => b.classList.remove("pulse", "mark", "ghost", ...Object.keys(MARKS))); update(); },
      remove() { fig.remove(); },
    };
  }

  /**
   * The jump line: an open number line `lo`–`hi` with a gap to cross, from the start bank at `from` to the far bank at
   * `to`. Jumps (Bridge Builder's planks) are arcs from `from` through each landing, labelled with their length; a
   * walker crosses them. On a short line, tapping a number lays a jump to it (`onTap`); the buttons twin writes it all
   * out. `labels`: the numbers written under the line; the far bank's number shows only after `reveal()`.
   */
  function jumpLine(parent, o) {
    const X0 = 40, X1 = 960, x = (v) => X0 + ((v - o.lo) / (o.hi - o.lo)) * (X1 - X0), Y = 160;
    const pic = svg("svg", { viewBox: "0 0 1000 230", class: "visual jline", "aria-hidden": "true" });
    const [l, r] = [Math.min(o.from, o.to), Math.max(o.from, o.to)];
    pic.append(svg("rect", { class: "bank", x: X0 - 20, y: Y, width: x(l) - X0 + 20, height: 30 }),
      svg("rect", { class: "bank", x: x(r), y: Y, width: X1 + 20 - x(r), height: 30 }),
      svg("rect", { class: "river", x: x(l), y: Y + 4, width: x(r) - x(l), height: 40 }),
      svg("line", { class: "axis", x1: X0, y1: Y, x2: X1, y2: Y }));
    const fine = o.hi - o.lo <= 50;
    for (let v = o.lo; v <= o.hi; v++) if (fine || v % 10 === 0) pic.append(svg("line", { class: "tick", x1: x(v), y1: Y - (v % 10 ? 8 : 16), x2: x(v), y2: Y + 8 }));
    const label = (v, cls = "") => { const t = svg("text", { x: x(v), y: Y + 62, "text-anchor": "middle", class: cls }); t.textContent = String(v); return t; };
    o.labels.forEach((v) => pic.append(label(v)));
    const far = label(o.to, "far"); far.textContent = "?";
    const planksG = svg("g", { class: "planks" }), ghostG = svg("g", { class: "planks ghost" }), resultG = svg("g");
    const walker = svg("g", { class: "walker" });
    walker.append(svg("circle", { cx: 0, cy: -38, r: 11 }), svg("path", { d: "M-12 -6 L0 -26 L12 -6 Z" }));
    pic.append(far, ghostG, planksG, resultG, walker);
    if (o.onTap && fine) for (let v = o.lo; v <= o.hi; v++) {
      const w = (X1 - X0) / (o.hi - o.lo);
      const t = svg("rect", { class: "hit", x: x(v) - w / 2, y: 10, width: w, height: 210, "data-n": v });
      pic.append(t);
    }
    pic.addEventListener("click", (e) => { const t = e.target.closest("[data-n]"); if (t && o.onTap) !busy && o.onTap(Number(t.dataset.n)); });
    const said = h("p", { class: "dom jtext", "aria-live": "polite" });
    const fig = h("figure", { class: "manip wide" }, h("figcaption", {}, o.label), pic, said);
    parent.append(fig);
    let parts = [], revealed = false;
    const landings = (ps) => ps.map((_, i) => o.from + ps.slice(0, i + 1).reduce((s, p) => s + p, 0));
    const arcs = (g, ps) => g.replaceChildren(...ps.flatMap((p, i) => {
      const a = i ? landings(ps)[i - 1] : o.from, b = landings(ps)[i], mid = (x(a) + x(b)) / 2, lift = 30 + Math.min(70, Math.abs(x(b) - x(a)) / 3);
      const t = svg("text", { x: mid, y: Y - lift / 2 - 22, "text-anchor": "middle" });
      t.textContent = p > 0 ? `+${p}` : `−${-p}`;
      return [svg("path", { d: `M${x(a)} ${Y} Q${mid} ${Y - lift} ${x(b)} ${Y}` }), t];
    }));
    const place = (v) => walker.setAttribute("transform", `translate(${x(Math.max(o.lo, Math.min(o.hi, v)))} ${Y})`);
    const end = () => o.from + parts.reduce((s, p) => s + p, 0);
    const where = () => {
      if (!parts.length) return "No planks yet.";
      const over = (end() - o.to) * Math.sign(o.to - o.from);
      return `Planks: ${parts.map((p) => (p > 0 ? `+${p}` : `−${-p}`)).join(", ")}. ${over === 0 ? "It reaches the far side." : over < 0 ? "It stops before the far side." : "It goes past the far side."}`;
    };
    const write = (extra = "") => { said.textContent = `Start: ${o.from}. Far side: ${revealed ? o.to : "?"}. ${where()} ${extra}`.trim(); };
    place(o.from);
    write();
    return {
      /** Draw the planks (the bridge as built so far). */
      planks(ps) { parts = ps.slice(); arcs(planksG, parts); resultG.replaceChildren(); write(); },
      /** A model drawn as outlines (scaffold 2: the first plank to the next ten). */
      ghost(ps) { arcs(ghostG, ps); write(ps.length ? `A dashed plank shows a start: ${ps.map((p) => (p > 0 ? `+${p}` : `−${-p}`)).join(", ")}.` : ""); },
      /** The walker crosses plank by plank, saying each landing; then the consequence: the gap left, or the extra span. */
      async walk(say) {
        resultG.replaceChildren();
        place(o.from);
        await wait(300);
        for (const v of landings(parts)) { place(v); say && say(String(v)); await wait(900); }
        const e = end(), over = (e - o.to) * Math.sign(o.to - o.from);
        if (over) resultG.append(svg("line", { class: over < 0 ? "short" : "extra", x1: x(e), y1: Y - 4, x2: x(o.to), y2: Y - 4 }));
        write(over < 0 ? `${-over} short: there is still a gap.` : over > 0 ? `${over} too far: past the far side.` : "Across!");
        return over;
      },
      reveal() { revealed = true; far.textContent = String(o.to); write(); },
      reset() { place(o.from); resultG.replaceChildren(); ghostG.replaceChildren(); write(); },
    };
  }

  /**
   * Base-ten blocks on a place-value mat: a column per place (hundreds, tens, ones) of flats, sticks and cubes. Every
   * column stays on the mat when it is empty ("0 tens"), never collapsed. Tap a column to add one block (`onTap(place)`);
   * the buttons twin lists the columns.
   */
  const PLACE_NAMES = { hundreds: ["hundred", "hundreds"], tens: ["ten", "tens"], ones: ["one", "ones"] };
  function baseTen(parent, o) {
    const W = 300, pic = svg("svg", { viewBox: `0 0 ${o.places.length * W} 330`, class: "visual mat", "aria-hidden": "true" });
    const cols = o.places.map((p, k) => {
      const g = svg("g", { class: "col", "data-p": p });
      const t = svg("text", { x: k * W + W / 2, y: 30, "text-anchor": "middle" });
      g.append(svg("rect", { x: k * W + 6, y: 4, width: W - 12, height: 322, rx: 14 }), t);
      const blocks = svg("g");
      g.append(blocks);
      pic.append(g);
      return { p, g, t, blocks, k };
    });
    if (o.onTap) pic.addEventListener("click", (e) => { const g = e.target.closest("[data-p]"); if (g) !busy && o.onTap(g.dataset.p); });
    const list = h("ul", { class: "dom matlist", "aria-label": o.label });
    const fig = h("figure", { class: "manip" }, h("figcaption", {}, o.label), pic, list);
    parent.append(fig);
    let counts = o.places.map(() => 0);
    const draw = () => {
      cols.forEach(({ p, t, blocks, k }, i) => {
        const n = counts[i], x0 = k * W + 20, kids = [];
        t.textContent = `${n} ${PLACE_NAMES[p][n === 1 ? 0 : 1]}`;
        for (let j = 0; j < n; j++) {
          if (p === "hundreds") kids.push(svg("rect", { class: "flat", x: x0 + (j % 3) * 88, y: 46 + Math.floor(j / 3) * 88, width: 80, height: 80 }));
          else if (p === "tens") kids.push(svg("rect", { class: "stick", x: x0 + (j % 15) * 17, y: 46 + Math.floor(j / 15) * 140, width: 13, height: 130 }));
          else kids.push(svg("rect", { class: "cube", x: x0 + (j % 8) * 32, y: 46 + Math.floor(j / 8) * 32, width: 26, height: 26 }));
        }
        if (!n) { const e = svg("text", { x: k * W + W / 2, y: 180, "text-anchor": "middle", class: "empty" }); e.textContent = "empty"; kids.push(e); }
        blocks.replaceChildren(...kids);
      });
      list.replaceChildren(...cols.map(({ p }, i) => h("li", {}, `${PLACE_NAMES[p][1][0].toUpperCase()}${PLACE_NAMES[p][1].slice(1)}: ${counts[i]}${counts[i] ? "" : " (empty)"}`)));
    };
    draw();
    return {
      set(c) { counts = c.slice(); draw(); },
      /** Highlight a whole column ("pulse": the empty place), or one block in it while counting aloud ("mark"). */
      markCol(p, cls) { cols.find((c) => c.p === p)?.g.classList.add(cls); list.children[o.places.indexOf(p)]?.classList.add(cls); },
      markBlock(p, j) { cols.find((c) => c.p === p)?.blocks.children[j]?.classList.add("mark"); },
      unmark() { cols.forEach(({ g, blocks }) => { g.classList.remove("pulse", "mark"); [...blocks.children].forEach((b) => b.classList.remove("mark")); });
        [...list.children].forEach((li) => li.classList.remove("pulse", "mark")); },
    };
  }

  /** The art for one pattern tile (an SVG): a shape in its colour, or a picture on a disc of its colour. */
  const SHAPES = { circle: "M32 8a24 24 0 1 0 0.1 0Z", triangle: "M32 6 58 56H6Z", square: "M9 9h46v46H9Z", diamond: "M32 4 60 32 32 60 4 32Z" };
  function tileArt(t) {
    const s = svg("svg", { viewBox: "0 0 64 64", class: "tileart", "aria-hidden": "true" });
    if (!t) { s.append(svg("rect", { class: "slot", x: 4, y: 4, width: 56, height: 56, rx: 10 })); return s; }
    if (t.shape) s.append(svg("path", { d: SHAPES[t.shape], fill: t.colour, class: "shape" }));
    else {
      const e = svg("text", { x: 32, y: 44, "text-anchor": "middle", class: "emoji" });
      e.textContent = t.emoji;
      s.append(svg("circle", { cx: 32, cy: 32, r: 30, fill: t.colour }), e);
    }
    return s;
  }
  /** Play a tile's pitch with on-device Web Audio (no file, no network); silent where the device has no audio. */
  let audio = null;
  function tone(hz, ms = 320) {
    try {
      audio ??= new AudioContext();
      const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
      osc.connect(gain).connect(audio.destination);
      osc.start(t); osc.stop(t + ms / 1000);
    } catch { /* no audio on this device: the tiles still show and name every sound */ }
  }
  /**
   * A row of pattern tiles, each coded three ways (colour, shape or picture, and its pitch, never colour alone).
   * `null` is an empty place to fill. Tap a tile (`onTap(i)`); the buttons twin names every tile.
   */
  function tileStrip(parent, o) {
    const pic = svg("svg", { class: "visual strip", "aria-hidden": "true" });
    const list = h("ol", { class: "dom striplist", "aria-label": o.label });
    if (o.onTap) {
      pic.addEventListener("click", (e) => { const g = e.target.closest("[data-i]"); if (g) !busy && o.onTap(Number(g.dataset.i)); });
      arrows(list, 20);
    }
    const fig = h("figure", { class: "manip wide" }, h("figcaption", {}, o.label), pic, list);
    parent.append(fig);
    let tiles = [], els = [];
    const draw = () => {
      pic.setAttribute("viewBox", `0 0 ${tiles.length * 70 + 6} 76`);
      pic.style.width = `min(96vw, ${tiles.length * 70 + 6}px)`;
      const gs = tiles.map((t, i) => {
        const g = svg("g", { class: "tile", "data-i": i, transform: `translate(${6 + i * 70} 6)` });
        const art = tileArt(t); // a nested svg needs its own box: CSS sizes do not apply inside another svg
        for (const [k, v] of Object.entries({ x: 8, y: 8, width: 48, height: 48 })) art.setAttribute(k, v);
        g.append(svg("rect", { class: "frame", x: -3, y: -3, width: 70, height: 70, rx: 12 }), art);
        return g;
      });
      pic.replaceChildren(...gs);
      els = tiles.map((t, i) => {
        const name = `${i + 1}: ${t ? t.name : "empty"}`;
        const b = o.onTap ? h("button", { type: "button", "data-i": i, "aria-label": name, onclick: () => !busy && o.onTap(i) }, tileArt(t))
          : h("span", { class: "tilebox", role: "img", "aria-label": name }, tileArt(t));
        return b;
      });
      list.replaceChildren(...els.map((b) => h("li", {}, b)));
    };
    return {
      set(t) { tiles = t.slice(); draw(); },
      /** Highlight tiles: "core" the repeating unit, "mark" the tile being played, "ghost" a hint, "pulse" a place to look. */
      mark(is, cls) { is.forEach((i) => { pic.children[i]?.classList.add(cls); els[i]?.classList.add(cls); }); },
      unmark() { [...pic.children, ...els].forEach((e) => e.classList.remove("core", "mark", "ghost", "pulse")); },
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
          h("button", { id: "check", type: "button", onclick: checkIt }, game.checkLabel || "✓ Check")),
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

  window.LumosKit = { run: (g) => { game = g; }, h, svg, wait, tenFrame, numberPath, numberLine,
    stepper, beadRack, jumpLine, baseTen, tileArt, tileStrip, tone };
})();
