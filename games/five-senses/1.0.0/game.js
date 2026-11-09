// Five Senses 1.0.0 (Science · How we find out, K–3) on game kit 1.6.0 and picture cards 1.0.0: which sense found it
// out? Pip hears a bird: ears, not eyes (the eyes_for_everything trap is always there). Grades 2–3 tap the two senses
// that found out a two-step discovery (a crunchy, sweet apple: ears and tongue). The senses are the
// GA-039 card sheet (cards/1.0.0/cards.js); the things are the landed word cards or drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Five Senses",
    goal: "Which sense found it out?",
    closure: "All done! You used all your senses today.",
    stages: { "senses.match": "Which sense?", "senses.two": "Two senses at once" },
    praise: () => "Yes! That sense found it out.",
    look: C.word,
  });
})();
