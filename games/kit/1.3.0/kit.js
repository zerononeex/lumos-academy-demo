// Lumos game kit 1.3.0. Shared by every game bundle (docs/GAME_KIT.md): the contract v2 handshake, the narrator, the
// manipulatives (ten-frame, number path, number line, bead rack, jump line, base-ten mat, pattern tiles, stepper), each
// drawn twice (a picture twin you tap and a buttons twin you can use with a keyboard, both writing the same answer), and
// the session flow: Teach (a demonstrator on the same manipulative) → Play (a guided item) → Prove (unaided items), with
// the server's scaffold ladder on a miss. 1.3.0 is 1.1.0 plus the game-feel layer (DESIGN.md, docs/GAME_FEEL_REVIEW.md):
// every press answers at once (the target squashes, a soft tick), a Watch badge while the kit is showing something, a
// Check that shows it is waiting, one sound for right and one kind sound for "look again", "Your turn!" after a
// demonstrator, a goal line on the start screen, drawn icons for the chrome, and the number path as a railway.
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

  // ---------------------------------------------------------------- 1.3.0: drawn icons for the chrome (DESIGN.md)
  // A 24-unit grid, round 2.5 strokes in the text colour. Emoji stay only where they are the content of a game.
  const ICONS = {
    speaker: "M4 9.5h4l5-4v13l-5-4H4z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12",
    undo: "M9 6 4 11l5 5 M4 11h10a5.5 5.5 0 0 1 0 11h-3",
    check: "M4.5 12.5 9.5 17.5 19.5 6.5",
    next: "M5 12h14 M13 6l6 6-6 6",
    play: "M8 5v14l11-7z",
    eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z M12 9.2a2.8 2.8 0 1 0 0.01 0z",
    keys: "M3 6.5h18v11H3z M6.5 10h1 M10 10h1 M13.5 10h1 M17 10h.5 M7.5 14h9",
    picture: "M3.5 5.5h17v13h-17z M3.5 15.5l5-5 4 4 2.5-2.5 5.5 5.5 M15.5 8.6a1.4 1.4 0 1 0 .01 0z",
    star: "M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z",
  };
  const icon = (name) => {
    const s = svg("svg", { viewBox: "0 0 24 24", class: `ico ico-${name}`, "aria-hidden": "true" });
    s.append(svg("path", { d: ICONS[name] }));
    return s;
  };
  /** A chrome label: icon + words (the words stay the accessible name; on a phone some are hidden visually). */
  const withIcon = (name, text) => [icon(name), h("span", { class: "lbl" }, text)];

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
    $("view").replaceChildren(...(buttons ? withIcon("picture", "Picture view") : withIcon("keys", "Buttons view")));
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
      const g = svg("g", o.readOnly ? { class: "cell" } : { "data-i": i, class: "cell" }); // read-only: a picture, not a target
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

  /**
   * The number path (1.3.0: a railway). Stations 0–max in rows that fit the board: up to 11 a row, fewer on a phone so a
   * station is never smaller than a comfortable tap, re-flowed when the board is resized. One rail joins them and runs on
   * into the next row. A piece is a train that glides from station to station, facing the way it goes. The whole column
   * (the train's lane, the station and its mark) is the tap target. Tapped stations get a mark; jumps are arcs over the
   * rail; the target wears a star; the start can be shown. The buttons twin is the same ordered list as in 1.1.0.
   */
  function numberPath(parent, o) {
    const W = 76, S = 60, LANE = 52, RH = 150, M = 26; // column, station, train lane, row height, margin (viewBox units)
    let perRow = 11;
    const fit = () => { // stations per row: as many as fit with each column (the tap target) ≥ 52 px (max 11), rows evened out
      const wide = Math.min((parent.clientWidth || 900) - 8, 940); // the picture's width (kit.css: svg.path)
      const most = Math.max(3, Math.min(11, Math.floor((wide * W / 52 - 2 * M) / W)));
      const rows = Math.ceil((o.max + 1) / most);
      return Math.ceil((o.max + 1) / rows);
    };
    const at = (n) => ({ x: M + (n % perRow) * W, y: 8 + Math.floor(n / perRow) * RH }); // a column's top left
    const mid = (n) => at(n).x + W / 2, railY = (n) => at(n).y + LANE;
    const pic = svg("svg", { class: "visual path", "aria-hidden": "true" });
    const railG = svg("g", { class: "rail" }), arcsG = svg("g", { class: "arcs" }), trainsG = svg("g");
    const list = h("ol", { class: "dom pathlist", "aria-label": o.label });
    const sq = [], btns = [];
    for (let n = 0; n <= o.max; n++) {
      const g = svg("g", { "data-n": n, class: "sq" }), t = svg("text", { x: W / 2, y: LANE + 6 + S / 2 + 11, "text-anchor": "middle" });
      t.textContent = String(n);
      g.append(svg("rect", { class: "hit", x: 0, y: 0, width: W, height: RH - 8 }),
        svg("rect", { class: "station", x: (W - S) / 2, y: LANE + 6, width: S, height: S, rx: 14 }), t,
        svg("circle", { class: "dot", cx: W / 2, cy: LANE + S + 20, r: 7 }),
        svg("path", { class: "starmark", d: "M0-11 3.2-3.4 11.4-3 5-2 7 6.8 0 2.4-7 6.8-5 2-11.4-3-3.2-3.4z", transform: `translate(${W / 2 + S / 2 - 4} ${LANE + 8}) scale(1.5)` }));
      pic.append(g);
      sq.push(g);
      const b = h("button", { type: "button", "data-n": n }, String(n));
      b.onclick = () => !busy && o.onTap(n);
      list.append(h("li", {}, b));
      btns.push(b);
    }
    pic.prepend(railG);
    pic.append(arcsG, trainsG);
    pic.addEventListener("click", (e) => { const g = e.target.closest("[data-n]"); if (g) !busy && o.onTap(Number(g.dataset.n)); });
    arrows(list, 11);
    const said = h("p", { class: "dom jumps" });
    parent.append(h("figure", { class: "manip" }, h("figcaption", {}, o.label), pic, list, said));
    /** A train: original art, facing right; the second train has a roof and a stripe, so they differ by more than colour. */
    const train = (k) => {
      const g = svg("g", { class: `train piece${k}` }), face = svg("g", { class: "face" });
      face.append(svg("rect", { class: "cab", x: -27, y: -40, width: 22, height: 32, rx: 4 }), svg("rect", { class: "win", x: -22, y: -35, width: 12, height: 10, rx: 2 }),
        svg("rect", { class: "body", x: -7, y: -26, width: 33, height: 18, rx: 5 }), svg("rect", { class: "chimney", x: 10, y: -37, width: 8, height: 12, rx: 2 }),
        svg("circle", { class: "lamp", cx: 26, cy: -18, r: 3.5 }),
        ...[-17, 1, 18].map((cx) => svg("circle", { class: "wheel", cx, cy: -6, r: 6 })));
      if (k === 2) face.append(svg("path", { class: "roof", d: "M-31 -40h30" }), svg("path", { class: "stripe", d: "M-5 -17h29" }));
      g.append(face);
      trainsG.append(g);
      return g;
    };
    const pieces = {}, trains = {}, names = { 1: "blue train", 2: "green train" };
    let lastArcs = [[], ""];
    const label = () => btns.forEach((b, n) => {
      const here = Object.entries(pieces).filter(([, p]) => p.n === n).map(([k]) => names[k]);
      b.classList.toggle("here1", pieces[1]?.n === n); b.classList.toggle("here2", pieces[2]?.n === n);
      b.setAttribute("aria-label", `Square ${n}${here.length ? `, ${here.join(" and ")} here` : ""}${sq[n].classList.contains("start") ? ", the start" : ""}${sq[n].classList.contains("star") ? ", the target" : ""}`);
    });
    const place = (k) => {
      const p = pieces[k], t = trains[k] ??= train(k);
      t.setAttribute("visibility", p.n == null ? "hidden" : "visible");
      if (p.n == null) return;
      t.style.transform = `translate(${mid(p.n) + (p.between ? W / 2 : 0) + (k === 2 ? 12 : 0)}px, ${railY(p.n) - (k === 2 ? 4 : 0)}px)`;
      t.firstChild.setAttribute("transform", p.back ? "scale(-1.15 1.15)" : "scale(1.15)");
    };
    const drawArcs = (pairs, cls) => {
      lastArcs = [pairs, cls];
      arcsG.replaceChildren(...pairs.map(([a, b]) => {
        const ya = railY(a) - 44, yb = railY(b) - 44, lift = a === b ? 0 : Math.min(36, 18 + Math.abs(mid(b) - mid(a)) / 6);
        return svg("path", { class: cls, d: `M${mid(a)} ${ya} Q${(mid(a) + mid(b)) / 2} ${Math.min(ya, yb) - lift} ${mid(b)} ${yb}` });
      }));
    };
    function layout() {
      perRow = fit();
      const rows = Math.ceil((o.max + 1) / perRow);
      pic.setAttribute("viewBox", `0 0 ${perRow * W + 2 * M} ${rows * RH}`);
      sq.forEach((g, n) => g.setAttribute("transform", `translate(${at(n).x} ${at(n).y})`));
      // The rail: one track per row. A row that goes on runs out to the right edge with an arrow, and the next row's
      // track comes in from the left edge, the way a line of reading does.
      const d = [], arrowsAt = [];
      for (let r = 0; r < rows; r++) {
        const first = r * perRow, last = Math.min(o.max, first + perRow - 1), y = railY(first);
        d.push(`M${r ? 4 : mid(first) - W / 2 + 6} ${y}H${last < o.max ? perRow * W + 2 * M - 14 : mid(last) + W / 2 - 6}`);
        if (last < o.max) arrowsAt.push(`M${perRow * W + 2 * M - 22} ${y - 9}l9 9-9 9`);
      }
      railG.replaceChildren(svg("path", { class: "ties", d: d.join("") }), svg("path", { class: "track", d: d.join("") }),
        svg("path", { class: "onward", d: arrowsAt.join("") }));
      Object.keys(trains).forEach(place);
      drawArcs(...lastArcs);
    }
    layout();
    const ro = new ResizeObserver(() => { if (!pic.isConnected) return ro.disconnect(); if (fit() !== perRow) layout(); });
    ro.observe(parent);
    label();
    return {
      /** Put a piece (a train) on a station, or (between = true) halfway past it: the "settles between squares" scaffold. */
      piece(k, n, between) {
        const was = pieces[k]?.n;
        pieces[k] = { n, between, back: n != null && was != null && n !== was ? n < was : pieces[k]?.back };
        if (was != null && n != null && n !== was) sfx.step(); // the train chugs to its new station
        place(k);
        label();
      },
      /** Marks: the stations a child tapped. Arcs: jumps between stations (the contrast the counted-start scaffold shows). */
      marks(ns) { [sq, btns].forEach((l) => l.forEach((e, n) => e.classList.toggle("marked", ns.includes(n)))); },
      arcs(pairs, cls = "") {
        drawArcs(pairs, cls);
        said.textContent = pairs.length ? `Jumps: ${pairs.map(([a, b]) => `${a} to ${b}`).join(", ")}.` : "";
      },
      /** Highlights: "hl1"/"hl2" a stretch, "star" the target, "start" where the train starts (kept by unhl). */
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
    // 1.3.0: `more` (a node, e.g. a tile picture) can stand in for the "+" face; the buttons and their names are the same.
    const less = h("button", { type: "button", class: "secondary", "aria-label": `${o.label}: one less` }, "−");
    const more = h("button", { type: "button", class: o.more ? "more" : "secondary", "aria-label": `${o.label}: one more` }, o.more || "+");
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
  /**
   * Play a pitch with on-device Web Audio (no file, no network); silent where the device has no audio. 1.3.0 adds the
   * loudness, the wave and a delay (in ms) for the feedback sounds below; a tile's pitch is called as before.
   */
  let audio = null;
  function tone(hz, ms = 320, vol = 0.2, type = "sine", after = 0) {
    try {
      audio ??= new AudioContext();
      const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + after / 1000;
      osc.type = type;
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
      osc.connect(gain).connect(audio.destination);
      osc.start(t); osc.stop(t + ms / 1000);
    } catch { /* no audio on this device: everything is also shown, and every spoken line captioned */ }
  }
  /**
   * The sound language (DESIGN.md, Sound): defined once, used by every game. Short, soft, never a buzzer. A press ticks;
   * a step on a manipulative chugs; right is a rising three-note chime; "look again" is two soft falling notes; "your
   * turn" is a bright two-note call. None of them is a reward schedule: the same sound every time.
   */
  const sfx = {
    tap: () => tone(880, 60, 0.04, "triangle"),
    step: () => tone(440, 120, 0.07, "triangle"),
    good: () => [523, 659, 784].forEach((hz, i) => tone(hz, i === 2 ? 320 : 170, 0.1, "triangle", i * 110)),
    miss: () => { tone(392, 200, 0.05); tone(330, 280, 0.05, "sine", 170); },
    turn: () => { tone(660, 120, 0.07, "triangle"); tone(990, 200, 0.07, "triangle", 120); },
  };
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
    let tiles = [];
    let els = [];
    // 1.3.0: a long strip wraps into rows (like a line of reading) rather than shrink a tile under 50 px; it re-flows
    // when the board is resized, keeping its marks.
    const layout = () => {
      const per = Math.max(1, Math.min(tiles.length, Math.floor(((parent.clientWidth || 900) - 8) / 52)));
      pic.setAttribute("viewBox", `0 0 ${per * 70 + 6} ${Math.ceil(tiles.length / per) * 76}`);
      pic.style.width = `min(100%, ${per * 70 + 6}px)`;
      [...pic.children].forEach((g, i) => g.setAttribute("transform", `translate(${6 + (i % per) * 70} ${6 + Math.floor(i / per) * 76})`));
    };
    const ro = new ResizeObserver(() => (pic.isConnected ? layout() : ro.disconnect()));
    ro.observe(parent);
    const draw = () => {
      const gs = tiles.map((t, i) => {
        const g = svg("g", { class: "tile", "data-i": i });
        const art = tileArt(t); // a nested svg needs its own box: CSS sizes do not apply inside another svg
        for (const [k, v] of Object.entries({ x: 8, y: 8, width: 48, height: 48 })) art.setAttribute(k, v);
        g.append(svg("rect", { class: "frame", x: -3, y: -3, width: 70, height: 70, rx: 12 }), art);
        return g;
      });
      pic.replaceChildren(...gs);
      layout();
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
  let waiting = false; // 1.3.0: Check pressed, the server's answer not back yet
  const token = () => start.token;
  const feedback = (text, cls = "hint") => { const f = $("feedback"); f.textContent = text || ""; f.className = cls; };
  const saveBoard = () => send({ type: "save", token: token(), state: { item: idx, board: ctl ? ctl.state() : null } });
  function refresh() {
    $("check").disabled = busy || !ctl || !ctl.ready();
    $("undo").disabled = busy || history.length < 2;
    $("again").hidden = !ctl || !ctl.again || busy;
    // 1.3.0: while the kit is showing something (a demonstrator, a scaffold, the praise moment) the Watch badge says so
    $("watch").hidden = !busy || waiting;
    document.body.classList.toggle("busy", busy);
    $("check").classList.toggle("waiting", waiting);
  }

  // 1.3.0: every press answers at once (DESIGN.md, Feedback). On pointer-down (or Enter/Space), before any game logic or
  // server round trip, the thing pressed squashes (a flash for a picture target) and a soft tick plays. A press while the
  // kit is busy is never dead: the Watch badge bounces, so the child sees why nothing moved.
  const TARGETS = "button, [data-i], [data-n], [data-p], .track, input";
  function pressed(e) {
    const t = e.target instanceof Element && e.target.closest(TARGETS);
    if (!t || t.disabled || !$("area")) return;
    if (busy && t.closest("#area, .controls")) return restart($("watch"), "nudge");
    restart(t, "pop");
    sfx.tap();
  }
  const restart = (el, cls) => { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); };
  addEventListener("pointerdown", pressed, true);
  addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") pressed(e); }, true);
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
        h("span", { id: "watch", class: "watch", hidden: true }, icon("eye"), "Watch"),
        h("button", { id: "replay", type: "button", class: "secondary icon", "aria-label": "Hear it again", onclick: () => lastPrompt && say(lastPrompt) }, icon("speaker")),
        h("button", { id: "view", type: "button", class: "secondary", "aria-pressed": "false", onclick: () => setView(!document.body.classList.contains("buttons")) })),
      h("section", { id: "intro", hidden: true },
        // The game's own tile (the same picture as on the child's games page), its name, and its goal in one line.
        h("img", { class: "tile", alt: "", src: `../../icons/${location.pathname.split("/").at(-3)}.svg` }),
        h("h1", { id: "title" }), h("p", { id: "goal" }),
        h("button", { id: "ready", type: "button", class: "big", onclick: ready }, ...withIcon("play", "Start"))),
      h("section", { id: "play", hidden: true },
        h("h2", { id: "stage" }),
        h("div", { id: "area" }),
        h("div", { class: "controls" },
          h("button", { id: "undo", type: "button", class: "secondary", onclick: undo }, ...withIcon("undo", "Undo")),
          h("button", { id: "again", type: "button", class: "secondary", hidden: true, onclick: () => ctl && ctl.again && !busy && ctl.again() }, ...withIcon("eye", "Show me again")),
          h("button", { id: "next", type: "button", hidden: true }, ...withIcon("next", "Next")),
          h("button", { id: "check", type: "button", onclick: checkIt }, ...withIcon(game.checkLabel ? "next" : "check", game.checkLabel || "Check"))),
        h("p", { id: "feedback", role: "status", "aria-live": "polite" })),
      h("p", { id: "turn", class: "turn", hidden: true, "aria-hidden": "true" }, "Your turn!"),
      h("section", { id: "end", hidden: true }, icon("star"), h("h1", {}, "All done!"), h("p", { id: "endline" })));
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
    $("title").textContent = game.title;
    // 1.3.0: what this game is about, in one short line (also spoken); a game whose levels differ names it per item
    const goal = (typeof game.goal === "function" ? game.goal(items[idx]) : game.goal) || "";
    $("goal").textContent = goal;
    prompt(`${game.title}! ${goal ? `${goal} ` : ""}Tap start.`, "");
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
    $("stage").textContent = stage.name; // 1.3.0: words only (the chip is chrome; a stage icon is no longer shown)
    $("area").replaceChildren();
    ctl = game.mount(item, $("area"), api);
    history = [ctl.state()];
    busy = true; refresh();
    const taught = item.model && !misses && !board;
    if (taught) { // Teach: the demonstrator, same task type on the same manipulative (the Watch badge is up)
      prompt(start.skill.workedExample, "");
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
    if (taught) { $("turn").hidden = false; restart($("turn"), "show"); sfx.turn(); } // ...then it fades: "Your turn!"
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
    busy = true; waiting = true; refresh(); // the press shows at once; the answer comes from the server
    seq += 1;
    const fb = await new Promise((resolve) => {
      pending = { seq, resolve };
      send({ type: "attempt", token: token(), seq, verb: "answered", object: { item: idx }, result: { response: ctl.response() } });
    });
    waiting = false; refresh();
    if (finished) return;
    tally.total += 1;
    if (fb.correct) tally.correct += 1;
    if (fb.slowDown) { // no reward, no rung climbed
      feedback("Take your time. Look again, then check.");
      say("Take your time. Look again, then check.");
    } else if (fb.correct) {
      feedback(game.praise(items[idx]), "good");
      say(game.praise(items[idx]));
      sfx.good(); document.body.classList.add("yay"); // the same chime and glow every time: no variable reward
      await ctl.success(fb);
      await wait(start.rewardMs || 0); // the reward moment the bundle declares to the server
      document.body.classList.remove("yay");
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
      sfx.miss(); // kind: two soft notes, never a buzzer; the help comes next
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
    prompt(game.closure, "");
    send({ type: "completed", token: token(), verb: "completed", result: { correct: tally.correct, total: tally.total } });
  }

  window.LumosKit = { run: (g) => { game = g; }, h, svg, wait, tenFrame, numberPath, numberLine,
    stepper, beadRack, jumpLine, baseTen, tileArt, tileStrip, tone, icon };
})();
