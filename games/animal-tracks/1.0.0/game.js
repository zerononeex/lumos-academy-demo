// Animal Tracks 1.0.0 (Living Things · Animals, K–3) on game kit 1.6.0 and picture cards 1.0.0: whose track is this?
// The track sits above the cards. The trap is an animal whose track is about the same SIZE but a different shape (a
// dog's four toes beside a deer's split hoof). Grades 2–3 order tracks smallest to biggest and count the toes. The
// tracks are drawn in the house style (cards/1.0.0/words.js); the animals are the GA-052 card sheet and Habitat Match's
// (cards/1.0.0/cards.js), and the cat and dog are the landed word cards.
(() => {
  "use strict";
  const C = window.LumosCards, { h } = window.LumosKit;
  C.run({
    title: "The Jungle Tracker",
    goal: "Match the tracks to the animals.",
    closure: "All done! You followed lots of tracks today.",
    stages: { "tracks.match": "Whose track?", "tracks.size": "Smallest to biggest", "tracks.toes": "Count the toes" },
    praise: () => "Yes! The shape and the toes match.",
    look: C.word,
    scene: (item) => (item.data && item.data.track ? { el: h("div", { class: "scene" }, C.wordCard(`${item.data.track} track`)) } : null),
  });
})();
