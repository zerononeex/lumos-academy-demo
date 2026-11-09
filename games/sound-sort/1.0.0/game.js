// Sound Sort 1.0.0 (Reading · Letters and sounds, K–3) on game kit 1.6.0 and picture cards 1.0.0: put each pictured word
// in the basket of its FIRST sound (two baskets at K, three from Grade 1). A word with a basket's sound later on (bus in
// the s basket) is the middle_sound_taken_as_first mix-up. Tap a picture to lift it, then tap its basket (or use the
// buttons). LANDED ART: the picture word cards (public/games/art/words-things, words-actions); the rest are drawn.
(() => {
  "use strict";
  const C = window.LumosCards;
  C.run({
    title: "Sound Sort",
    goal: "Sort pictures by their first sound.",
    closure: "All done! You sorted lots of sounds today.",
    stages: { "soundsort.sort": "Sort by first sound" },
    praise: () => "Yes! Every picture is in its first-sound basket.",
    look: C.word,
    bin: (x) => ({ name: `starts with ${x}`, draw: (g) => C.text(g, 50, 50, x, 78) }),
  });
})();
