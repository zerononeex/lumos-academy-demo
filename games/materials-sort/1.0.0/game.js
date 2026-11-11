// Materials Sort 1.0.0 (Chemistry · What things are made of, K–3) on game kit 1.6.0 and picture cards 1.0.0: sort things
// by what they are made of (wood and metal; then glass; then fabric and paper). Shiny glass and shiny gift wrap are the
// trap for "shiny means metal". Grades 2–3 choose the best material for a job, with its reason. The things are the
// GA-066 card sheet and Sink or Float's (cards/1.0.0/cards.js); the book is the landed word card (B5-T5); the
// materials are drawn in the house style (words.js).
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "The Scavenger's Sorting Bin",
    goal: "What is it made of?",
    closure: "All done! You sorted lots of materials today.",
    stages: { "materials.sort": "What is it made of?", "materials.job": "Best for the job" },
    praise: () => "Yes! What it is made of tells us what it is good for.",
    look: C.word,
    bin: C.word,
  });
})();
