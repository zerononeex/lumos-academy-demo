// Marble Run 1.0.0 (Physics · Building, K–3) on game kit 1.6.0 and picture cards 1.0.0: plan the whole track first, then
// Roll it (Car Route's plan-then-run shape). Choose a piece for each place: a slope down for every step the marble must
// drop, flats to fill, and a curve last when the cup is round the corner. A slope up stops the marble; an empty place is
// a gap. The track draws itself as it is planned, and the marble rolls it on Roll it. Drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg, h, wait } = K;
  const DRAW = {
    "slope down": (g) => C.shape(g, "M10 30L90 70v10L10 40z", "#3c9cff"), flat: (g) => C.shape(g, "M10 50h80v10H10z", "#3c9cff"),
    curve: (g) => C.shape(g, "M10 40h40q30 0 30 30v20H70V70q0-20-20-20H10z", "#3c9cff"), "slope up": (g) => C.shape(g, "M10 70L90 30v10L10 80z", "#ff6b8b"),
  };
  C.run({
    title: "Marble Run",
    goal: "Plan the track to the cup.",
    closure: "All done! Your marble runs reached the cup.",
    checkLabel: "Roll it",
    stages: { "marble.plan": "Plan the run" },
    praise: () => "Yes! The marble rolls all the way to the cup.",
    look: (id) => ({ name: id, draw: DRAW[id] }),
    scene(item) {
      const { slots, drop, turn } = item.data, w = 70, step = 60 / Math.max(1, drop), s = svg("svg", { viewBox: `0 0 ${slots * w + 90} 110`, "aria-hidden": "true" });
      let path = [];
      const show = (taps) => {
        s.replaceChildren();
        let y = 20; path = [[10, y]];
        for (let k = 0; k < slots; k++) {
          const p = item.cards[taps[k]], x = 10 + k * w;
          if (!p) { s.append(svg("rect", { x, y: y - 6, width: w, height: 16, fill: "none", stroke: "#8a8fa8", "stroke-width": 3, "stroke-dasharray": "6 5" })); continue; }
          const y2 = p === "slope down" ? y + step : p === "slope up" ? y - step : y;
          s.append(svg("path", { d: `M${x} ${y}L${x + w} ${y2}`, stroke: p === "slope up" ? "#ff6b8b" : "#3c9cff", "stroke-width": 9, "stroke-linecap": "round" }));
          y = y2; path.push([x + w, y]);
        }
        const cx = 10 + slots * w + (turn ? 20 : 30);
        s.append(svg("path", { d: `M${cx - 18} 84h36l-6 22h-24z`, fill: "#ffd23f", stroke: "#1b1f3b", "stroke-width": 4 }));
      };
      const marble = () => { const m = svg("circle", { cx: 10, cy: 12, r: 8, fill: "#7a2e9e", stroke: "#1b1f3b", "stroke-width": 3 }); s.append(m); return m; };
      const run = async (res) => { show(res.taps || []); const m = marble(); for (const [x, y] of path) { m.setAttribute("cx", x); m.setAttribute("cy", y - 8); await wait(320); } await wait(500); };
      show([]);
      return { el: h("div", { class: "scene" }, s), update: (res) => show(res.taps || []), success: run, help: async (_l, _f, res) => run(res) };
    },
  });
})();
