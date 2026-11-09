// Texture Sort 1.0.0 (Arts & Colours · Making, K–3) on game kit 1.6.0 and picture cards 1.0.0: sort things by how they
// FEEL: rough or smooth (from Grade 1, soft or hard too). From Grade 1 a thing that only LOOKS rough joins in: a photo of
// tree bark, a glittery sticker. Grade 3 taps everything with two feel words at once (hard AND smooth). The things are
// the GA-077 card sheet (cards/1.0.0/cards.js); the four feel words are drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards;
  const DRAW = {
    rough: (g) => C.shape(g, "M10 60l10-14 10 14 10-14 10 14 10-14 10 14 10-14 10 14", "none", { "stroke-width": 6 }),
    smooth: (g) => C.shape(g, "M10 54q40-14 80 0", "none", { "stroke-width": 6 }),
    soft: (g) => [[34, 50], [54, 42], [62, 58], [44, 62]].forEach(([x, y]) => C.circle(g, x, y, 14, "#fff")),
    hard: (g) => C.shape(g, "M24 26h52v52H24z", "#9a9aa6"),
  };
  C.run({
    title: "Texture Sort",
    goal: "Sort by how things feel.",
    closure: "All done! You felt lots of textures today.",
    stages: { "texture.sort": "Rough or smooth?", "texture.both": "Two feel words" },
    praise: () => "Yes! That is how it feels.",
    look: (id) => ({ name: id, draw: DRAW[id] }),
    bin: (id) => ({ name: id, draw: DRAW[id] }),
  });
})();
