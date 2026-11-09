// Bubble Lab 1.0.0 (Chemistry · Mixing, K–3) on game kit 1.6.0 and picture cards 1.0.0: blow through a star, square,
// heart or triangle wand and say what shape the bubble is (always round). Grades 2–3 order wands by the size of their
// bubbles. Each card shows its shape or its wand. Drawn in the house style; no landed art exists for this game yet.
(() => {
  "use strict";
  const C = window.LumosCards;
  const SHAPE = { star: "M50 14l9 20 22 2-17 15 5 21-19-11-19 11 5-21-17-15 22-2z", square: "M24 24h52v52H24z",
    heart: "M50 80Q16 56 20 36q4-16 20-14 8 2 10 12 2-10 10-12 16-2 20 14 4 20-30 44z", triangle: "M50 18l32 58H18z", round: "M50 20a30 30 0 1 0 .1 0z" };
  const BUBBLE = "#9cc8ff";
  const look = (id) => {
    const m = /^a (\w+) bubble$/.exec(id);
    if (m) return { name: id, draw: (g) => C.shape(g, SHAPE[m[1]], BUBBLE) };
    const w = /^(small|middle|big) (\w+) wand$/.exec(id);
    if (w) { const s = { small: 0.45, middle: 0.7, big: 0.95 }[w[1]];
      return { name: id, draw: (g) => { C.shape(g, `M50 ${50 + 30 * s}V96`, "none", { "stroke-width": 6 });
        C.shape(g, SHAPE[w[2]], "none", { "stroke-width": 7 / s, transform: `translate(50 50) scale(${s}) translate(-50 -50)` }); } }; }
    return C.word(id);
  };
  C.run({
    title: "Bubble Lab",
    goal: "Blow a bubble. What shape is it?",
    closure: "All done! You blew lots of bubbles today.",
    stages: { "bubbles.shape": "What shape?", "bubbles.size": "Big and small" },
    praise: () => "Yes! Every bubble pulls itself round.",
    look,
  });
})();
