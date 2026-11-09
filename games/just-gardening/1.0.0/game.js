// Just Gardening 1.0.0 (Living Things · Plants, K–3) on game kit 1.6.0 and picture cards 1.0.0: a plant's life in its
// true order (seed, sprout, flower, fruit; K stops at the flower), what Pip should do at each stage (water dry soil,
// let soggy soil dry, move a sprout into the light), and (Grades 1–3) everything a plant needs. Time is squeezed, never
// the order or the needs. Pictures: GA-043 (the bean plant) and the GA-044 card sheet; the rest drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, { svg } = window.LumosKit;
  // The four stages are frames of one bean plant (GA-043, 3 × 2 frames of 256): seed, little sprout, flower, fruit.
  const bean = (k) => (g) => {
    const f = svg("svg", { width: 100, height: 100, viewBox: `${(k % 3) * 256} ${Math.floor(k / 3) * 256} 256 256` });
    f.append(svg("image", { href: "../../art/just-gardening/bean-plant.webp", width: 768, height: 512 })); g.append(f);
  };
  const DRAW = {
    "a seed in the soil": bean(0),
    "a little sprout": bean(3),
    "a flowering plant": bean(4),
    "a plant with fruit": bean(5),
  };
  C.run({
    title: "Just Gardening",
    goal: "Grow a plant from seed to fruit.",
    closure: "All done! Your garden grew well today.",
    stages: { "garden.grow": "Seed to fruit", "garden.care": "What does it need?", "garden.needs": "What plants need" },
    praise: () => "Yes! That helps the plant grow.",
    look: (id) => (DRAW[id] ? { name: id, draw: DRAW[id] } : C.word(id)),
  });
})();
