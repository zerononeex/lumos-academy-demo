// Story Order 1.0.0 (Reading · Stories, K–3) on game kit 1.6.0 and picture cards 1.0.0: put a mini-story's picture
// panels in order (K: beginning, middle and end; Grades 1–3: four panels); Grades 2–3 choose the missing middle panel
// between a first and a last one. Four stories: a seed that grows, a snowman, a jam sandwich and an egg that hatches.
// The panels are the GA-029 card sheet (cards/1.0.0/cards.js).
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h } = window.LumosKit;
  C.run({
    title: "Comic Strip Chronicles",
    goal: "Put the story in order.",
    closure: "All done! You told lots of stories today.",
    stages: { "story.order": "First, next, last", "story.middle": "The missing middle" },
    praise: () => "Yes! First, then next, then the end.",
    words: false,
    look: (id) => ({ name: id }),
    scene(item) {
      if (!item.data.before) return null;
      const s = svg("svg", { viewBox: "0 0 330 110", "aria-hidden": "true" });
      [[item.data.before, 0], [null, 115], [item.data.after, 230]].forEach(([id, x]) => {
        const g = svg("g", { transform: `translate(${x} 5)` });
        g.append(svg("rect", { width: 100, height: 100, rx: 14, fill: id ? "#fff" : "rgba(255,255,255,.6)", stroke: "#1b1f3b", "stroke-width": 4, "stroke-dasharray": id ? "" : "8 6" }));
        if (id) g.append(svg("image", { href: C.pic(id), x: 6, y: 6, width: 88, height: 88 })); else C.text(g, 50, 52, "?", 54, "#8a8fa8");
        s.append(g);
      });
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
