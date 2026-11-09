// Loop Loops 1.0.0 (Coding · Computational thinking, K–3) on game kit 1.6.0 and picture cards 1.0.0: build the short
// program with a repeat block (×2, ×3, ×4: a repeat makes the next block happen that many times). There are only a few
// places, because Pip just likes short code; nothing is scored. Grades 2–3 go round a corner with two repeats. Drawn on
// the staged-coding board (its landed tiles and star).
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Loop Loops",
    goal: "Short code with a repeat block.",
    closure: "All done! Pip loved your short code today.",
    checkLabel: "Run",
    stages: { "loops.line": "Repeat forward", "loops.corner": "Round the corner" },
    praise: () => "Yes! Short and sweet: Pip likes it.",
    look: C.block,
    scene: (item) => C.programScene(item, (res) => (res.taps || []).map((i) => item.cards[i])),
  });
})();
