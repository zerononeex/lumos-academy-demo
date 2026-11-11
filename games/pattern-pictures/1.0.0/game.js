// Pattern Pictures 1.0.0 (Arts & Colours · Pattern and symmetry, K–3) on game kit 1.6.0 and picture cards 1.0.0: finish
// the pattern inside a picture: flags on a garland, a painted fence or a quilt. K: AB; Grade 1 adds AAB; Grade 2 ABC;
// Grade 3 has two things changing at once (the shapes go AB while the colours go ABC), and the trap is the right colour
// in the wrong shape. Pattern Parade is tiles; this one is scenes. Drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h } = window.LumosKit;
  const HEX = { red: "#e5383b", blue: "#2f6fde", yellow: "#ffd23f", green: "#3fae49" };
  const SHAPE = {
    flag: "M30 20h40L50 80z", star: "M50 12l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z",
    heart: "M50 84C18 60 12 40 24 26s24-6 26 6c2-12 14-20 26-6s6 34-26 58z", circle: "M50 16a34 34 0 1 1 0 68a34 34 0 1 1 0-68z",
  };
  const piece = (id) => (g) => { const [c, s] = id.split(" "); C.shape(g, SHAPE[s], HEX[c]); };
  C.run({
    title: "Festival Bunting",
    goal: "Finish the pattern in the picture.",
    closure: "All done! Your pictures are full of patterns.",
    stages: { "patternpic.next": "What comes next?" },
    praise: () => "Yes! The pattern carries on.",
    look: (id) => ({ name: id, draw: piece(id) }),
    scene(item) {
      const seq = item.data.seq, n = seq.length + 1, w = 46, s = svg("svg", { viewBox: `0 0 ${n * w + 10} 70`, "aria-hidden": "true" });
      const scene = item.data.scene;
      if (scene === "garland") s.append(svg("path", { d: `M4 10q${(n * w) / 2} 26 ${n * w} 0`, stroke: "#1b1f3b", "stroke-width": 3, fill: "none" }));
      if (scene === "fence") s.append(svg("rect", { x: 2, y: 30, width: n * w + 6, height: 10, fill: "#d9a066", stroke: "#1b1f3b", "stroke-width": 3 }));
      [...seq, null].forEach((id, k) => {
        const g = svg("g", { transform: `translate(${6 + k * w} ${scene === "garland" ? 10 : 6}) scale(.44)` });
        if (scene === "quilt") g.append(svg("rect", { x: 0, y: 0, width: 100, height: 100, fill: k % 2 ? "#fff4d6" : "#ffe3ec", stroke: "#1b1f3b", "stroke-width": 4 }));
        if (id) piece(id)(g); else C.text(g, 50, 52, "?", 60, "#8a8fa8");
        s.append(g);
      });
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
