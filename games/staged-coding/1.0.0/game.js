// Staged Coding 1.0.0 (Coding · Computational thinking, K–3) on game kit 1.6.0 and picture cards 1.0.0: plan the star's
// path from blocks, then Run it. Tier A (K–1): a small flat meadow board, forward and turn blocks, reach the goal star.
// Tier B (Grades 2–3): a bigger isometric board, walk onto each dark tile and light it. Tier C (Grade 3): the procedure
// block P1 (forward, forward, light) with only a few places, so the repeated steps go in P1. The star walks the plan on
// Run and on a miss, so the child sees where it went. Landed art: the staged-coding boards, tiles and star sprites.
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Staged Coding",
    goal: "Plan the star's path, then run it.",
    closure: "All done! Your star followed every plan today.",
    checkLabel: "Run",
    stages: { "stagecode.path": "Reach the star", "stagecode.light": "Light the tiles", "stagecode.proc": "Use P1" },
    praise: () => "Yes! Your program works.",
    look: C.block,
    scene: (item) => C.programScene(item, (res) => (res.taps || []).map((i) => item.cards[i])),
  });
})();
