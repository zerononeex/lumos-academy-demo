// Instrument Families 1.0.0 (Music · Listening, K–3) on game kit 1.6.0 and picture cards 1.0.0: sort instruments by HOW
// they make their sound: strings (pluck or bow), keys (press), drums (hit or shake), winds (blow). K: strings and drums;
// Grade 1 adds winds; Grades 2–3 all four, with the xylophone, which looks like keys but is hit like a drum. Each card
// plays a little sound of its family when tapped. The instruments are the GA-082 card sheet (cards/1.0.0/cards.js);
// the four families are drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit;
  const FAM = { guitar: 0, violin: 0, harp: 0, piano: 1, keyboard: 1, drum: 2, tambourine: 2, xylophone: 2, flute: 3, trumpet: 3, recorder: 3 };
  const SOUND = [() => K.tone(330, 500, 0.2, "triangle"), () => K.tone(392, 400, 0.18, "sine"), () => K.tone(110, 160, 0.3, "square"), () => K.tone(523, 700, 0.12, "sine")];
  const DRAW = {
    strings: (g) => C.shape(g, "M20 20v60M40 20v60M60 20v60M80 20v60", "none", { "stroke-width": 4 }),
    keys: (g) => { C.shape(g, "M10 30h80v40H10z", "#fff"); [26, 50, 74].forEach((x) => C.shape(g, `M${x} 30h8v22h-8z`, "#1b1f3b")); },
    drums: (g) => { C.shape(g, "M20 40v30q30 16 60 0V40", "#e5383b"); C.shape(g, "M20 40q30-14 60 0q-30 14-60 0z", "#fff1d6"); },
    winds: (g) => C.shape(g, "M10 36h50q14 0 14-12t-12-10M10 56h66q14 0 14 12t-12 10", "none", { "stroke-width": 7 }),
  };
  C.run({
    title: "The Orchestra Bazaar",
    goal: "Sort instruments by how they make sound.",
    closure: "All done! The whole band is in its families.",
    stages: { "instruments.sort": "Sort the instruments", "instruments.how": "How is it played?" },
    praise: () => "Yes! That is how it makes its sound.",
    look: (id) => (FAM[id] !== undefined ? { name: id, sound: SOUND[FAM[id]] } : DRAW[id] ? { name: id, draw: DRAW[id] } : C.word(id)), // a way of playing (Grades 2–3) is a phrase card
    bin: (id) => ({ name: id, draw: DRAW[id] }),
  });
})();
