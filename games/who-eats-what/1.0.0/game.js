// Who Eats What 1.0.0 (Living Things · Animals, K–3) on game kit 1.6.0 and picture cards 1.0.0: what does this animal
// eat? (a frog eats flies, not leaves: the all_animals_eat_plants trap), and (Grades 1–3) which animals help a flower by
// carrying its pollen. No hunting and no predator scenes: food is shown on its own. Pictures: the GA-050
// card sheet and Life Cycle Order's butterfly (cards/1.0.0/cards.js); the rest drawn in the house style (words.js).
(() => {
  "use strict";
  const C = window.LumosCards, { h } = window.LumosKit;
  C.run({
    title: "Forest Feast Cafe",
    goal: "Find each animal's food, and the flower helpers.",
    closure: "All done! Everyone had a good meal today.",
    stages: { "food.food": "What does it eat?", "food.helpers": "Flower helpers" },
    praise: (item) => (item.stage === "food.helpers" ? "Yes! They carry pollen from flower to flower." : "Yes! That is its food."),
    look: C.word,
    scene: (item) => (item.data && item.data.who ? { el: h("div", { class: "scene" }, C.wordCard(item.data.who)) } : null),
  });
})();
