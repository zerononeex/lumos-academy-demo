// True View 1.0.0 (Math · Shapes and measuring, Grades 4–7) on game kit 1.6.0 and picture cards 1.0.0: a building of
// cube towers on a 3 × 3 floor, and an arrow at its front or its right side. Pick the picture of what you see from the
// arrow: each column shows its tallest tower (the back ones too, when they are taller). The top rung adds a die's rule:
// opposite faces add up to 7. The building and the cards are drawn in code (exact); the room is the landed scene.
(() => {
  "use strict";
  const C = window.LumosCards, { h, svg } = window.LumosKit;
  const INK = "#1b1f3b", S = 22, OX = 150, OY = 84;
  const P = (x, y, z) => `${OX + (x - y) * S},${OY + ((x + y) * S) / 2 - z * S}`;
  const poly = (g, pts, fill) => g.append(svg("polygon", { points: pts.join(" "), fill, stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" }));
  /** The building seen from above at an angle: the front faces down-left, the right side down-right. */
  function building(towers, from) {
    const s = svg("svg", { viewBox: "0 0 300 176", "aria-hidden": "true" });
    const cubes = [];
    towers.forEach((n, c) => { for (let z = 0; z < n; z++) cubes.push([c % 3, Math.floor(c / 3), z]); });
    cubes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2]);
    for (const [x, y, z] of cubes) {
      poly(s, [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], "#ffd23f");
      poly(s, [P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)], "#f2a93b");
      poly(s, [P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)], "#e0862a");
    }
    const arrow = from === "front" ? "M40 164l30-18m-14-2l14 2-4 13" : "M260 164l-30-18m14-2l-14 2 4 13";
    s.append(svg("path", { d: arrow, fill: "none", stroke: "#3c9cff", "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    return s;
  }
  const PIPS = { 1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]] };
  const die = (g, n) => { C.shape(g, "M12 12h76v76H12z", "#fff", { rx: 14 }); for (const [x, y] of PIPS[n]) C.circle(g, x, y, 7, INK); };
  function look(id) {
    const [kind, ...v] = id.split(" "), n = v.map(Number);
    if (kind === "die") return { name: `a die showing ${n[0]}`, word: String(n[0]), draw: (g) => die(g, n[0]) };
    return { name: `columns ${n[0]}, ${n[1]} and ${n[2]} cubes tall`, word: n.join(" "),
      draw: (g) => n.forEach((t, i) => { for (let k = 0; k < t; k++) C.shape(g, `M${17 + i * 22} ${86 - (k + 1) * 22}h22v22h-22z`, "#ffd23f"); }) };
  }
  C.run({
    title: "3D Dimension Studio",
    goal: "Pick how it looks from the arrow.",
    closure: "All done! You saw lots of buildings from every side today.",
    stages: { "trueview.look": "From the arrow", "trueview.dice": "Dice rules" },
    praise: () => "Yes! That is the true view.",
    look,
    scene(item) {
      if (item.data.towers) return { el: h("div", { class: "scene" }, building(item.data.towers, item.data.from)) };
      const s = svg("svg", { viewBox: "0 0 100 100", "aria-hidden": "true" }); die(s, item.data.top);
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
