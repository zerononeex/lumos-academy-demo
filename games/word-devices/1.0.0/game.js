// Word Devices 1.0.0 (Reading · Rhymes and words, K–3) on game kit 1.6.0 and picture cards 1.0.0: the word bird brings a
// word card; find the picture that rhymes with it, or starts with the same sound. Grades 1–3 also sort pictures into
// "rhymes" and "does not rhyme"; Grade 3 adds opposites (word cards). Every K–2 word is a picture, so a child who cannot
// read it yet plays by its sound. LANDED ART: the word bird (public/games/art/word-bird.webp, B5-A3, flaps while it
// carries the card), the picture cards of things and actions (words-things, words-actions: B5-T5, B5-T6) and the
// word-devices scene (B5-W2); the pictures those sheets lack are drawn (cards/1.0.0/words.js).
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg, h } = K;
  C.run({
    title: "The Lexicon Machine",
    goal: "Find words that rhyme, or start with the same sound.",
    closure: "All done! You listened to lots of words today.",
    stages: { "worddev.rhyme": "Find the rhyme", "worddev.start": "Same first sound", "worddev.rhyme_sort": "Rhymes or not?", "worddev.opposite": "Opposites" },
    praise: (item) => (item.stage === "worddev.opposite" ? "Yes! That is the opposite." : item.stage === "worddev.start" ? "Yes! They start the same." : "Yes! Those rhyme."),
    look: C.word,
    scene(item) {
      // the word bird flaps (frames 1–4 of the sheet) and carries the word card on a string
      const s = svg("svg", { viewBox: "0 0 300 120", "aria-hidden": "true", class: "bird" });
      const frames = svg("svg", { x: 40, y: 0, width: 110, height: 110, viewBox: "0 0 256 256" });
      const sheet = svg("image", { href: "../../art/word-bird.webp", width: 768, height: 512 });
      frames.append(sheet);
      const card = C.wordCard(item.data.word, { x: 170, y: 10, width: 100, height: 100 });
      s.append(svg("path", { d: "M130 80L170 50", stroke: "#1b1f3b", "stroke-width": 3 }));
      s.append(frames, card);
      let f = 0;
      const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      const flap = still ? null : setInterval(() => {
        if (!s.isConnected && f > 0) return clearInterval(flap);
        f = (f + 1) % 4; sheet.setAttribute("x", -256 * (f % 3)); sheet.setAttribute("y", -256 * Math.floor(f / 3));
      }, 100);
      return { el: h("div", { class: "scene" }, s), success: async () => { s.classList.add("yay"); await K.wait(900); s.classList.remove("yay"); } };
    },
  });
})();
