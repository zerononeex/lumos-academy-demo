// Spot the Wrong Step 1.0.0 (Coding · Computational thinking, K–3) on game kit 1.6.0 and picture cards 1.0.0: a program
// with one wrong block. Watch the star (it walks the program on a miss), tap the wrong step; from Grade 1 also fix it
// (which block goes there instead), then Run. Drawn on the staged-coding board (its landed tiles and star).
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Spot the Wrong Step",
    goal: "Find the wrong step, and fix it.",
    closure: "All done! You fixed lots of programs today.",
    checkLabel: "Run",
    stages: { "wrongstep.find": "Find the wrong step", "wrongstep.fix": "Fix it" },
    praise: () => "Yes! You found the bug.",
    look: C.block,
    // the program as shown; in Fix it, with the chosen block in the wrong step's place
    scene: (item) => C.programScene(item, (res) => (item.data.wrong === undefined || !(res.pick >= 0) ? item.data.prog
      : item.data.prog.map((s, k) => (k === item.data.wrong ? item.cards[res.pick] : s)))),
  });
})();
