// Groups & Arrays Orchard 1.1.0 (art step, docs/art-inventory.md): the 1.0.0 game with its own scene (G11-W, at the
// same path) and its trees drawn as pictures (G11-T) instead of a trunk and a disc; a counted tree still lights up
// (a sun-yellow disc behind it). Same items, responses and checker.
// Groups & Arrays Orchard 1.0.0 (Grades 2–3) on kit 1.5.0: plant an orchard in equal rows (3 rows of 4), count one by
// rows, read it two ways (3 rows of 4 is 4 columns of 3), or plant a total in equal rows. Rows go across, columns go
// down. Pointer: tap a square to plant the row up to there (or tap a planted tree to take it and the ones after it back);
// "Add a row like row 1" copies a whole row. Buttons: a stepper per row, and the same copy control. Counting aloud is
// optional and is the evidence: by rows, or tree by tree. The server decides every answer; this file only presents.
// Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const N = 6, U = 66, X0 = 70, Y0 = 6; // the field: 6 rows of 6 squares; a handle column on the left
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const sum = (v) => v.reduce((a, b) => a + b, 0);

  /** The orchard picture: `trees` per row; `marked` trees (reading order) counted; `band`: a row (r) or column (c) lit. */
  function field(pic, rows, trees, { marked = 0, band = null, ghost = null, handles = false, plots = N, counts = false } = {}) {
    const kids = [];
    for (let r = 0; r < rows; r++) {
      if (handles) { // "count this row": a target the size of a square
        const g = svg("g", { class: "handle", "data-n": r });
        g.append(svg("rect", { x: 2, y: Y0 + r * U + 2, width: U - 4, height: U - 4, rx: 12 }), svg("path", { d: `M24 ${Y0 + r * U + 20}l14 13-14 13` }));
        kids.push(g);
      }
      for (let c = 0; c < plots; c++) {
        const x = X0 + c * U, y = Y0 + r * U, k = trees.slice(0, r).reduce((a, t) => a + t, 0) + c;
        kids.push(svg("rect", { class: "plot", x: x + 2, y: y + 2, width: U - 4, height: U - 4, rx: 8, "data-i": r * N + c }));
        if (c < trees[r]) kids.push(...(k < marked ? [svg("circle", { class: "crown counted", cx: x + U / 2, cy: y + U / 2, r: U / 2 - 6, "pointer-events": "none" })] : []),
          svg("image", { href: "../../art/groups-and-arrays/tree.webp", x: x + 4, y: y + 4, width: U - 8, height: U - 8, "pointer-events": "none" }));
      }
    }
    if (band) kids.push(band.r !== undefined ? svg("rect", { class: "band pulse", x: X0, y: Y0 + band.r * U, width: plots * U, height: U, "pointer-events": "none" })
      : svg("rect", { class: "band pulse", x: X0 + band.c * U, y: Y0, width: U, height: rows * U, "pointer-events": "none" }));
    for (let r = 0; r < rows && counts; r++) { // the running count, at the end of each row counted so far
      const n = Math.min(marked, trees.slice(0, r + 1).reduce((a, t) => a + t, 0));
      if (n > trees.slice(0, r).reduce((a, t) => a + t, 0)) { const t = svg("text", { class: "count", x: X0 + plots * U + 8, y: Y0 + r * U + U / 2 + 9 }); t.textContent = n; kids.push(t); }
    }
    if (ghost) kids.push(svg("rect", { class: "ghost", x: X0 + 2, y: Y0 + 2, width: ghost[1] * U - 4, height: ghost[0] * U - 4, rx: 10, "pointer-events": "none" }));
    pic.setAttribute("viewBox", `0 0 ${X0 + plots * U + (counts ? 52 : 6)} ${Y0 * 2 + rows * U}`);
    pic.replaceChildren(...kids);
  }

  // ---------------------------------------------------------------- Plant: rows × columns, or a total in equal rows
  function plant(item, area, api) {
    const split = item.stage === "arrays_split", total = item.rows * item.cols;
    let trees = Array(N).fill(0), ghost = null;
    const pic = svg("svg", { class: "visual orchard", "aria-hidden": "true" });
    pic.addEventListener("click", (e) => { const t = e.target.closest("[data-i]"); if (t) tap(Math.floor(t.dataset.i / N), t.dataset.i % N); });
    const said = h("p", { class: "dom orchtext", "aria-live": "polite" });
    const list = h("div", { class: "dom rowlist", role: "group", "aria-label": "Trees in each row" });
    const steps = Array.from({ length: N }, (_, r) => K.stepper(list, { label: `Row ${r + 1}`, min: 0, max: N, onChange: (v) => { trees[r] = v; draw(); api.changed(); } }));
    const copy = h("button", { type: "button", "data-act": "copy", onclick: copyRow }, "🌳 Add a row like row 1");
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, split ? `${total} trees in ${item.rows} equal rows` : `${item.rows} rows of ${item.cols}`), pic, said, list),
      h("div", { class: "side" }, copy));
    function draw() {
      field(pic, N, trees, { ghost });
      trees.forEach((t, r) => steps[r].set(t));
      const next = trees.findIndex((t) => !t);
      copy.disabled = !trees[0] || next < 0;
      said.textContent = trees.some(Boolean) ? `${trees.map((t, r) => (t ? `Row ${r + 1}: ${plural(t, "tree", "trees")}` : "")).filter(Boolean).join(". ")}. ${sum(trees)} in all.` : "No trees yet.";
      api.refresh();
    }
    function tap(r, c) { trees[r] = c < trees[r] ? c : c + 1; api.say(plural(trees[r], "tree", "trees")); draw(); api.changed(); }
    function copyRow() {
      const r = trees.findIndex((t) => !t);
      if (r < 0 || !trees[0]) return;
      trees[r] = trees[0]; api.say(`Row ${r + 1}: ${plural(trees[r], "tree", "trees")}, like row 1.`); draw(); api.changed();
    }
    const say = split ? `Plant ${total} trees in ${item.rows} equal rows.` : `Plant ${item.rows} rows of ${item.cols} trees.`;
    const ctl = {
      begin(retry) { if (!retry) api.prompt(say, "🌳"); },
      ready: () => trees.some(Boolean),
      response: () => ({ trees: trees.slice() }),
      state: () => ({ trees: trees.slice() }),
      restore(s) { trees = (s.trees || Array(N).fill(0)).slice(); ghost = null; draw(); },
      async model() { // 2 rows of 3: one row, then a row like it
        api.say("Watch me plant 2 rows of 3. Rows go across."); await wait(2600);
        trees = [3, 0, 0, 0, 0, 0]; draw(); api.say("One row of 3."); await wait(1800);
        trees[1] = 3; draw(); api.say("Another row just like it. 2 rows of 3: 3, 6. Six trees."); await wait(3200);
      },
      async help(level, fb) {
        api.say(fb.feedback || "Look at the rows."); await wait(2800);
        if (fb.misconception === "swapped" || level >= 2) { // the orchard asked for, outlined over the child's
          ghost = [item.rows, item.cols]; draw();
          api.say(`This is ${item.rows} rows of ${item.cols}: ${item.rows} rows going across, ${item.cols} trees in each.`); await wait(3400);
        }
        if (level >= 2) { trees = [item.cols, 0, 0, 0, 0, 0]; draw(); api.say("Here is the first row. Now add rows just like it."); await wait(2600); }
        ghost = null; draw();
        api.prompt(`Try again. ${say}`, "🌳");
      },
      async worked(sol) { trees = Array(N).fill(0); for (const [r, t] of sol.trees.entries()) if (t) { trees[r] = t; draw(); api.say(`${(r + 1) * t}`); await wait(1100); } },
      async success() { api.say(`${item.rows} rows of ${item.cols}: ${total} trees.`); await wait(2200); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Count it (and read it two ways)
  /** A number read with tens and ones steppers. */
  function reader(parent, onChange) {
    const box = h("div", { class: "picker" });
    const t = K.stepper(box, { label: "Tens", min: 0, max: 9, onChange }), o = K.stepper(box, { label: "Ones", min: 0, max: 9, onChange });
    parent.append(box);
    return { get value() { return t.value * 10 + o.value; }, set(v) { t.set(Math.floor(v / 10)); o.set(v % 10); } };
  }
  function orchard(item, area, api) {
    const two = item.stage === "arrays_two_ways", { rows, cols } = item, total = rows * cols, full = Array(rows).fill(cols);
    let counted = [], read = null, ways = [0, 0, 0, 0], band = null;
    const at = () => counted[counted.length - 1] || 0;
    const pic = svg("svg", { class: "visual orchard", "aria-hidden": "true" });
    pic.addEventListener("click", (e) => { const t = e.target.closest("[data-n], [data-i]"); if (t) (t.dataset.n !== undefined ? countRow : countTree)(); });
    const said = h("p", { class: "dom orchtext" }, `An orchard: ${rows} rows going across, ${cols} trees in each row.`);
    const tally = h("p", { class: "dom orchtext", "aria-live": "polite" }); // the picture writes the count at each row's end
    const counts = h("div", { class: "picker", role: "group", "aria-label": "Count aloud (if you like)" },
      h("button", { type: "button", class: "secondary", "data-act": "row", onclick: countRow }, "Count the next row"),
      h("button", { type: "button", class: "secondary", "data-act": "tree", onclick: countTree }, "Count the next tree"));
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "The orchard"), pic, said, tally));
    const box = h("div", { class: "side" }, counts), wbox = h("div", { class: "ways" });
    const wayStep = two ? ["Rows", "In each row", "Columns", "In each column"]
      .map((label, k) => K.stepper(wbox, { label, min: 0, max: N, onChange: (v) => { ways[k] = v; draw(); api.changed(); } })) : [];
    if (two) box.append(wbox);
    const num = reader(box, () => { read = num.value; draw(); api.changed(); });
    area.append(box);
    function draw() {
      field(pic, rows, full, { marked: at(), band, handles: true, plots: cols, counts: true });
      tally.textContent = counted.length ? `Counted: ${counted.join(", ")}` : "";
      api.refresh();
    }
    function count(to) { if (at() >= total) return; counted.push(to); api.say(String(to)); draw(); api.changed(); }
    function countRow() { count(at() + cols - (at() % cols)); } // to the end of this row
    function countTree() { count(at() + 1); }
    /** The kit counting by rows, out loud (a demonstration, not the child's own count). */
    async function byRows(ms) { counted = []; for (let r = 0; r < rows; r++) { band = { r }; counted.push((r + 1) * cols); draw(); api.say(String(at())); await wait(ms); } band = null; }
    const ask = two ? "Read the orchard two ways: rows of, and columns of. How many trees?" : "How many trees are in the orchard?";
    const ctl = {
      begin(retry) { if (!retry) api.prompt(ask, "🌳"); },
      ready: () => read !== null && (!two || ways.every(Boolean)),
      response: () => ({ read, ...(counted.length ? { counted: counted.slice() } : {}), ...(two ? { ways: ways.slice() } : {}) }),
      state: () => ({ read, counted: counted.slice(), ways: ways.slice() }),
      restore(s) {
        read = s.read ?? null; num.set(read ?? 0); counted = (s.counted || []).slice(); ways = (s.ways || [0, 0, 0, 0]).slice();
        wayStep.forEach((st, k) => st.set(ways[k])); band = null; draw();
      },
      async model() {
        api.say("Watch me count by rows. Each row has the same number of trees."); await wait(3000);
        await byRows(1200);
        api.say(`${rows} rows of ${cols}: ${total} trees. Now you.`); await wait(2800);
      },
      async help(level, fb) {
        api.say(fb.feedback || "Look at the orchard again."); await wait(2800);
        if (fb.misconception === "swapped" || (two && level >= 2)) { // rows across, then columns down
          band = { r: 0 }; draw(); api.say(`Rows go across. There are ${rows} rows, with ${cols} trees in each.`); await wait(3200);
          band = { c: 0 }; draw(); api.say(`Columns go down. There are ${cols} columns, with ${rows} trees in each.`); await wait(3200);
        }
        if (fb.misconception === "counted_ones" || level >= 2) { await byRows(1100); api.say(`Counting by rows: ${counted.join(", ")}.`); await wait(2600); }
        counted = []; band = null; draw();
        api.prompt(`Try again. ${ask}`, "🌳");
      },
      async worked(sol) {
        await byRows(1000);
        if (two) sol.ways.forEach((v, k) => { ways[k] = v; wayStep[k].set(v); });
        read = sol.read; num.set(read); draw();
        api.say(`${rows} rows of ${cols}${two ? ` is ${cols} columns of ${rows}` : ""}: ${total} trees.`); await wait(3000);
      },
      async success() { api.say(two ? `${rows} rows of ${cols}, ${cols} columns of ${rows}: ${total} trees.` : `${total} trees.`); await wait(2200); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "The Magic Orchard",
    goal: "Plant and count trees in equal rows.",
    closure: "All done! Your orchard is growing in equal rows.",
    stages: { arrays_build: { name: "Plant the rows" }, arrays_count: { name: "How many trees?" }, arrays_two_ways: { name: "Rows and columns" }, arrays_split: { name: "Equal rows" } },
    praise: () => "Yes! Equal rows.",
    mount: (item, area, api) => (item.stage === "arrays_build" || item.stage === "arrays_split" ? plant : orchard)(item, area, api),
  });
})();
