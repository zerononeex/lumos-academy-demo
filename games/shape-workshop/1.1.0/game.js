// Shape Workshop 1.1.0: the 1.0.0 game on kit 1.3.0 (the game-feel layer: instant press feedback, Watch badge, sounds, goal line,
// drawn chrome; see DESIGN.md and docs/GAME_FEEL_REVIEW.md). Same items, same responses, same checker as 1.0.0.
// Shape Workshop 1.0.0 (K–3) on kit 1.1.0 + the 1.2.0 layouts. Sort the same set twice by two different rules the child
// chooses (the re-sort is the lesson); fix a picture by putting the right shape in each gap (a turned square is still a
// square); fill an outline with pattern blocks (compose and decompose); slide, flip and turn an L onto its outline with
// buttons, each move named as it happens; the turntable: a shape spins with its name on screen and the child stops it to
// ask "same shape?"; Grade 3: predict which face of a cube net lands opposite the marked face, then watch it fold (a
// pre-computed 2D fold sequence) and unfold. The server decides every answer; this file only presents. Original art.
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- shape art (a 100 × 100 box)
  const HEX = "M92 50 L71 86.4 H29 L8 50 L29 13.6 H71 Z";
  const FLAT = {
    circle: () => [svg("circle", { cx: 50, cy: 50, r: 40 })], triangle: () => [svg("path", { d: "M50 10 L92 84 H8 Z" })],
    square: () => [svg("rect", { x: 15, y: 15, width: 70, height: 70 })], rectangle: () => [svg("rect", { x: 5, y: 28, width: 90, height: 44 })],
    hexagon: () => [svg("path", { d: HEX })], rhombus: () => [svg("path", { d: "M50 6 L76 50 L50 94 L24 50 Z" })],
  };
  const SOLID = {
    cube: () => [svg("rect", { x: 14, y: 34, width: 52, height: 52 }), svg("path", { class: "light", d: "M14 34 L34 14 H86 L66 34 Z" }),
      svg("path", { class: "shade", d: "M66 34 L86 14 V66 L66 86 Z" })],
    sphere: () => [svg("circle", { cx: 50, cy: 50, r: 40 }), svg("ellipse", { class: "light", cx: 38, cy: 36, rx: 14, ry: 9 })],
    cylinder: () => [svg("rect", { x: 22, y: 22, width: 56, height: 58 }), svg("ellipse", { class: "light", cx: 50, cy: 22, rx: 28, ry: 10 }),
      svg("path", { class: "shade", d: "M22 80 A28 10 0 0 0 78 80 V70 A28 10 0 0 1 22 70 Z" })],
    cone: () => [svg("path", { d: "M50 8 L80 80 A30 10 0 0 1 20 80 Z" }), svg("ellipse", { class: "shade", cx: 50, cy: 80, rx: 30, ry: 10 })],
  };
  /** A shape's parts, filled in its colour (the light and shade overlays keep their own fill). */
  const parts = (kind, colour) => (FLAT[kind] || SOLID[kind])().map((e) => { if (!e.getAttribute("class")) e.setAttribute("class", colour || ""); return e; });
  function art(s) {
    const pic = svg("svg", { viewBox: "0 0 100 100", class: "art", "aria-hidden": "true" }), g = svg("g", s.size === "small" ? { transform: "translate(22 22) scale(.56)" } : {});
    g.append(...parts(s.kind, s.colour || "blue"));
    pic.append(g);
    return pic;
  }
  const RULE = { kind: "Shape", colour: "Colour", size: "Size", solid: "Flat or solid", rolls: "Rolls or not" };
  const PLURAL = { circle: "circles", triangle: "triangles", square: "squares", rectangle: "rectangles", hexagon: "hexagons", rhombus: "rhombuses",
    cube: "cubes", sphere: "spheres", cylinder: "cylinders", cone: "cones" };
  const ATTRS = { circle: "round, no corners", triangle: "3 sides and 3 corners", square: "4 equal sides and 4 square corners",
    rectangle: "4 sides, 2 long and 2 short, and 4 square corners", hexagon: "6 sides and 6 corners", rhombus: "4 equal sides, 2 pointy corners and 2 wide corners" };
  const named = (s) => [s.size, s.colour, s.kind].filter(Boolean).join(" ");

  // ---------------------------------------------------------------- Sort it two ways
  function sorter(item, area, api) {
    let way = 0, rules = [null, null], groups = [item.shapes.map(() => -1), item.shapes.map(() => -1)], shapes = item.shapes, pulse = [];
    const values = (r) => item.rules.find(([k]) => k === r)?.[1] || [];
    const done = (w) => rules[w] && groups[w].every((g) => g >= 0);
    function draw() {
      const f = document.activeElement, keep = area.contains(f) && ["i", "rule", "way"].find((k) => k in f.dataset); // keyboard focus survives a redraw
      const sel = keep && `[data-${keep}="${f.dataset[keep]}"]`;
      area.replaceChildren();
      const waysBar = h("div", { class: "ways", role: "group", "aria-label": "Two ways to sort" },
        ...[0, 1].map((w) => h("button", { type: "button", "aria-pressed": String(way === w), "data-way": w, onclick: () => { way = w; draw(); } },
          `${w ? "2nd" : "1st"} way${rules[w] ? `: ${RULE[rules[w]].toLowerCase()}` : ""}${done(w) ? " ✓" : ""}`)));
      const rulesBar = h("div", { class: "rules", role: "group", "aria-label": "Sort by" }, h("span", { class: "steplabel" }, "Sort by:"),
        ...item.rules.map(([k]) => h("button", { type: "button", "aria-pressed": String(rules[way] === k), "data-rule": k,
          onclick: () => { if (rules[way] !== k) { rules[way] = k; groups[way] = shapes.map(() => -1); draw(); api.say(`Sort by ${RULE[k].toLowerCase()}.`); api.changed(); } } }, RULE[k])));
      area.append(waysBar, rulesBar);
      const bins = h("div", { class: "bins" });
      const btn = (i) => {
        const g = groups[way][i], where = g < 0 ? "not sorted yet" : `in the group: ${values(rules[way])[g]}`;
        return h("button", { type: "button", class: `shapebtn${pulse.includes(`${way}:${i}`) ? " pulse" : ""}`, "data-i": i, "aria-label": `${named(shapes[i])}, ${where}`,
          onclick: () => tap(i) }, art(shapes[i]));
      };
      if (rules[way]) values(rules[way]).forEach((v, b) => bins.append(h("figure", { class: "bin", role: "group", "aria-label": v },
        h("h3", {}, v === "does not roll" ? "does not roll" : PLURAL[v] || v), ...shapes.map((_, i) => i).filter((i) => groups[way][i] === b).map(btn))));
      bins.append(h("figure", { class: "bin tray", role: "group", "aria-label": "Not sorted yet" }, h("h3", {}, rules[way] ? "Tap a shape to move it to a group" : "Pick a way to sort"),
        ...shapes.map((_, i) => i).filter((i) => !rules[way] || groups[way][i] < 0).map(btn)));
      area.append(bins);
      if (sel) area.querySelector(sel)?.focus();
      api.refresh();
    }
    function tap(i) {
      if (!rules[way]) return api.say("First pick a way to sort.");
      const n = values(rules[way]).length, g = groups[way][i];
      groups[way][i] = g + 1 >= n ? -1 : g + 1; // tray → first group → next group … → tray
      pulse = [];
      api.say(groups[way][i] < 0 ? "Back to the tray." : values(rules[way])[groups[way][i]]);
      if (done(0) && way === 0 && !rules[1]) api.say("Now tap 2nd way, and sort them again a new way.");
      draw(); api.changed();
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Sort the shapes. Then sort them again a new way.", "🔷"); },
      ready: () => done(0) && done(1),
      response: () => ({ rules: rules.slice(), groups: groups.map((g) => g.slice()) }),
      state: () => ({ way, rules: rules.slice(), groups: groups.map((g) => g.slice()) }),
      restore(s) { way = s.way || 0; rules = s.rules ? s.rules.slice() : [null, null]; groups = s.groups ? s.groups.map((g) => g.slice()) : [shapes.map(() => -1), shapes.map(() => -1)]; pulse = []; draw(); },
      async model() { // a different set (every colour swapped), sorted one way, then another
        shapes = item.shapes.map((s) => ({ ...s, ...(s.colour ? { colour: s.colour === "blue" ? "orange" : "blue" } : {}) }));
        const [a, b] = item.rules.map(([k]) => k).filter((k) => k !== "kind").concat("kind");
        for (const [w, r] of [[0, a], [1, b]]) {
          way = w; rules[w] = r; draw();
          api.say(`Watch me sort by ${RULE[r].toLowerCase()}.`); await wait(2200);
          for (const [i, s] of shapes.entries()) { groups[w][i] = values(r).indexOf(s[r]); draw(); await wait(500); }
          await wait(1200);
        }
        api.say("The same shapes, sorted two ways. Now it's your turn."); await wait(2800);
        shapes = item.shapes; way = 0; rules = [null, null]; groups = [shapes.map(() => -1), shapes.map(() => -1)]; draw();
      },
      async help(level, fb) {
        const wrong = [0, 1].flatMap((w) => (rules[w] ? groups[w].flatMap((g, i) => (g !== values(rules[w]).indexOf(shapes[i][rules[w]]) ? [`${w}:${i}`] : [])) : []));
        if (fb.misconception === "same_rule") { way = 1; rules[1] = null; groups[1] = shapes.map(() => -1); }
        else { pulse = wrong; way = Number((wrong[0] || "0:0")[0]); }
        draw();
        api.say(fb.feedback || "Look at the groups again.");
        await wait(2500);
        if (level >= 2 && wrong.length && fb.misconception !== "same_rule") { // partial model: one shape moved to its group for you
          const [w, i] = wrong[0].split(":").map(Number);
          groups[w][i] = values(rules[w]).indexOf(shapes[i][rules[w]]); pulse = wrong.slice(1); draw();
          api.say(`This one goes with the ${values(rules[w])[groups[w][i]]}.`); await wait(2000);
        }
        api.prompt("Try again. Sort them two different ways.", "🔷");
      },
      async worked(sol) {
        for (const w of [0, 1]) {
          way = w; rules[w] = sol.rules[w]; groups[w] = shapes.map(() => -1); draw(); await wait(900);
          for (const [i, g] of sol.groups[w].entries()) { groups[w][i] = g; draw(); await wait(400); }
          api.say(`Sorted by ${RULE[sol.rules[w]].toLowerCase()}.`); await wait(1800);
        }
      },
      async success() { api.say(`Two ways: by ${RULE[rules[0]].toLowerCase()}, and by ${RULE[rules[1]].toLowerCase()}. Same shapes, new groups!`); await wait(2500); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Fix the picture (gaps in a scene)
  /** A shape drawn into a 400 × 300 board, centred at x, y, turned r degrees, about 90 wide. */
  function placed(kind, x, y, r, cls) {
    const g = svg("g", { transform: `translate(${x} ${y}) rotate(${r}) scale(.9) translate(-50 -50)` });
    g.append(...(FLAT[kind] || SOLID[kind])().map((e) => { e.setAttribute("class", cls); return e; }));
    return g;
  }
  function scene(item, area, api) {
    let gaps = item.gaps, fill = gaps.map(() => ""), at = 0, pulse = [];
    const pic = svg("svg", { viewBox: "0 0 400 300", class: "visual board", "aria-hidden": "true" });
    pic.addEventListener("click", (e) => { const g = e.target.closest("[data-i]"); if (g) { at = Number(g.dataset.i); draw(); } });
    const list = h("ul", { class: "dom shapelist", "aria-label": "The gaps" });
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Fix the picture"), pic, list));
    area.append(h("div", { class: "palette", role: "group", "aria-label": "Shapes" },
      ...item.kinds.map((k) => h("button", { type: "button", "data-kind": k, onclick: () => put(k) }, art({ kind: k, colour: "orange" }), k))));
    function draw() {
      pic.replaceChildren(...gaps.map((g, i) => {
        const el = svg("g", { class: `gapg${i === at ? " selected" : ""}${pulse.includes(i) ? " pulse" : ""}`, "data-i": i });
        el.append(placed(g.k, g.x, g.y, g.r, "gap"));
        if (fill[i]) el.append(placed(fill[i], g.x, g.y, g.r, "piece orange"));
        return el;
      }));
      list.replaceChildren(...gaps.map((g, i) => h("li", {}, h("button", { type: "button", "aria-pressed": String(i === at), onclick: () => { at = i; draw(); } },
        `Gap ${i + 1}: ${ATTRS[g.k]}${g.r % 90 ? ", turned" : ""}. ${fill[i] ? `Filled with a ${fill[i]}.` : "Empty."}`))));
      api.refresh();
    }
    function put(k) {
      fill[at] = k; pulse = pulse.filter((i) => i !== at);
      api.say(k);
      const next = fill.findIndex((f, i) => !f && i !== at);
      if (next >= 0) at = next;
      draw(); api.changed();
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Fix the picture. Tap a gap, then the shape that fits it.", "🖼️"); },
      ready: () => fill.every(Boolean),
      response: () => ({ fill: fill.slice() }),
      state: () => ({ fill: fill.slice(), at }),
      restore(s) { fill = s.fill ? s.fill.slice() : gaps.map(() => ""); at = s.at || 0; pulse = []; draw(); },
      async model() { // a different little picture: a turned square and a triangle
        gaps = [{ k: "square", x: 120, y: 150, r: 45 }, { k: "triangle", x: 290, y: 150, r: 0 }]; fill = ["", ""]; at = 0; draw();
        api.say("Watch me. This gap has 4 equal sides and 4 square corners. It is turned, but it is still a square."); await wait(4200);
        fill[0] = "square"; draw(); await wait(1500);
        api.say("This one has 3 sides and 3 corners: a triangle."); await wait(2600);
        fill[1] = "triangle"; draw(); await wait(1500);
        api.say("Now it's your turn."); await wait(1500);
        gaps = item.gaps; fill = gaps.map(() => ""); at = 0; draw();
      },
      async help(level, fb) {
        pulse = gaps.flatMap((g, i) => (fill[i] !== g.k ? [i] : [])); at = pulse[0] ?? 0; draw();
        api.say(fb.feedback || "Look at the sides and corners of each gap.");
        await wait(2800);
        if (level >= 2 && pulse.length) { // partial model: one gap filled for you
          const i = pulse.shift(); fill[i] = gaps[i].k; draw();
          api.say(`This gap has ${ATTRS[gaps[i].k]}: a ${gaps[i].k}.`); await wait(2600);
        }
        api.prompt("Try again. Which shape fits each gap?", "🖼️");
      },
      async worked(sol) {
        for (const [i, k] of sol.fill.entries()) { at = i; fill[i] = k; draw(); api.say(`${ATTRS[k]}: a ${k}.`); await wait(2200); }
      },
      async success() { pulse = []; api.say("The picture is fixed!"); await wait(1800); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Fill the outline (pattern blocks)
  // The hexagon is six triangles round its middle; blocks cover them in turn (rhombus 2, trapezoid 3, hexagon 6), so every
  // way of filling it can be drawn. The trapezoid is half of it. A block that does not fit hangs over, drawn outside.
  const BLOCKS = [[1, "triangle", "green"], [2, "rhombus", "blue"], [3, "trapezoid", "orange"], [6, "hexagon", "orange"]];
  const C = [200, 150], R = 110, V = Array.from({ length: 7 }, (_, k) => [C[0] + R * Math.cos((Math.PI / 3) * (k - 3)), C[1] + R * Math.sin((Math.PI / 3) * (k - 3))]);
  const poly = (from, n, dx = 0) => `M${(n === 6 ? V.slice(1) : [C, ...V.slice(from, from + n + 1)]).map(([x, y]) => `${x + dx} ${y}`).join(" L")} Z`;
  function icon(n, colour) { // the block alone, centred in its button
    const pts = [C, ...V.slice(0, n + 1)], xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 12;
    const x = (Math.min(...xs) + Math.max(...xs) - side) / 2, y = (Math.min(...ys) + Math.max(...ys) - side) / 2;
    const s = svg("svg", { viewBox: `${x} ${y} ${side} ${side}`, class: "art", "aria-hidden": "true" });
    s.append(svg("path", { class: `piece ${colour}`, d: poly(0, n) }));
    return s;
  }
  function filler(item, area, api) {
    let pieces = [], ghost = null, pulse = false;
    const pic = svg("svg", { viewBox: "0 0 560 300", class: "visual board", "aria-hidden": "true" });
    const said = h("p", { class: "dom shapetext", "aria-live": "polite" }), count = h("p", { class: "count", "aria-live": "polite" });
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, item.n === 6 ? "The hexagon" : "The trapezoid"), pic, said), count);
    area.append(h("div", { class: "palette", role: "group", "aria-label": "Pattern blocks" }, ...BLOCKS.map(([n, name, colour]) =>
      h("button", { type: "button", "data-block": n, onclick: () => { pieces.push(n); ghost = null; api.say(name); draw(); api.changed(); } },
        icon(n, colour), name))));
    const name = (n) => BLOCKS.find(([k]) => k === n)[1];
    function draw() {
      const kids = Array.from({ length: item.n }, (_, k) => svg("path", { class: `wedge${pulse && k >= used() ? " pulse" : ""}`, d: poly(k, 1) }));
      let at = 0, extra = 0;
      for (const n of pieces) {
        if (at + n <= item.n) kids.push(svg("path", { class: `piece ${BLOCKS.find(([k]) => k === n)[2]}`, d: poly(at, n) }));
        else { kids.push(svg("path", { class: "piece extra", d: poly(0, n, 240 + extra) })); extra += 40; }
        at += n;
      }
      if (ghost) kids.push(svg("path", { class: "piece ghost", d: poly(used(), ghost) }));
      kids.push(svg("path", { class: "outline", d: poly(0, item.n) }));
      pic.replaceChildren(...kids);
      const over = used() > item.n;
      count.textContent = `Blocks: ${pieces.length} of ${item.count}`;
      said.textContent = `${pieces.length ? `Blocks in: ${pieces.map(name).join(", ")}.` : "No blocks yet."} ${over ? "A block hangs over the edge." : used() === item.n ? "It is full." : "There is still a gap."}`;
      api.refresh();
    }
    const used = () => pieces.reduce((s, n) => s + n, 0);
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`Fill the ${item.n === 6 ? "hexagon" : "trapezoid"} with ${item.count} blocks.`, "🔶"); },
      ready: () => pieces.length > 0,
      response: () => ({ pieces: pieces.slice() }),
      state: () => ({ pieces: pieces.slice() }),
      restore(s) { pieces = (s.pieces || []).slice(); ghost = null; pulse = false; draw(); },
      async model() { // the same outline with a different number of blocks
        const n = item.count > 2 ? item.count - 1 : item.count + 1, way = { 1: [6], 2: [3, 3], 3: [3, 2, 1], 4: [2, 2, 1, 1], 5: [2, 1, 1, 1, 1], 6: [1, 1, 1, 1, 1, 1] }[n];
        const blocks = item.n === 6 ? way : { 1: [3], 2: [2, 1], 3: [1, 1, 1] }[Math.min(n, 3)];
        api.say(`Watch me fill it with ${blocks.length} blocks.`); await wait(2200);
        for (const b of blocks) { pieces.push(b); draw(); api.say(name(b)); await wait(1300); }
        api.say("Full, no gaps, nothing hanging over. Now it's your turn."); await wait(2800);
        pieces = []; draw();
      },
      async help(level, fb) {
        pulse = fb.misconception === "gap_left"; draw();
        api.say(fb.feedback || "Look at the outline again.");
        await wait(2600);
        pulse = false;
        if (used() >= item.n || pieces.length >= item.count) pieces = []; // nothing more can go in: start again
        if (level >= 2) { // partial model: the next block drawn as an outline
          const left = item.n - Math.min(used(), item.n), want = [6, 3, 2, 1].find((b) => b <= left && (item.count - pieces.length > 1 ? b < left : b === left));
          ghost = used() < item.n ? want || null : null;
          if (ghost) api.say(`Try a ${name(ghost)} next.`);
        }
        draw();
        api.prompt(`Try again. Fill it with ${item.count} blocks.`, "🔶");
      },
      async worked(sol) {
        pieces = []; ghost = null; draw();
        for (const b of sol.pieces) { pieces.push(b); draw(); api.say(name(b)); await wait(1400); }
        api.say(`${sol.pieces.length} blocks fill it exactly.`); await wait(2000);
      },
      async success() { api.say(`${pieces.length} blocks: ${pieces.map(name).join(", ")}. It's full!`); await wait(2200); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Slide, flip, turn
  const L_SHAPE = [[0, 0], [0, 1], [0, 2], [1, 2]], GRID = [6, 4], CELL = 60;
  function shapeOf(r, f) { // the same rules as the server (src/lib/items.ts poseShape)
    let cells = L_SHAPE.map(([x, y]) => (f ? [-x, y] : [x, y]));
    for (let k = 0; k < r; k++) cells = cells.map(([x, y]) => [-y, x]);
    const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]);
  }
  function clamp([x, y, r, f]) {
    const c = shapeOf(r, f), w = Math.max(...c.map((p) => p[0])) + 1, hh = Math.max(...c.map((p) => p[1])) + 1;
    return [Math.min(x, GRID[0] - w), Math.min(y, GRID[1] - hh), r, f];
  }
  function move(p, m) {
    const [x, y, r, f] = p, d = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[m];
    if (d) { const q = clamp([Math.max(0, x + d[0]), Math.max(0, y + d[1]), r, f]); return q[0] === x + d[0] && q[1] === y + d[1] ? q : p; }
    return clamp(m === "t" ? [x, y, (r + 1) % 4, f] : [x, y, r, 1 - f]);
  }
  const MOVES = { l: ["⬅", "Slide left"], u: ["⬆", "Slide up"], r: ["➡", "Slide right"], f: ["↔", "Flip"], d: ["⬇", "Slide down"], t: ["↻", "Turn"] };
  const TURNS = ["not turned", "turned a quarter turn", "turned a half turn", "turned three quarter turns"];
  function mover(item, area, api) {
    let moves = [], goal = item.goal, start = item.pose, ghost = null, pulse = false;
    const pose = () => moves.reduce(move, start);
    const pic = svg("svg", { viewBox: `-10 -10 ${GRID[0] * CELL + 20} ${GRID[1] * CELL + 20}`, class: "visual board mover", "aria-hidden": "true" });
    const said = h("p", { class: "dom shapetext", "aria-live": "polite" });
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Move the L onto the outline"), pic, said));
    const pad = h("div", { class: "moves", role: "group", "aria-label": "Moves" }, ...Object.entries(MOVES).map(([m, [icon, words]]) =>
      h("button", { type: "button", "data-move": m, "aria-label": words, onclick: () => {
        const before = pose().join(); moves.push(m);
        if (pose().join() === before && "lrud".includes(m)) { moves.pop(); api.say("No room to slide that way."); return; }
        api.say(words); draw(); api.changed();
      } }, `${icon} ${words}`)));
    area.append(pad);
    const cellsOf = (p) => shapeOf(p[2], p[3]).map(([x, y]) => [x + p[0], y + p[1]]);
    const shape = (p, cls) => {
      const g = svg("g", { class: cls });
      cellsOf(p).forEach(([x, y], k) => { g.append(svg("rect", { x: x * CELL + 3, y: y * CELL + 3, width: CELL - 6, height: CELL - 6, rx: 6 }));
        if (k === 3 && cls === "lshape") g.append(svg("circle", { class: "foot", cx: x * CELL + CELL / 2, cy: y * CELL + CELL / 2, r: 9 })); });
      return g;
    };
    const where = (p) => `column ${p[0] + 1}, row ${p[1] + 1}, ${TURNS[p[2]]}${p[3] ? ", flipped" : ""}`;
    function draw() {
      const grid = svg("g", { class: "grid" });
      for (let x = 0; x <= GRID[0]; x++) grid.append(svg("line", { x1: x * CELL, y1: 0, x2: x * CELL, y2: GRID[1] * CELL }));
      for (let y = 0; y <= GRID[1]; y++) grid.append(svg("line", { x1: 0, y1: y * CELL, x2: GRID[0] * CELL, y2: y * CELL }));
      const goalG = svg("g", { class: pulse ? "goal pulse" : "goal" });
      cellsOf(goal).forEach(([x, y]) => goalG.append(svg("rect", { class: pulse ? "goal pulse" : "goal", x: x * CELL + 3, y: y * CELL + 3, width: CELL - 6, height: CELL - 6, rx: 6 })));
      pic.replaceChildren(grid, goalG, ...(ghost ? [shape(ghost, "lshape ghost")] : []), shape(pose(), "lshape"));
      said.textContent = `The L is at ${where(pose())}. The outline is at ${where(goal)}. ${moves.length ? `Moves: ${moves.map((m) => MOVES[m][1].toLowerCase()).join(", ")}.` : ""}`;
      api.refresh();
    }
    /** The fewest moves from a pose to the goal (breadth-first, as the server's worked solution). */
    function path(from) {
      const seen = new Map([[from.join(), []]]), queue = [from];
      const key = (p) => cellsOf(p).map((c) => c.join()).sort().join(" ");
      while (queue.length) {
        const p = queue.shift();
        if (key(p) === key(goal)) return seen.get(p.join());
        for (const m of "lrudft") { const q = move(p, m); if (!seen.has(q.join())) { seen.set(q.join(), [...seen.get(p.join()), m]); queue.push(q); } }
      }
      return [];
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Slide, flip and turn the L until it fits the outline.", "🔄"); },
      ready: () => moves.length > 0,
      response: () => ({ moves: moves.slice() }),
      state: () => ({ moves: moves.slice() }),
      restore(s) { moves = (s.moves || []).slice(); ghost = null; pulse = false; draw(); },
      async model() { // the same L to a different outline: one turn and one slide
        goal = clamp(move(move(start, "t"), start[0] > 2 ? "l" : "r")); draw();
        api.say("Watch me. Each move has a name."); await wait(2200);
        for (const m of path(start)) { moves.push(m); draw(); api.say(MOVES[m][1]); await wait(1500); }
        api.say("It fits! Now it's your turn."); await wait(2200);
        goal = item.goal; moves = []; draw();
      },
      async help(level, fb) {
        pulse = true; draw();
        api.say(fb.feedback || "Look at the outline. Which way does it face?");
        await wait(2600);
        pulse = false; moves = []; // back to the start, with the outline where it was
        if (level >= 2) { // partial model: the next move drawn as an outline, and named
          const next = path(pose())[0];
          if (next) { ghost = move(pose(), next); api.say(`Try: ${MOVES[next][1].toLowerCase()}.`); }
        }
        draw();
        api.prompt("Try again. Slide, flip and turn it onto the outline.", "🔄");
      },
      async worked(sol) {
        moves = []; ghost = null; draw(); await wait(800);
        for (const m of sol.moves) { moves.push(m); draw(); api.say(MOVES[m][1]); await wait(1400); }
        api.say("It fits the outline."); await wait(1800);
      },
      async success() {
        const used = ["Slide", "Flip", "Turn"].filter((k) => moves.some((m) => MOVES[m][1].startsWith(k)));
        api.say(`It fits! You used: ${used.join(", ").toLowerCase()}.`); await wait(2200);
      },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- The turntable: same shape?
  function turntable(item, area, api) {
    let same = [], angle = 0, spinning = false, timer = null, kind = item.other || item.shape;
    const disc = (spin) => {
      const s = svg("svg", { viewBox: "0 0 200 200", class: "visual turn", "aria-hidden": "true" }), g = svg("g", { class: "spin" });
      s.append(svg("circle", { class: "disc", cx: 100, cy: 100, r: 94 }), g);
      return [s, g];
    };
    const [refPic, refG] = disc(), [pic, spinG] = disc();
    refG.append(placed(item.shape, 100, 100, 0, "piece blue"));
    const said = h("p", { class: "dom shapetext", "aria-live": "polite" });
    const figs = h("div", { class: "row" },
      h("figure", { class: "manip" }, h("figcaption", {}, "This shape"), refPic, h("p", { class: "name" }, item.shape)),
      h("figure", { class: "manip" }, h("figcaption", {}, "The turntable"), pic, h("p", { class: "name" }, kind)));
    const buttons = h("div", { class: "palette" });
    area.append(figs, said, buttons);
    const rot = () => { spinG.replaceChildren(placed(kind, 100, 100, angle, "piece orange")); };
    function spin() {
      if (spinning) return;
      spinning = true; draw();
      timer = setInterval(() => { if (!pic.isConnected) return clearInterval(timer); angle = (angle + (reduced ? 45 : 3)) % 360; rot(); }, reduced ? 900 : 50);
    }
    function stop() { clearInterval(timer); spinning = false; if (angle % 90 === 0) { angle += 30; rot(); } api.say(`Stopped. Is it the same shape? Its name is still ${kind}.`); draw(); }
    function answer(v) { same.push(v); api.say(v ? "Same shape." : "Different shape."); api.changed(); if (same.length < item.checks) spin(); else draw(); }
    function draw() {
      const left = item.checks - same.length;
      buttons.replaceChildren(...(left <= 0 ? [] : spinning ? [h("button", { type: "button", "data-turn": "stop", onclick: stop }, "⏸ Stop")]
        : [h("button", { type: "button", "data-turn": "same", onclick: () => answer(true) }, "✔ Same shape"),
          h("button", { type: "button", "data-turn": "different", class: "secondary", onclick: () => answer(false) }, "✘ Different shape")]));
      said.textContent = `This shape: a ${item.shape}, upright. The turntable: a ${kind}, ${spinning ? "spinning" : `stopped, turned ${angle} degrees`}. ${same.length ? `Your answers: ${same.map((v) => (v ? "same" : "different")).join(", ")}.` : ""}`;
      api.refresh();
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Watch it turn. Stop it, then say: same shape?", "🎠"); spin(); },
      ready: () => same.length === item.checks,
      response: () => ({ same: same.slice() }),
      state: () => ({ same: same.slice() }),
      restore(s) { same = (s.same || []).slice(); clearInterval(timer); spinning = false; rot(); draw(); },
      async model() {
        kind = item.shape; rot(); spin(); api.say(`Watch the ${kind} turn. Its name stays the same.`); await wait(2600);
        stop(); await wait(1500);
        api.say(`Turned, it is still a ${kind}. Same shape. Now it's your turn.`); await wait(3000);
        kind = item.other || item.shape; angle = 0; rot(); same = []; draw();
      },
      async help(level, fb) {
        clearInterval(timer); spinning = false;
        api.say(fb.feedback || "Look again.");
        while (angle) { angle = angle + 15 >= 360 ? 0 : angle + 15; rot(); await wait(reduced ? 0 : 60); } // turned back upright, beside the other
        rot(); await wait(1200);
        if (level >= 2) { api.say(item.other ? `Upright, look at the sides: a ${item.shape} and a ${kind}.` : `Upright again: a ${kind}, just like this one.`); await wait(2800); }
        same = []; draw();
        api.prompt("Try again. Spin it, stop it: same shape?", "🎠");
        spin();
      },
      async worked(sol) { clearInterval(timer); spinning = false; same = sol.same.slice(); draw(); api.say(item.other ? `A ${kind} is a different shape from a ${item.shape}, however it turns.` : `Turning never changes it: still a ${kind}.`); await wait(3000); },
      async success() { clearInterval(timer); spinning = false; draw(); api.say(item.other ? `Yes: a ${kind} is not a ${item.shape}.` : `Yes: turned, it is still a ${kind}.`); await wait(2200); },
    };
    rot(); draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Fold the net (Grade 3)
  const SIDES = ["bottom", "top", "front", "back", "left", "right"];
  function netter(item, area, api) {
    const S = 80, P = 6, net = item.net, W = Math.max(...net.map((c) => c[0])) + 1, Hh = Math.max(...net.map((c) => c[1])) + 1;
    let pick = null, mark = item.mark, grey = [], cube = null;
    const pic = svg("svg", { viewBox: `0 0 ${W * S + 2 * P} ${Hh * S + 2 * P}`, class: "visual board", "aria-hidden": "true" });
    pic.addEventListener("click", (e) => { const g = e.target.closest("[data-i]"); if (g) choose(Number(g.dataset.i)); });
    const list = h("ul", { class: "dom shapelist", "aria-label": "The faces" });
    const said = h("p", { class: "dom shapetext", "aria-live": "polite" });
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "The net"), pic, list, said));
    const letter = (i) => "ABCDEF"[i];
    const faces = net.map(([x, y], i) => {
      const g = svg("g", { class: "face", "data-i": i });
      g.append(svg("rect", { x: P + x * S, y: P + y * S, width: S, height: S }), svg("text", { x: P + x * S + S / 2, y: P + y * S + S / 2 + 11, "text-anchor": "middle" }));
      return g;
    });
    // The fold order: out from the face that becomes the bottom, each face hinged on the edge it shares with the face
    // before it. Each face's group holds the faces hinged on it, so folding it carries the ones already folded onto it.
    const base = item.fold.indexOf("bottom"), order = [base], hinge = {};
    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      net.forEach(([x, y], j) => {
        if (order.includes(j) || Math.abs(x - net[i][0]) + Math.abs(y - net[i][1]) !== 1) return;
        order.push(j); faces[i].append(faces[j]);
        hinge[j] = [P + Math.max(x, net[i][0]) * S + (x === net[i][0] ? S / 2 : 0), P + Math.max(y, net[i][1]) * S + (y === net[i][1] ? S / 2 : 0), x === net[i][0]];
      });
    }
    function choose(i) { if (i === mark) return; pick = i; api.say(`Face ${letter(i)}.`); draw(); api.changed(); }
    function draw() {
      faces.forEach((g, i) => {
        g.setAttribute("class", `face${i === mark ? " mark" : ""}${i === pick ? " pick" : ""}${grey.includes(i) ? " grey" : ""}`);
        g.children[1].textContent = `${letter(i)}${i === mark ? "★" : ""}`;
      });
      pic.replaceChildren(cube || faces[base]); // folded up, the cube shows instead of the net
      list.replaceChildren(...net.map(([x, y], i) => h("li", {}, h("button", { type: "button", "aria-pressed": String(i === pick), disabled: i === mark, onclick: () => choose(i) },
        `Face ${letter(i)}${i === mark ? " (marked ★)" : ""}: row ${y + 1}, column ${x + 1}${grey.includes(i) ? ", touches ★" : ""}`))));
      said.textContent = pick === null ? "No face picked yet." : `You picked face ${letter(pick)}.`;
      api.refresh();
    }
    /** Fold it up face by face (pre-computed 2D steps), show the cube with its faces, then unfold. */
    async function fold(say) {
      for (const j of order.slice(1).reverse()) { // the outside faces first
        const [hx, hy, vertical] = hinge[j], g = faces[j];
        g.classList.add("folding");
        g.style.transformOrigin = `${hx}px ${hy}px`;
        g.style.transform = vertical ? "scale(1, 0.12)" : "scale(0.12, 1)";
        await wait(reduced ? 150 : 650);
      }
      const at = (side) => letter(item.fold.indexOf(side)) + (item.fold.indexOf(side) === mark ? "★" : "");
      // The cube from two sides (front, top, right; then turned round: back, bottom, left), so a face and the one
      // across from it can both be seen.
      const s = 66, d = 26, opp = item.fold.indexOf(OPPOSITE[item.fold[mark]]), y0 = P + (Hh * S - s + d) / 2;
      cube = svg("g", { class: "cube" }); // drawn where the net folded up
      [["front", "top", "right"], ["back", "bottom", "left"]].forEach(([f, t, r], k) => {
        const x0 = P + W * S / 2 + (k ? 12 : -12 - s - d);
        const face = (dpath, side, tx, ty) => {
          const i = item.fold.indexOf(side), txt = svg("text", { x: tx, y: ty, "text-anchor": "middle" });
          txt.textContent = at(side);
          return [svg("path", { d: dpath, class: i === mark ? "mark" : i === opp ? "opp" : "" }), txt];
        };
        cube.append(...face(`M${x0} ${y0} h${s} v${s} h${-s} Z`, f, x0 + s / 2, y0 + s / 2 + 10),
          ...face(`M${x0} ${y0} l${d} ${-d} h${s} l${-d} ${d} Z`, t, x0 + s / 2 + d / 2, y0 - d / 2 + 8),
          ...face(`M${x0 + s} ${y0} l${d} ${-d} v${s} l${-d} ${d} Z`, r, x0 + s + d / 2, y0 + s / 2));
      });
      draw();
      if (say) api.say(`Folded. ${at(item.fold[mark])} is on the ${item.fold[mark]}. Across from it, on the ${OPPOSITE[item.fold[mark]]}, is face ${letter(opp)}.`);
      await wait(3600);
      cube = null; draw();
      for (const j of order.slice(1)) { faces[j].style.transform = ""; await wait(reduced ? 100 : 500); } // unfold, from the bottom face out
      await wait(reduced ? 0 : 300); faces.forEach((g) => g.classList.remove("folding")); draw();
    }
    const OPPOSITE = { bottom: "top", top: "bottom", front: "back", back: "front", left: "right", right: "left" };
    const touching = (i) => net.flatMap(([x, y], j) => (Math.abs(x - net[i][0]) + Math.abs(y - net[i][1]) === 1 ? [j] : []));
    const ctl = {
      begin(retry) { if (!retry) api.prompt("This net folds into a cube. Which face will be opposite the ★ face? Tap it.", "🧊"); },
      ready: () => pick !== null,
      response: () => ({ face: pick }),
      state: () => ({ pick }),
      restore(s) { pick = s.pick ?? null; grey = []; draw(); },
      async model() { // another face of the same net (never the ★ face or its opposite)
        const other = SIDES.map((sd) => item.fold.indexOf(sd)).find((i) => i !== item.mark && item.fold[i] !== OPPOSITE[item.fold[item.mark]]);
        mark = other; draw();
        api.say(`Watch me fold it. Where does face ${letter(other)} go, and what is across from it?`); await wait(3000);
        await fold(true);
        api.say("Now it's your turn, with the ★ face."); await wait(2200);
        mark = item.mark; draw();
      },
      async help(level, fb) {
        api.say(fb.feedback || "Watch it fold."); await wait(2400);
        await fold(false); // watch where the faces land, then it unfolds again
        if (level >= 2) { grey = touching(mark); api.say("The grey faces touch the ★ face, so they can't be opposite."); await wait(2600); }
        pick = null; draw();
        api.prompt("Try again. Which face is opposite the ★ face?", "🧊");
      },
      async worked(sol) { pick = sol.face; draw(); await fold(true); },
      async success() { await fold(true); },
    };
    draw();
    return ctl;
  }

  K.run({
    goal: "Sort, fit and turn the shapes.",
    title: "Shape Workshop",
    closure: "All done! You worked with lots of shapes today.",
    stages: {
      shape_sort: { name: "Sort it two ways" }, shape_scene: { name: "Fix the picture" }, shape_fill: { name: "Fill the outline" },
      shape_move: { name: "Slide, flip, turn" }, shape_turn: { name: "The turntable" }, shape_net: { name: "Fold the net" },
    },
    praise: () => "Yes!",
    mount: (item, area, api) => ({ shape_sort: sorter, shape_scene: scene, shape_fill: filler, shape_move: mover, shape_turn: turntable, shape_net: netter })[item.stage](item, area, api),
  });
})();
