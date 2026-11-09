// Kitchen Chemistry 1.0.0 (Chemistry · Mixing, K–3) on game kit 1.6.0 and picture cards 1.0.0: which mix fizzes, what
// ice does in warm water (it melts, it does not dissolve), the freeze-and-melt changes in order, and (Grades 2–3) which
// change is melting. Answers are written on the cards. The changes are the GA-069 card sheet (cards/1.0.0/cards.js).
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Kitchen Chemistry",
    goal: "Fizz, melt and freeze: what changes?",
    closure: "All done! You tested lots of kitchen changes today.",
    stages: { "kitchen.fizz": "Which one fizzes?", "kitchen.ice": "Ice in warm water", "kitchen.order": "Freeze and melt", "kitchen.which": "Which is melting?" },
    praise: () => "Yes! Heat and cold change things, and so does mixing.",
    look: C.word,
  });
})();
