// Symmetry Painting 1.0.0 (Arts & Colours · Pattern and symmetry, K–3) on game kit 1.6.0 and picture cards 1.0.0: here
// is half a painting beside a fold line; which finished painting is its TRUE mirror? The other choices are a plain copy
// and (Grades 1–3) the half turned upside down. The server makes every half so that its mirror, its turn and its copy
// look different. The paintings are drawn as grids of squares in the house colours.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h } = window.LumosKit;
  const PAINT = ["#ff6b8b", "#3c9cff", "#ffd23f"];
  /** A grid picture (rows "101/011/...") in a box; `fold`: the dashed middle line; `half`: only the left half. */
  function paint(g, key, box, half) {
    const rows = key.split("/"), w = rows[0].length, cols = half ? w * 2 : w, cell = Math.min(box.w / cols, box.h / rows.length);
    const x0 = box.x + (box.w - cell * cols) / 2, y0 = box.y + (box.h - cell * rows.length) / 2;
    rows.forEach((row, y) => [...row].forEach((v, x) => g.append(svg("rect", { x: x0 + x * cell, y: y0 + y * cell, width: cell, height: cell,
      fill: v === "1" ? PAINT[y % 3] : "#fff", stroke: "#1b1f3b", "stroke-width": 1.5 }))));
    g.append(svg("path", { d: `M${x0 + cell * (half ? w : w / 2)} ${y0 - 4}v${cell * rows.length + 8}`, stroke: "#7a2e9e", "stroke-width": 3, "stroke-dasharray": "5 4" }));
  }
  C.run({
    title: "Mirror Masterpiece",
    goal: "Find the true mirror picture.",
    closure: "All done! You found lots of mirror pictures today.",
    stages: { "symmetry.mirror": "Find the mirror" },
    praise: () => "Yes! Fold it on the line and every square meets its partner.",
    words: false,
    look: (id, _item, i) => ({ name: `picture ${"ABC"[i]}`, draw: (g) => paint(g, id, { x: 4, y: 10, w: 92, h: 80 }, false) }),
    scene(item) {
      const s = svg("svg", { viewBox: "0 0 200 100", "aria-hidden": "true" });
      s.append(svg("rect", { x: 2, y: 2, width: 196, height: 96, rx: 14, fill: "#fff", stroke: "#1b1f3b", "stroke-width": 4 }));
      paint(s, item.data.half, { x: 10, y: 8, w: 180, h: 84 }, true);
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
