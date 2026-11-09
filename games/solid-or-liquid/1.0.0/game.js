// Solid or Liquid 1.0.0 (Science · Materials, K–3) on game kit 1.6.0 and picture cards 1.0.0: sort clear cases into
// "solid" (keeps its own shape) and "liquid" (takes the shape of its cup). From Grade 1 honey or syrup joins in: a slow
// liquid, still a liquid. Grades 2–3 also find the liquid among solids. Pictures: the GA-033 card sheet
// and Sink or Float's (cards/1.0.0/cards.js).
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Solid or Liquid",
    goal: "Does it keep its shape, or take the cup's shape?",
    closure: "All done! You sorted lots of materials today.",
    stages: { "solidliquid.sort": "Solid or liquid?", "solidliquid.which": "Find the liquid" },
    praise: () => "Yes! Solids keep their shape; liquids take the shape of their cup.",
    look: C.word,
    bin: (id) => ({ name: id, draw: id === "solid" ? (g) => C.shape(g, "M24 30h52v52H24z", "#d9a066") : (g) => { C.shape(g, "M26 20h48l-6 66H32z", "#fff"); C.shape(g, "M29 50h42l-3 36H32z", "#3c9cff"); } }),
  });
})();
