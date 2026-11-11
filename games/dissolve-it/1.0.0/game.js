// Dissolve It 1.0.0 (Chemistry · Mixing, K–3) on game kit 1.6.0 and picture cards 1.0.0: sort the things that dissolve
// in water (sugar, salt, drink powder) from those that do not (sand, oil, a pebble, rice), then press Stir. From Grade 1
// "where did it go?": still there, spread out (not gone, not melted). Grade 3 compares warm and cold water. The things are
// the GA-064 card sheet and Sink or Float's (cards/1.0.0/cards.js); the baskets are drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Magic Melting Pot",
    goal: "Stir it in. Is it still there?",
    closure: "All done! You stirred lots of things today.",
    stages: { "dissolve.sort": "Does it dissolve?", "dissolve.where": "Where did it go?", "dissolve.warm": "Warm or cold?" },
    praise: () => "Yes! Dissolved things are still there, spread out in the water.",
    look: C.word,
    bin: C.word,
  });
})();
