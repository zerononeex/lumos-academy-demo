// Seasons and Sky 1.0.0 (Science · Sky and seasons, K–3) on game kit 1.6.0 and picture cards 1.0.0: sort pictures into
// their seasons (K: winter and summer; Grades 1–3 all four, with a two-clue picture where one clue alone points the wrong
// way: sunshine on deep snow is still winter); Grades 1–3 name a two-clue scene's season; Grade 3 orders the sun's path
// across the day and the moon's shapes as it grows. Pictures: the GA-037 card sheet
// and two of Weather Watch's (cards/1.0.0/cards.js); the two-clue scenes, sky and moon are drawn below.
(() => {
  "use strict";
  const C = window.LumosCards;
  const sunAt = (x, y) => (g) => { C.shape(g, "M6 84h88", "none"); C.circle(g, x, y, 12, "#ffd23f"); C.shape(g, "M10 84q40-90 80 0", "none", { "stroke-dasharray": "4 6" }); };
  const moon = (cut) => (g) => { C.circle(g, 50, 50, 32, "#ffd23f"); if (cut) C.shape(g, cut, "#1f2f6b"); };
  const DRAW = {
    "the sun rises, low in the east": sunAt(16, 70), "the sun is high at noon": sunAt(50, 26), "the sun sets, low in the west": sunAt(84, 70),
    "a thin crescent moon": moon("M44 18a32 32 0 1 0 0 64a28 32 0 0 0 0-64z"), "a half moon": moon("M50 18a32 32 0 0 0 0 64z"), "a full moon": moon(null),
    "sunshine on deep snow": (g) => { C.circle(g, 72, 26, 12, "#ffd23f"); C.shape(g, "M6 64q44-20 88 0v26H6z", "#fff"); },
    "snow melting by new flower buds": (g) => { C.shape(g, "M6 74q20-10 40 0v16H6z", "#fff"); C.shape(g, "M70 88V56", "none", { stroke: "#3fae49", "stroke-width": 4 }); C.shape(g, "M70 56q-8-8 0-20q8 12 0 20z", "#ff9ec4"); },
    "a sunny day with ripe pumpkins": (g) => { C.circle(g, 76, 22, 11, "#ffd23f"); C.shape(g, "M20 70q0-20 24-20t24 20-24 18-24-18z", "#ff8c1a"); },
    "warm rain on a sandcastle": (g) => { C.shape(g, "M20 88V60h10v-8h10v8h10V48h10v40z", "#f4c48b"); [26, 50, 74].forEach((x) => C.shape(g, `M${x} 14q-5 8 0 11q5-3 0-11z`, "#3c9cff")); },
    winter: (g) => C.circle(g, 50, 50, 26, "#fff"), spring: (g) => C.shape(g, "M50 20q-14 16 0 30 14-14 0-30z", "#ff9ec4"),
    summer: (g) => C.circle(g, 50, 50, 24, "#ffd23f"), fall: (g) => C.shape(g, "M20 70q0-40 50-46-4 46-50 46z", "#ff8c1a"),
  };
  C.run({
    title: "Weather Wizard's Tower",
    goal: "Find the season, and follow the sky.",
    closure: "All done! You read lots of season clues today.",
    stages: { "seasons.sort": "Sort by season", "seasons.clues": "Two clues", "seasons.sky": "Across the sky" },
    praise: () => "Yes! You used every clue.",
    look: (id) => (DRAW[id] ? { name: id, draw: DRAW[id] } : C.word(id)),
    bin: (id) => ({ name: id, draw: DRAW[id] }),
  });
})();
