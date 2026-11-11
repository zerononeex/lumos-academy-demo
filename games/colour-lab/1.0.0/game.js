// Colour Lab 1.0.0 (Arts & Colours · Colour, K–3) on game kit 1.6.0 and picture cards 1.0.0: colour RECIPES. Make the
// mix the recipe says ("2 scoops of red and 1 scoop of yellow"): any order, the right count of each. Grades 2–3 also
// find the wrong scoop in Pip's finished bowl (a scoop that is only out of order is fine). Colour Mixing discovers; this
// one measures. LANDED ART: the paint pots (public/games/art/colour-mixing, B5-T3), shared with Colour Mixing.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h } = window.LumosKit;
  const POT = { red: "01", yellow: "02", blue: "03", white: "04" };
  const HEX = { red: "#e5383b", yellow: "#ffd23f", blue: "#2f6fde", white: "#ffffff" };
  C.run({
    title: "Alchemist's Tint Shop",
    goal: "Follow the colour recipe.",
    closure: "All done! You measured lots of colours today.",
    checkLabel: "Mix",
    stages: { "colourlab.recipe": "Follow the recipe", "colourlab.fix": "Find the wrong scoop" },
    praise: () => "Yes! Just what the recipe says.",
    look: (id) => {
      const colour = id.split(": ").pop();
      return { name: id.includes(":") ? id : `${id} paint`, word: id.includes(":") ? id.split(":")[0] : id, art: `../../art/colour-mixing/${POT[colour]}.webp` };
    },
    scene(item) {
      const s = svg("svg", { viewBox: "0 0 300 90", "aria-hidden": "true" });
      s.append(svg("rect", { x: 4, y: 4, width: 292, height: 82, rx: 16, fill: "#fff", stroke: "#1b1f3b", "stroke-width": 4 }));
      if (item.kind === "build") {
        const show = (taps) => { s.querySelectorAll(".scoop").forEach((e) => e.remove()); taps.forEach((t, k) => s.append(svg("circle", { class: "scoop", cx: 40 + k * 50, cy: 45, r: 18, fill: HEX[item.cards[t]], stroke: "#1b1f3b", "stroke-width": 4 }))); };
        return { el: h("div", { class: "scene" }, s), update: (res) => show(res.taps || []) };
      }
      item.cards.forEach((id, k) => s.append(svg("circle", { cx: 60 + k * 70, cy: 45, r: 22, fill: HEX[id.split(": ").pop()], stroke: "#1b1f3b", "stroke-width": 4 })));
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
