// Grammar and Vocab 1.0.0 (Reading · Words, K–3) on game kit 1.6.0 and picture cards 1.0.0: naming words (things you
// can point to) and action words (things you can do). K–2: tap the action word, or the naming word; sort pictures into
// "thing" and "action"; Grades 1–3: tap every action word; Grade 3: finish a sentence with the kind of word it needs.
// LANDED ART: the picture cards of things and of the star character doing actions (public/games/art/words-things and
// words-actions, B5-T5 and B5-T6). The baskets show a pointing hand (things) and running legs (actions), drawn.
(() => {
  "use strict";
  const C = window.LumosCards, { h } = window.LumosKit;
  C.run({
    title: "Storybook Kingdom",
    goal: "Naming words and action words.",
    closure: "All done! You sorted lots of words today.",
    stages: { "grammar.find": "Find the action", "grammar.sort": "Things and actions", "grammar.every": "Every action word", "grammar.sentence": "Finish the sentence" },
    praise: (item) => (item.stage === "grammar.sentence" ? "Yes! That word fits the sentence." : "Yes! You know your words."),
    look: C.word,
    bin: (id) => ({ name: id === "thing" ? "a thing (naming word)" : "an action (doing word)",
      draw: id === "thing" ? (g) => { C.shape(g, "M20 60h40l20-20M60 60v20H24z", "#ffd8b0"); C.circle(g, 84, 36, 8, "#ffd23f"); }
        : (g) => { C.circle(g, 56, 18, 10, "#ffd23f"); C.shape(g, "M54 30l-8 30 18 12M46 60L30 88M50 40l-20 6M54 42l18 10", "none", { "stroke-width": 7 }); } }),
    scene(item) {
      if (!item.data || !item.data.sentence) return null;
      const [a, b] = item.data.sentence.split("___");
      return { el: h("div", { class: "scene sentence" }, h("p", {}, a, h("span", { class: "gap" }, "?"), b)) };
    },
  });
})();
