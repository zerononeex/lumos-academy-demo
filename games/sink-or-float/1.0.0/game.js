// Sink or Float 1.0.0 (Science · Materials, K–3) on game kit 1.6.0 and picture cards 1.0.0: guess first, then test.
// Put each thing in the "floats" or "sinks" basket, then Test it: the water tank shows every thing bobbing at the top
// or settling on the bottom, so the child sees the answer happen. K: familiar things; Grades 1–3 add the tricky ones (a
// big beach ball floats, a heavy log floats, a light paper clip sinks); Grade 3 asks what it is made of. The things are
// the GA-031 card sheet (cards/1.0.0/cards.js); the baskets are drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg, h, wait } = K;
  C.run({
    title: "Pirate Shipwreck Salvage",
    goal: "Guess, then test it in the water.",
    closure: "All done! You tested lots of things today.",
    checkLabel: "Test it",
    stages: { "sinkfloat.predict": "Float or sink?", "sinkfloat.material": "What is it made of?" },
    praise: () => "Yes! Your guesses matched the test.",
    look: C.word,
    bin: (id) => ({ name: id, draw: id === "floats" ? (g) => { C.shape(g, "M6 60q11-10 22 0t22 0 22 0 22 0", "none", { stroke: "#3c9cff", "stroke-width": 8 }); C.circle(g, 50, 46, 12, "#ffd23f"); }
      : (g) => { C.shape(g, "M6 30q11-10 22 0t22 0 22 0 22 0", "none", { stroke: "#3c9cff", "stroke-width": 8 }); C.circle(g, 50, 80, 12, "#9a9aa6"); } }),
    scene(item) {
      if (item.kind !== "sort") return null;
      const s = svg("svg", { viewBox: "0 0 400 130", "aria-hidden": "true", class: "tank" });
      s.append(svg("rect", { x: 10, y: 10, width: 380, height: 112, rx: 14, fill: "#dff1ff", stroke: "#1b1f3b", "stroke-width": 5 }),
        svg("path", { d: "M14 40q22-10 44 0t44 0 44 0 44 0 44 0 44 0 44 0 44 0v78H14z", fill: "#7ec3ff", opacity: ".7" }));
      const things = item.cards.map((id, i) => {
        const g = svg("svg", { x: 20 + i * (360 / item.cards.length), y: 0, width: 50, height: 50, viewBox: "0 0 100 100", class: "thing" });
        C.word(id).art ? g.append(svg("image", { href: C.word(id).art, width: 100, height: 100 })) : C.word(id).draw(g);
        s.append(g); return g;
      });
      const test = async (sinks) => {
        things.forEach((g, i) => g.setAttribute("y", sinks[i] ? 70 : 18)); await wait(1600);
        things.forEach((g) => g.setAttribute("y", 0)); await wait(300);
      };
      const truth = () => item.cards.map((_, i) => item.want[i] === 1);
      return { el: h("div", { class: "scene" }, s), success: () => test(truth()), help: () => test(truth()) };
    },
  });
})();
