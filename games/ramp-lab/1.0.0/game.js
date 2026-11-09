// Ramp Lab 1.0.0 (Physics · Ramps and rolls, K–3) on game kit 1.6.0 and picture cards 1.0.0: which ball rolls farther,
// and which ramp height reaches the flag? A higher ramp rolls farther; from Grade 2 a rough ramp slows the ball (the
// steeper_always_farther trap), and a heavy ball never helps (heavier_goes_farther). Test it: the ball rolls down the
// chosen ramp to where it would stop, so a wrong guess shows its own result. Drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg, h, wait } = K;
  const H = ["low", "middle", "high"];
  const parse = (id) => { const [hh, surf, , weight] = id.replace(",", "").split(" "); return { k: H.indexOf(hh), rough: surf === "rough", heavy: weight === "heavy" }; };
  const far = (id) => { const p = parse(id); return Math.max(0, p.k - Number(p.rough)); }; // the flag it reaches: 0 near, 1 middle, 2 far
  const rampDraw = (id) => (g) => {
    const p = parse(id), top = 70 - p.k * 22;
    C.shape(g, `M8 84L8 ${top}L70 84z`, p.rough ? "#c9853e" : "#9cc8ff");
    if (p.rough) C.shape(g, `M12 ${top + 4}l6 4 6-2 6 5 6-2 6 5 6-1 6 5 6-1`, "none", { "stroke-width": 2 });
    C.circle(g, 16, top - (p.heavy ? 10 : 6), p.heavy ? 10 : 6, p.heavy ? "#4a4f6b" : "#ffd23f");
  };
  C.run({
    title: "Ramp Lab",
    goal: "Test how far the ball rolls.",
    closure: "All done! You tested lots of ramps today.",
    checkLabel: "Test it",
    stages: { "ramp.compare": "Which rolls farther?", "ramp.aim": "Reach the flag" },
    praise: () => "Yes! The test shows it.",
    words: false,
    look: (id) => ({ name: id, draw: rampDraw(id) }),
    scene(item) {
      const s = svg("svg", { viewBox: "0 0 400 90", "aria-hidden": "true", class: "lab" });
      s.append(svg("path", { d: "M4 80h392", stroke: "#1b1f3b", "stroke-width": 5, "stroke-linecap": "round" }));
      ["near", "middle", "far"].forEach((f, k) => {
        const x = 150 + k * 90, hit = item.data.flag === k;
        s.append(svg("path", { d: `M${x} 80V40l26 8-26 8`, fill: hit ? "#ffd23f" : "#fff", stroke: "#1b1f3b", "stroke-width": 4 }));
      });
      s.append(svg("path", { d: "M4 80V30l90 50z", fill: "#e8ecf4", stroke: "#1b1f3b", "stroke-width": 4 }));
      const ball = svg("circle", { cx: 14, cy: 26, r: 9, fill: "#ffd23f", stroke: "#1b1f3b", "stroke-width": 4, class: "ball" });
      s.append(ball);
      const roll = async (id) => { ball.style.transform = `translate(${150 + far(id) * 90 - 14}px, 45px)`; await wait(1500); ball.style.transform = ""; await wait(300); };
      const chosen = (res) => (res.pick >= 0 ? item.cards[res.pick] : null);
      return { el: h("div", { class: "scene" }, s), success: async (res) => chosen(res) && roll(chosen(res)), help: async (_l, _f, res) => chosen(res) && roll(chosen(res)) };
    },
  });
})();
