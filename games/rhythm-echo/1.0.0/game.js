// Rhythm Echo 1.0.0 (Music · Rhythm, K–3) on game kit 1.6.0 and picture cards 1.0.0: a clap pattern shows as dots (a
// big dot claps, a dash rests) for as long as the child likes; tap it back with the clap and rest cards, then Done.
// "Hear it again" plays it as often as wanted, and every tap plays too; nothing is ever timed. K: two or three claps;
// Grades 1–3 add rests, up to five beats (the adaptive engine grows the length gently). Drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg, h } = K;
  const clap = (after = 0) => K.tone(196, 120, 0.3, "square", after);
  C.run({
    title: "Rhythm Echo",
    goal: "Tap the rhythm back.",
    closure: "All done! You echoed lots of rhythms today.",
    checkLabel: "Done",
    stages: { "echo.echo": "Echo the rhythm" },
    praise: () => "Yes! Your echo matches.",
    look: (id) => ({ name: id, sound: id === "clap" ? () => clap() : () => {},
      draw: id === "clap" ? (g) => C.circle(g, 50, 46, 26, "#e5383b") : (g) => C.shape(g, "M24 46h52", "none", { "stroke-width": 9 }) }),
    hear: (item) => item.data.beats.forEach((b, k) => { if (b === "clap") clap(k * 450); }),
    scene(item) {
      const n = item.data.beats.length, s = svg("svg", { viewBox: `0 0 ${n * 60 + 20} 70`, "aria-hidden": "true" });
      s.append(svg("rect", { x: 2, y: 2, width: n * 60 + 16, height: 66, rx: 14, fill: "#fff", stroke: "#1b1f3b", "stroke-width": 4 }));
      item.data.beats.forEach((b, k) => s.append(b === "clap" ? svg("circle", { cx: 40 + k * 60, cy: 35, r: 16, fill: "#e5383b", stroke: "#1b1f3b", "stroke-width": 4 })
        : svg("path", { d: `M${26 + k * 60} 35h28`, stroke: "#1b1f3b", "stroke-width": 7, "stroke-linecap": "round" })));
      return { el: h("div", { class: "scene" }, s) };
    },
  });
})();
