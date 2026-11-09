// Colour Mixing 1.0.0 (Arts & Colours · Colour, K–3) on game kit 1.6.0 and picture cards 1.0.0: put two scoops of paint
// in the bowl to make the target colour, then Mix. K–1: the secondary colours from red, yellow and blue; Grades 2–3 add
// white and black for tints and shades. The bowl shows the mix as it is made, so cause and effect are seen before the
// check. LANDED ART: the paint pots and the bowl (public/games/art/colour-mixing, B5-T3); the black pot is drawn (the
// sheet has none). The server decides every mix; this file only shows it.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, wait } = window.LumosKit;
  const PAINT = { red: "#e5383b", yellow: "#ffd23f", blue: "#2f6fde", white: "#ffffff", black: "#1b1f3b" };
  const MIX = { orange: "#ff8c1a", green: "#3fae49", purple: "#8a3fc4", pink: "#ff9ec4", "light blue": "#9cc8ff", cream: "#fff1b8",
    "dark red": "#8c1c24", navy: "#1f2f6b", grey: "#9a9aa6" };
  const POT = { red: "01", yellow: "02", blue: "03", white: "04" };
  /** What two paints make: a named mix where it has one, otherwise the halfway colour. */
  function blend(a, b) {
    const name = Object.entries({ orange: ["red", "yellow"], green: ["yellow", "blue"], purple: ["red", "blue"], pink: ["red", "white"],
      "light blue": ["blue", "white"], cream: ["yellow", "white"], "dark red": ["red", "black"], navy: ["blue", "black"], grey: ["white", "black"] })
      .find(([, p]) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
    if (name) return MIX[name[0]];
    if (a === b) return PAINT[a];
    const hex = (c) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
    return `rgb(${hex(PAINT[a]).map((v, k) => Math.round((v + hex(PAINT[b])[k]) / 2)).join(",")})`;
  }
  C.run({
    title: "Colour Mixing",
    goal: "Mix two paints to make the colour.",
    closure: "All done! You mixed lots of colours today.",
    checkLabel: "Mix",
    stages: { "colourmix.mix": "Mix two colours", "colourmix.light_dark": "Lighter and darker" },
    praise: (item) => `Yes! That makes ${item.data.target}.`,
    look: (id) => ({ name: `${id} paint`, word: id, ...(POT[id] ? { art: `../../art/colour-mixing/${POT[id]}.webp` }
      : { draw: (g) => { C.shape(g, "M24 30h52l-5 56H29z", PAINT.black); C.shape(g, "M20 22h60v12H20z", "#4a4f6b"); } }) }),
    scene(item) {
      const s = svg("svg", { viewBox: "0 0 420 170", class: "mix", "aria-hidden": "true" });
      const target = svg("path", { class: "blob", fill: MIX[item.data.target], d: "M70 30c40-6 62 22 56 52s-30 52-64 46-48-34-40-62 18-32 48-36z" });
      const label = svg("text", { x: 92, y: 160 }); label.textContent = "Make this";
      const bowl = svg("g", { class: "bowl" });
      const paint = svg("ellipse", { class: "blob", cx: 300, cy: 52, rx: 54, ry: 11, fill: "#fff", "stroke-width": 3 });
      bowl.append(svg("image", { href: "../../art/colour-mixing/05.webp", x: 220, y: 20, width: 160, height: 140 }), paint);
      const mine = svg("text", { x: 300, y: 160 }); mine.textContent = "Your bowl";
      s.append(target, label, bowl, mine);
      const el = window.LumosKit.h("div", { class: "scene" }, s);
      const show = (res) => { const t = (res.taps || []).map((i) => item.cards[i]); paint.setAttribute("fill", t.length === 2 ? blend(t[0], t[1]) : t.length ? PAINT[t[0]] : "#fff"); };
      const stir = async () => { s.classList.add("stir"); await wait(1900); s.classList.remove("stir"); };
      return { el, update: show, success: async (res) => { show(res); await stir(); }, help: async (_l, _fb, res) => { show(res); await stir(); } };
    },
  });
})();
