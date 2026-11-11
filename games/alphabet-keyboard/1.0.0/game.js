// Alphabet Keyboard 1.0.0 (Reading · Letters and sounds, K–3) on game kit 1.6.0 and picture cards 1.0.0: letter keys.
// K–2: which letter does the pictured word start with (the trap is a letter whose NAME sounds like the word's start: C
// "see" for sun); K–3: find the small letter for a capital (the traps are its mirror and turn twins, b/d, p/q, n/u);
// Grade 3: which letter does the word end with. Each key is a big letter; the word's picture sits above the keys.
// LANDED ART: the picture word cards (public/games/art/words-things, words-actions). Letters and other pictures are drawn.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h } = window.LumosKit;
  const key = (x) => ({ name: x, word: " ", draw: (g) => C.text(g, 50, 50, x, 78, "#1b1f3b") });
  C.run({
    title: "Keyboard Chasm",
    goal: "Letters, their names and their sounds.",
    closure: "All done! You found lots of letters today.",
    stages: { "alphabet.start": "First letter", "alphabet.case": "Big and small letters", "alphabet.last": "Last letter" },
    praise: (item) => (item.stage === "alphabet.case" ? "Yes! Those two letters match." : "Yes! You heard that sound."),
    look: key,
    scene(item) {
      if (!item.data.big) return { el: h("div", { class: "scene" }, C.wordCard(item.data.word)) };
      const s = svg("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", class: "show" });
      s.append(svg("rect", { x: 3, y: 3, width: 94, height: 94, rx: 16, fill: "#fff", stroke: "#ffb703", "stroke-width": 6 }));
      C.text(s, 50, 52, item.data.big, 78);
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
