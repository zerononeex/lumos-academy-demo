// Life Cycle Order 1.0.0 (Living Things · Animals, K–3) on game kit 1.6.0 and picture cards 1.0.0: put a butterfly's,
// frog's, plant's or chicken's life in order (K: three stages; Grades 1–3: four); ordering by size is the
// biggest_is_last trap (a fat caterpillar comes before the butterfly). Grade 3 finds the missing stage. The pictures
// are the GA-048 card sheet (cards/1.0.0/cards.js).
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Life Cycle Order",
    goal: "Put each life in order.",
    closure: "All done! You followed lots of life cycles today.",
    stages: { "lifecycle.order": "Put it in order", "lifecycle.missing": "The missing stage" },
    praise: () => "Yes! That is how it grows and changes.",
    look: (id) => ({ name: id }),
  });
})();
