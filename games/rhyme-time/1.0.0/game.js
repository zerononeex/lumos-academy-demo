// Rhyme Time 1.0.0 (Reading · Rhymes and words, K–3) on game kit 1.6.0 and picture cards 1.0.0: word families. Which
// picture rhymes with the word (K: -at and -un; Grade 1 adds -ar; Grades 2–3 -og); Grades 1–3 tap the whole family;
// Grade 3 finds the one that does NOT rhyme. The traps end with the same LETTER only (cat/sit) or mean something close
// (cat/dog). LANDED ART: the picture word cards (public/games/art/words-things, words-actions); the rest are drawn.
(() => {
  "use strict";
  const C = window.LumosCards, { h } = window.LumosKit;
  C.run({
    title: "Rhyme Time",
    goal: "Find the words that rhyme.",
    closure: "All done! You found lots of rhymes today.",
    stages: { "rhymetime.rhyme": "Which one rhymes?", "rhymetime.family": "The whole family", "rhymetime.odd": "Which does not rhyme?" },
    praise: () => "Yes! Listen: they sound the same at the end.",
    look: C.word,
    scene: (item) => item.data && item.data.word ? { el: h("div", { class: "scene" }, C.wordCard(item.data.word)) } : null,
  });
})();
