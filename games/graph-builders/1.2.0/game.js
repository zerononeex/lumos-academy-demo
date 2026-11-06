// Graph Builders 1.2.0 (art step, docs/art-inventory.md): the 1.1.0 game with its own scene (G13-W, at the same
// path) and pictures for its things: the nature-walk finds (G13-T) and the things to compare in groups (B3-T4), drawn
// at the same places and sizes as the shapes they replace. Same items, responses and checker.
// Graph Builders 1.1.0 (Step 5 Batch 3): the 1.0.0 game plus "Which group has more?" for K–1, before any graph:
// two groups of things; the child looks, picks the group with more (Grade 1: sometimes fewer), and can peek again as
// often as they like. No glimpse timer: the groups stay until the child picks, and "Peek again" always shows them again.
// One group is often drawn to mislead (bigger things, or spread out wider) so the evidence can tell size or spread
// from number. Art drop-in: docs/art-inventory.md section 4, B3-T4 (the eight things); until then, plain drawn shapes.
// Graph Builders 1.0.0 (K–3) on kit 1.5.0: build a graph of what a nature walk found, then answer from the graph.
// One rung per grade: K sorts the finds in the picture into a concrete graph and says which has the most; Grade 1 graphs
// them one to one and says how many more; Grade 2 graphs a tally as a picture graph and puts two columns together;
// Grade 3 graphs a tally in a bar graph where each square is 2. Every column stands on one bold baseline in equal
// squares, so the graph never lies. Picture view: tap a square to fill it (or empty it). Buttons view: a stepper per
// column fills it from the baseline. The server decides every answer; this file only presents. Original art.
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const ONE = { apples: "apple", leaves: "leaf", acorns: "acorn", shells: "shell" };
  const CW = 64, CH = 50, X0 = 30, LABEL = 52; // a column 64 wide, a square 50 tall; names under the baseline

  const ART = "../../art/graph-builders/";
  /** A picture `size` px across centred on (x, y), `s` times its size (it never takes a tap: the squares and buttons do). */
  const picture = (file, x, y, s, size) => svg("image", { href: `${ART}${file}.webp`, x: x - (size * s) / 2, y: y - (size * s) / 2, width: size * s, height: size * s, "pointer-events": "none" });
  /** One find, drawn at (x, y), `s` times its 40 px size. */
  const find = (kind, x, y, s = 1) => picture(ONE[kind], x, y, s, 34);
  const plural = (n, kind) => `${n} ${n === 1 ? ONE[kind] : kind}`;
  /** A tiny steady shuffle (the same picture every time for the same item). */
  const scatterOf = (item) => { let s = item.counts.reduce((a, c) => a * 31 + c + 7, 17); const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const slots = Array.from({ length: 24 }, (_, i) => i); for (let i = 23; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; } return slots; };

  function mount(item, area, api) {
    const { kinds, counts, key } = item, H = item.max, n = kinds.length, [a, b] = item.ask || [];
    const sort = item.stage === "graph_sort", fromPicture = sort || item.stage === "graph_more";
    let cols = kinds.map(() => []), said = null, pulse = null;
    const ask = sort ? "Which has the most?" : item.stage === "graph_more" ? `How many more ${kinds[a]} than ${kinds[b]}?`
      : item.stage === "graph_picto" ? `How many ${kinds[a]} and ${kinds[b]} together?` : `How many ${kinds[a]}?`;

    // The graph
    const W = X0 + n * CW + 10, HT = H * CH + LABEL + 14;
    const pic = svg("svg", { class: "visual graph", viewBox: `0 0 ${W} ${HT}`, "aria-hidden": "true" });
    pic.addEventListener("click", (e) => { const t = e.target.closest("[data-i]"); if (t) tap(Math.floor(t.dataset.i / H), t.dataset.i % H); });
    const list = h("div", { class: "dom collist", role: "group", "aria-label": "The graph" });
    const steps = kinds.map((k, c) => K.stepper(list, { label: k[0].toUpperCase() + k.slice(1), min: 0, max: H,
      onChange: (v) => { cols[c] = Array.from({ length: v }, (_, i) => i); api.say(spoken(c)); draw(); api.changed(); } }));
    const spoken = (c) => (key > 1 ? `${cols[c].length} squares, ${cols[c].length * key} ${kinds[c]}` : plural(cols[c].length, kinds[c]));

    // Where the data comes from: the finds in the picture (K, Grade 1) or the tally sheet (Grades 2–3)
    let source;
    if (fromPicture) {
      const slots = scatterOf(item), few = counts.indexOf(Math.min(...counts)), order = kinds.flatMap((k, i) => Array(counts[i]).fill(i));
      const scene = svg("svg", { class: "scene", viewBox: "0 0 360 240", "aria-hidden": "true" });
      scene.append(svg("rect", { x: 2, y: 2, width: 356, height: 236, rx: 18, fill: "#e9f5dc", stroke: "var(--ink)", "stroke-width": 3 }),
        ...order.map((k, j) => find(kinds[k], 30 + (slots[j] % 6) * 60, 30 + Math.floor(slots[j] / 6) * 60, k === few ? 1.45 : 0.85)));
      const shuffled = slots.slice(0, order.length).map((s, j) => [s, order[j]]).sort((p, q) => p[0] - q[0]).map(([, k]) => ONE[kinds[k]]);
      source = [scene, h("p", { class: "dom found" }, `In the picture: ${shuffled.map((w) => `${/^[aeiou]/.test(w) ? "an" : "a"} ${w}`).join(", ")}.`)];
    } else {
      const tally = svg("svg", { class: "tally", viewBox: `0 0 300 ${n * 44 + 8}`, "aria-hidden": "true" });
      kinds.forEach((k, i) => {
        const y = 8 + i * 44, t = svg("text", { x: 70, y: y + 26 }); t.textContent = k; tally.append(find(k, 18, y + 18, 0.75), t);
        for (let m = 0; m < counts[i]; m++) {
          const g = Math.floor(m / 5), x = 120 + g * 46 + (m % 5) * 9;
          tally.append(m % 5 === 4 ? svg("line", { class: "tallymark", x1: x - 40, y1: y + 30, x2: x - 2, y2: y + 6 }) : svg("line", { class: "tallymark", x1: x, y1: y + 4, x2: x, y2: y + 32 }));
        }
      });
      source = [tally,
        h("p", { class: "dom found" }, `Our tally: ${kinds.map((k, i) => `${k}, ${counts[i]} marks`).join("; ")}.`)];
    }

    // The answer: a pick (K) or a number read with tens and ones
    let picks = [], tens, ones;
    const answer = h("div", { class: "picker", role: "group", "aria-label": ask });
    if (sort) picks = kinds.map((k, i) => { const btn = h("button", { type: "button", class: "secondary", "data-pick": i, onclick: () => { said = i; api.say(k); draw(); api.changed(); } }, k); answer.append(btn); return btn; });
    else {
      const set = () => { said = tens.value * 10 + ones.value; draw(); api.changed(); };
      tens = K.stepper(answer, { label: "Tens", min: 0, max: 9, onChange: set }); ones = K.stepper(answer, { label: "Ones", min: 0, max: 9, onChange: set });
    }
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, key > 1 ? "Each square is 2" : "Our graph"), pic, list),
      h("div", { class: "side" }, ...source, h("p", { class: "ask" }, ask), answer));

    function draw() {
      const kids = [];
      kinds.forEach((k, c) => {
        const x = X0 + c * CW;
        for (let r = 0; r < H; r++) {
          const on = cols[c].includes(r), y = 6 + (H - 1 - r) * CH;
          kids.push(svg("rect", { class: `cell${on ? (key > 1 ? " bar" : " on") : ""}${pulse && pulse[0] === c && pulse[1] >= r ? " pulse" : ""}`, x: x + 4, y, width: CW - 8, height: CH, "data-i": c * H + r }));
          if (on && key === 1) kids.push(find(k, x + CW / 2, y + CH / 2, 0.95));
        }
        const t = svg("text", { x: x + CW / 2, y: 6 + H * CH + 44 }); t.textContent = k;
        kids.push(find(k, x + CW / 2, 6 + H * CH + 18, 0.6), t);
      });
      if (key > 1) for (let r = 0; r <= H; r += 2) { const t = svg("text", { x: 14, y: 6 + (H - r) * CH + 6 }); t.textContent = String(r * key); kids.push(t); }
      kids.push(svg("line", { class: "baseline", x1: X0, y1: 6 + H * CH, x2: X0 + n * CW, y2: 6 + H * CH }));
      pic.replaceChildren(...kids);
      picks.forEach((btn, i) => btn.setAttribute("aria-pressed", String(said === i)));
      api.refresh();
    }
    function tap(c, r) { cols[c] = cols[c].includes(r) ? cols[c].filter((v) => v !== r) : [...cols[c], r]; steps[c].set(cols[c].length); api.say(spoken(c)); draw(); api.changed(); }
    const setCols = (v) => { cols = v.map((g) => g.slice()); steps.forEach((s, c) => s.set(cols[c].length)); };
    const setSaid = (v) => { said = v; if (!sort) { tens.set(Math.floor((v ?? 0) / 10)); ones.set((v ?? 0) % 10); } };
    async function countUp(c, ms) { for (let r = 0; r < counts[c] / key; r++) { pulse = [c, r]; draw(); api.say(String((r + 1) * key)); await wait(ms); } pulse = null; draw(); }
    const full = () => counts.map((v) => Array.from({ length: v / key }, (_, i) => i));

    const ctl = {
      begin(retry) { if (!retry) api.prompt(`${fromPicture ? "Build a graph of what we found" : "Build a graph of our tally"}${key > 1 ? ": each square is 2" : ""}. Then: ${ask}`, "📊"); },
      ready: () => cols.some((g) => g.length) && said !== null,
      response: () => ({ groups: cols.map((g) => g.slice().sort((p, q) => p - q)), ...(sort ? { pick: said } : { read: said }) }),
      state: () => ({ cols, said }),
      restore(s) { setCols(s.cols || kinds.map(() => [])); setSaid(s.said ?? null); pulse = null; draw(); },
      async model() {
        api.say(`Watch me. I start on the bottom line and fill one square for each ${key > 1 ? "2 finds" : "find"}, with no gaps.`); await wait(3400);
        const c = counts.indexOf(Math.max(...counts));
        for (let r = 0; r < counts[c] / key; r++) { cols[c] = [...cols[c], r]; draw(); api.say(String((r + 1) * key)); await wait(700); }
        api.say(`${plural(counts[c], kinds[c])}. Now you.`); await wait(2200);
        cols = kinds.map(() => []); draw();
      },
      async help(level, fb) {
        api.say(fb.feedback || "Let's read the graph again."); await wait(3000);
        if (level >= 2 || fb.misconception === "baseline") { cols = cols.map((g) => g.slice().sort((p, q) => p - q).map((_, i) => i)); setCols(cols); draw(); api.say("Every column starts on the bottom line."); await wait(2400); }
        if (level >= 2) for (const c of sort ? kinds.map((_, i) => i) : [a, b].filter((v) => v !== undefined)) await countUp(c, 600);
        api.prompt(`Try again. ${ask}`, "📊");
      },
      async worked(sol) {
        cols = kinds.map(() => []); draw();
        for (let c = 0; c < n; c++) { cols[c] = full()[c]; await countUp(c, 450); }
        setCols(full()); setSaid(sort ? sol.pick : sol.read); draw();
        api.say(sort ? `The tallest column: ${kinds[sol.pick]} has the most.` : `${ask} ${sol.read}.`); await wait(3000);
      },
      async success() { api.say(sort ? `Yes, ${kinds[said]}: the tallest column.` : `${said}. Read right off the graph.`); await wait(2000); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Batch 3: which group has more?
  const SINGLE = { goldfish: "goldfish", stars: "star", ladybugs: "ladybug", strawberries: "strawberry", balloons: "balloon", buttons: "button", seashells: "seashell", birds: "bird" };
  /** One thing to compare (B3-T4 order), drawn at (x, y), `s` times its 30 px size. */
  const thing = (kind, x, y, s = 1) => picture(SINGLE[kind], x, y, s, 30);
  /** Places for `n` things in a 170 × 210 box: packed close or spread wide (a steady shuffle, the same every time). */
  function places(n, wide, seed) {
    const gap = wide ? 52 : 26, cols = Math.max(1, Math.min(n, wide ? 3 : 5)), slots = [];
    for (let i = 0; slots.length < Math.max(n, cols * Math.ceil(n / cols) + (wide ? 3 : 0)); i++) slots.push(i);
    let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
    const rows = Math.ceil(slots.length / cols);
    return slots.slice(0, n).map((k) => [85 + ((k % cols) - (cols - 1) / 2) * gap, 105 + (Math.floor(k / cols) - (rows - 1) / 2) * Math.min(gap, 190 / rows)]);
  }

  function spot(item, area, api) {
    const { kinds, counts } = item, few = counts.indexOf(Math.min(...counts)), word = item.fewer ? "fewer" : "more";
    let pick = null, peeks = 0, hidden = false, stacked = false, pulse = null;
    const ask = `Which group has ${word}?`;
    const pic = svg("svg", { class: "scene spot", viewBox: "0 0 360 240" });
    const fig = h("figure", { class: "manip" }, h("figcaption", {}, "Two groups"),
      h("div", { role: "img", "aria-label": kinds.map((k, i) => `Group ${i + 1}: ${counts[i]} ${k}`).join(". ") }, pic));
    const answer = h("div", { class: "picks", role: "group", "aria-label": ask });
    const choose = kinds.map((k, i) => h("button", { type: "button", class: "secondary", "data-pick": i, onclick: () => { pick = i; hidden = true; api.say(`The ${k}`); draw(); api.changed(); } }, `Group ${i + 1}: the ${k}`));
    const peek = h("button", { type: "button", class: "secondary", "data-act": "peek", onclick: () => { peeks += 1; hidden = false; api.say("Here they are again."); draw(); } }, "👀 Peek again");
    answer.append(...choose);
    area.append(fig, h("div", { class: "side" }, h("p", { class: "ask" }, ask), answer, peek));
    function draw() {
      const kids = [0, 1].map((i) => svg("rect", { class: `groupbox${pulse === i ? " pulse" : ""}`, x: 4 + i * 182, y: 14, width: 170, height: 220, rx: 16 }));
      if (stacked) // the groups lined up, one under the other, one to one: the longer row has more
        [0, 1].forEach((i) => { for (let j = 0; j < counts[i]; j++) kids.push(thing(kinds[i], 24 + j * 16.5, 80 + i * 80, 0.55)); });
      else if (hidden) [0, 1].forEach((i) => { const t = svg("text", { x: 89 + i * 182, y: 132, class: "cloth" }); t.textContent = "?"; kids.push(svg("rect", { class: "clothrect", x: 10 + i * 182, y: 20, width: 158, height: 208, rx: 12 }), t); });
      else [0, 1].forEach((i) => {
        const big = item.lure === "size" ? (i === few ? 1.5 : 0.7) : 0.9, wide = item.lure === "spread" ? i === few : false;
        for (const [x, y] of places(counts[i], wide, counts[0] * 31 + counts[1] * 7 + i)) kids.push(thing(kinds[i], 4 + i * 182 + x, 14 + y, big));
      });
      pic.replaceChildren(...kids);
      choose.forEach((b, i) => b.setAttribute("aria-pressed", String(pick === i)));
      peek.disabled = !hidden;
      api.refresh();
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`Look at the two groups. ${ask} The groups hide when you pick; peek again any time. Then press Check.`, "👀"); },
      ready: () => pick !== null,
      response: () => ({ pick, peeks }),
      state: () => ({ pick, peeks, hidden }),
      restore(s) { pick = s.pick ?? null; peeks = s.peeks || 0; hidden = !!s.hidden; stacked = false; draw(); },
      async model() { // the strategy, thought aloud, on this picture without picking: not the size, not the space, the number
        api.say("Watch me. Big things or small things, close together or spread out: I look at how many."); await wait(3400);
        stacked = true; draw(); api.say("I line them up in my head, one to one. The longer row has more."); await wait(3400);
        stacked = false; draw(); api.say("Now it's your turn."); await wait(1800);
      },
      async help(level, fb) {
        hidden = false; draw();
        api.say(fb.feedback || "Look at how many, not how big."); await wait(2800);
        stacked = true; pulse = counts.indexOf(item.fewer ? Math.min(...counts) : Math.max(...counts)); draw(); // the groups stacked: one row is longer
        api.say(`Lined up, one to one: the ${kinds[pulse]} row is ${item.fewer ? "shorter" : "longer"}.`); await wait(3400);
        if (level < 2) { stacked = false; pulse = null; }
        pick = null; draw();
        api.prompt(`Try again. ${ask}`, "👀");
      },
      async worked(sol) { stacked = true; pulse = sol.pick; pick = sol.pick; draw(); api.say(`The ${kinds[sol.pick]}: ${item.fewer ? "the shorter row, fewer" : "the longer row, more"}.`); await wait(3000); },
      async success() { stacked = true; draw(); api.say(`Yes! Lined up, the ${kinds[pick]} row is ${item.fewer ? "shorter" : "longer"}.`); await wait(2400); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Graph Builders",
    goal: "Build a graph of what we found.",
    closure: "All done! You built honest graphs today.",
    stages: { graph_sort: { name: "Sort and graph" }, graph_more: { name: "How many more?" }, graph_picto: { name: "Picture graph" }, graph_scaled: { name: "Each square is 2" },
      graph_spot: { name: "Which group has more?" } },
    praise: (item) => (item.stage === "graph_spot" ? `Yes! That group has ${item.fewer ? "fewer" : "more"}.` : "Yes! The graph shows it."),
    mount: (item, area, api) => (item.stage === "graph_spot" ? spot : mount)(item, area, api),
  });
})();
