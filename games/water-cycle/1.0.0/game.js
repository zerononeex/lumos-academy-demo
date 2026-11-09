// Water Cycle 1.0.0 (Living Things · Plants and water, K–3) on game kit 1.6.0 and picture cards 1.0.0: the water's
// trip, round and round. K: sun, cloud, rain in order; Grade 1 adds the water rising; Grades 2–3 the lake it collects in.
// "Where does it come from?" asks about rain, clouds and the lake (the tap and smoke traps); Grades 1–3 say what comes
// next; Grade 3 names each part (evaporation, condensation, precipitation, collection). LANDED ART: the water-cycle
// scene behind the board (public/games/scenes/water-cycle.webp, B5-W3) and the GA-041 card sheet (cards/1.0.0/cards.js);
// the other cards are drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards;
  const BLUE = "#3c9cff", SUN = "#ffd23f", GREY = "#9a9aa6", WHITE = "#ffffff";
  const sun = (g, x = 30, y = 28, r = 16) => { for (let k = 0; k < 8; k++) C.shape(g, `M${x + (r + 4) * Math.cos(k * 0.785)} ${y + (r + 4) * Math.sin(k * 0.785)}L${x + (r + 11) * Math.cos(k * 0.785)} ${y + (r + 11) * Math.sin(k * 0.785)}`, "none"); C.circle(g, x, y, r, SUN); };
  const cloud = (g, y = 40, fill = WHITE) => C.shape(g, `M24 ${y + 20}a14 14 0 0 1 4-27a18 18 0 0 1 34-4a14 14 0 0 1 14 31z`, fill);
  const drops = (g, y = 70, n = 3) => { for (let k = 0; k < n; k++) C.shape(g, `M${30 + k * 20} ${y - 12 + (k % 2) * 8}q-7 10 0 14q7-4 0-14z`, BLUE); };
  const tap = (g) => { C.shape(g, "M14 30h44v14H40v10H30V44H14z", GREY); C.shape(g, "M28 18h18v12H28z", "#e5383b"); drops(g, 82, 1); };
  const smoke = (g) => { C.shape(g, "M58 92V54h22v38z", "#c0392b"); [[66, 40, 10], [54, 26, 12], [38, 14, 13]].forEach(([x, y, r]) => C.circle(g, x, y, r, GREY)); };
  const DRAW = {
    "a cloud": (g) => cloud(g, 50),
    "rain and rivers": (g) => { drops(g, 30); C.shape(g, "M6 84q30-30 50-10t38-6", "none", { stroke: BLUE, "stroke-width": 9 }); },
    "the sun warms it": (g) => sun(g, 50, 50, 22),
    "a giant tap": tap, "a tap pumps it": tap,
    "smoke carries it": smoke, smoke,
    "the sand": (g) => C.shape(g, "M8 86q42-60 84 0z", "#f4c48b"),
  };
  // a card's short word under its picture (the buttons twin says the whole phrase)
  const SHORT = { "the sun warms the water": "sun warms", "water rises into the air": "water rises", "a cloud forms": "cloud forms",
    "water collects in the lake": "lake fills", "tiny drops of water": "water drops", "smoke from a chimney": "chimney smoke",
    "the sun warms it": "the sun", "smoke carries it": "smoke", "a tap pumps it": "a tap" };
  C.run({
    title: "Water Cycle",
    goal: "Sun, cloud, rain, and round again.",
    closure: "All done! You followed the water round and round.",
    stages: { "watercycle.order": "Round and round", "watercycle.where": "Where does it come from?", "watercycle.next": "What comes next?", "watercycle.name": "Name the part" },
    praise: () => "Yes! Round and round the water goes.",
    look: (id) => ({ name: id, word: SHORT[id], draw: DRAW[id] || ((g) => drops(g, 58, 1)) }), // a part's name (Grade 3) is a word card with one drop
  });
})();
