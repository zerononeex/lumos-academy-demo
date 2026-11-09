// Mixing Lab 1.0.0 (Chemistry · Mixing, K–3) on game kit 1.6.0 and picture cards 1.0.0: predict what a safe kitchen mix
// does (fizz, change colour, spread, lump, or stay in layers), then press Mix to see. Grade 2 adds "more and more?" (more
// of one thing is not a bigger change for ever); Grade 3 mixes three things in order. Answers are written on the cards;
// the mix shows as a fizzing cup. Drawn in the house style; no landed art exists for this game yet.
(() => {
  "use strict";
  const C = window.LumosCards, { h, svg } = window.LumosKit;
  const cup = () => {
    const s = svg("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", class: "show" });
    C.shape(s, "M26 20h48l-6 66H32z", "#fff"); C.shape(s, "M29 44h42l-3 42H32z", "#b37bff");
    [[40, 36], [52, 30], [62, 38]].forEach(([x, y]) => C.circle(s, x, y, 5, "#dff1ff"));
    return s;
  };
  C.run({
    title: "Mixing Lab",
    goal: "Predict, then mix and see.",
    closure: "All done! You tested lots of mixes today.",
    stages: { "mixlab.predict": "What will happen?", "mixlab.more": "More and more?", "mixlab.three": "Three things" },
    praise: () => "Yes! You predicted it, and the mix showed you.",
    look: C.word,
    scene: () => ({ el: h("div", { class: "scene" }, cup()) }),
  });
})();
