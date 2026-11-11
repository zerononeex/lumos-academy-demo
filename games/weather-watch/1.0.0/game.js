// Weather Watch 1.0.0 (Science · Sky and seasons, K–3) on game kit 1.6.0 and picture cards 1.0.0: read the sky above the
// board (sunny, rainy, snowy, windy or cloudy), name the weather with its symbol, and pick what Pip should take; Grades
// 2–3 make a good guess from a clue ("dark clouds are coming: it MIGHT rain"), never a sure thing. The sky, the symbols
// and the gear are the GA-035 card pictures (cards/1.0.0/cards.js); a guess is a word card.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h } = window.LumosKit;
  C.run({
    title: "Sky Gazers' Post",
    goal: "Read the sky, and get Pip ready.",
    closure: "All done! You watched the weather today.",
    stages: { "weather.name": "What's the weather?", "weather.gear": "Dress Pip", "weather.guess": "What might happen?" },
    praise: (item) => (item.stage === "weather.guess" ? "Yes! A good guess says might." : "Yes! You read the sky."),
    look: C.word,
    scene(item) {
      if (!item.data || !item.data.sky) return null;
      const sky = item.data.sky, s = svg("svg", { viewBox: "0 0 300 110", "aria-hidden": "true" });
      s.append(svg("rect", { x: 3, y: 3, width: 294, height: 104, rx: 18, fill: sky === "sunny" ? "#bfe4ff" : sky === "snowy" ? "#e8ecf4" : "#a8b8cc", stroke: "#1b1f3b", "stroke-width": 5 }));
      const sym = (x, y, w) => s.append(svg("image", { href: C.pic(sky), x, y, width: w, height: w }));
      sym(100, 4, 100);
      if (sky === "rainy" || sky === "snowy") { sym(10, 10, 80); sym(210, 10, 80); }
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
