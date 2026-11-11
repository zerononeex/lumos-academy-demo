// Make a Collage 1.0.0 (Arts & Colours · Making, K–3) on game kit 1.6.0 and picture cards 1.0.0: rebuild the model
// picture (a house, a boat, a tree, a rocket) from cut-paper pieces. Its outline above the board numbers each part;
// choose a piece for part 1, then 2... and Glue it. From Grade 1 a look-alike in the wrong size joins the pieces; from
// Grade 2 the right piece turned the wrong way does too. The picture fills in as pieces go on. Drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h } = window.LumosKit;
  const FILL = ["#ff6b8b", "#3c9cff", "#ffd23f", "#3fae49"];
  const PIECE = {
    "big triangle": "M10 80L50 14 90 80z", "small triangle": "M30 70L50 34 70 70z", "tall triangle": "M30 90V10l40 80z", "short triangle": "M30 70V44l40 26z",
    "big square": "M16 16h68v68H16z", "small square": "M34 34h32v32H34z", "small rectangle": "M38 30h24v48H38z", "big rectangle": "M22 16h56v70H22z",
    "wide trapezoid": "M8 34h84l-14 34H22z", "narrow trapezoid": "M28 34h44l-8 34H36z", "big circle": "M50 10a40 40 0 1 1 0 80a40 40 0 1 1 0-80z",
    "small circle": "M50 32a18 18 0 1 1 0 36a18 18 0 1 1 0-36z", "tall rectangle": "M38 8h24v84H38z", "short rectangle": "M38 40h24v30H38z",
  };
  const draw = (id) => (g) => {
    const [shape, turn] = id.split(", "), t = turn === "upside down" ? "rotate(180 50 50)" : turn === "lying down" ? "rotate(90 50 50)" : turn === "pointing left" ? "scale(-1 1) translate(-100 0)" : "";
    C.shape(g, PIECE[shape], FILL[Object.keys(PIECE).indexOf(shape) % 4], { transform: t });
  };
  // Where each part sits in the model outline (x, y, size), in the same order as the parts.
  const LAYOUT = { 0: [[60, 4, 80], [60, 64, 80], [86, 98, 44]], 1: [[70, 0, 70], [40, 74, 120], [118, 2, 36]], 2: [[50, 0, 100], [50, 76, 70]], 3: [[70, 0, 60], [70, 40, 60], [52, 96, 96]] };
  C.run({
    title: "Dreamhouse Workshop",
    goal: "Rebuild the picture with paper pieces.",
    closure: "All done! You made lots of pictures today.",
    checkLabel: "Glue it",
    stages: { "collage.build": "Rebuild the picture" },
    praise: () => "Yes! Every piece fits its place.",
    look: (id) => ({ name: id, draw: draw(id) }),
    scene(item) {
      const s = svg("svg", { viewBox: "0 0 200 160", "aria-hidden": "true" }), spots = LAYOUT[item.data.model];
      const show = (taps) => {
        s.replaceChildren(svg("rect", { x: 2, y: 2, width: 196, height: 156, rx: 14, fill: "#fff", stroke: "#1b1f3b", "stroke-width": 4 }));
        spots.forEach(([x, y, z], k) => {
          const g = svg("g", { transform: `translate(${x} ${y}) scale(${z / 100})` });
          if (taps[k] === undefined) { C.shape(g, "M4 4h92v92H4z", "none", { "stroke-dasharray": "8 6", stroke: "#8a8fa8" }); C.text(g, 50, 52, `${k + 1}`, 44, "#8a8fa8"); }
          else draw(item.cards[taps[k]])(g);
          s.append(g);
        });
      };
      show([]);
      return { el: h("div", { class: "scene" }, s), update: (res) => show(res.taps || []) };
    },
  });
})();
