// Magnet Match 1.0.0 (Physics · Magnets, K–3) on game kit 1.6.0 and picture cards 1.0.0: tap everything the magnet will
// pick up, then Test it: the magnet swings over and what is iron or steel jumps up to it. Only clear cases (no
// aluminium): a shiny glass marble does not stick, and neither does copper or gold (not every metal sticks). Grade 3
// sorts the tested things by material. The pictures are the GA-057 card sheet (and Sink or Float's, cards/1.0.0/cards.js).
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg, h, wait } = K;
  const base = (id) => id.replace(/ \(.*\)$/, "");
  C.run({
    title: "Magnetic Maze",
    goal: "Guess what the magnet picks up, then test.",
    closure: "All done! You tested lots of things with the magnet today.",
    checkLabel: "Test it",
    stages: { "magnet.predict": "What will it pick up?", "magnet.sort": "Sort by material" },
    praise: () => "Yes! Iron and steel jump to the magnet.",
    look: (id) => ({ name: id, word: base(id) }),
    scene(item) {
      if (item.kind !== "multi") return null;
      const s = svg("svg", { viewBox: "0 0 400 90", "aria-hidden": "true" });
      const magnet = svg("path", { d: "M180 6h20v24a10 10 0 0 0 20 0V6h20v24a30 30 0 0 1-60 0z", fill: "#e5383b", stroke: "#1b1f3b", "stroke-width": 4, class: "magnet" });
      const things = item.cards.map((id, i) => { const g = svg("svg", { x: 20 + i * (360 / item.cards.length), y: 48, width: 40, height: 40, viewBox: "0 0 100 100", class: "thing" }); g.append(svg("image", { href: C.pic(id), width: 100, height: 100 })); s.append(g); return g; });
      s.append(magnet);
      const test = async () => { things.forEach((g, i) => item.want.includes(i) && g.setAttribute("y", 22)); await wait(1500); things.forEach((g) => g.setAttribute("y", 48)); await wait(300); };
      return { el: h("div", { class: "scene" }, s), success: test, help: test };
    },
  });
})();
