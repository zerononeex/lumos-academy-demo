// Habitat Match 1.0.0 (Living Things · Animals, K–3) on game kit 1.6.0 and picture cards 1.0.0: which home does this
// animal or plant belong to: pond, forest, desert or snow? "Anywhere, like a pet" is always offered as the trap. Grade 3
// picks the one that does NOT belong, and the feature that gives it away. The animal sits on a card above the homes.
// The animals and homes are the GA-046 card sheet (cards/1.0.0/cards.js).
(() => {
  "use strict";
  const C = window.LumosCards, { h } = window.LumosKit;
  C.run({
    title: "Home Sweet Wild",
    goal: "Find each animal's home.",
    closure: "All done! Every animal found its home today.",
    stages: { "habitat.match": "Where does it live?", "habitat.odd": "Who doesn't belong?", "habitat.why": "What gives it away?" },
    praise: () => "Yes! That home gives it what it needs.",
    look: C.word,
    scene: (item) => (item.data && item.data.who ? { el: h("div", { class: "scene" }, C.wordCard(item.data.who)) } : null),
  });
})();
