// Lumos picture words 1.0.0 (with picture cards 1.0.0, loaded after cards.js): how a word on a card looks. The
// landed pictures first (the game's own card art, then public/games/art/words-things, words-actions and words-more:
// B5-T5, B5-T6, GA-020, in sheet order), then the pictures those sheets lack, drawn in the house style. A word with no
// picture is written big (Grade 3 word cards).
(() => {
  "use strict";
  const C = window.LumosCards, { svg } = window.LumosKit;
  const THINGS = ["dog", "cat", "ball", "hat", "cup", "bed", "tree", "car", "book", "shoe", "fish", "cake"];
  const ACTIONS = ["run", "jump", "read", "eat", "sleep", "swim", "sing", "paint", "climb", "dance", "wave", "sit"];
  const MORE = ["sun", "star", "moon", "wall", "snake", "dish", "bee", "ring", "hook", "bat", "mat", "bun", "jar", "frog",
    "bus", "pin", "door", "bag", "log"];
  const nn = (k) => String(k + 1).padStart(2, "0");
  const BROWN = "#a0612b";
  const DRAWN = {
    red: (g) => C.shape(g, "M50 10c18 0 22 18 34 22s8 30-10 34-14 22-30 20-20-18-30-26S8 28 22 20s14-10 28-10z", "#e5383b"),
    two: (g) => C.text(g, 50, 52, "2", 76, "#7a2e9e"),
    // living things
    squirrel: (g) => { C.shape(g, "M60 84q30-10 24-40t-24-24q14 20-6 36z", "#c9853e"); C.circle(g, 42, 52, 18, "#d9a066"); C.circle(g, 36, 48, 3, "#1b1f3b"); C.shape(g, "M40 34l4-10 6 10", "#d9a066"); },
    bear: (g) => { C.circle(g, 50, 54, 28, BROWN); C.circle(g, 30, 30, 9, BROWN); C.circle(g, 70, 30, 9, BROWN); C.circle(g, 42, 50, 3, "#1b1f3b"); C.circle(g, 58, 50, 3, "#1b1f3b"); C.circle(g, 50, 62, 5, "#1b1f3b"); },
    // materials and mixing (Chemistry)
    nail: (g) => { C.shape(g, "M30 18h40v8H30z", "#9a9aa6"); C.shape(g, "M46 26h8v52l-4 10-4-10z", "#9a9aa6"); },
    wood: (g) => { C.shape(g, "M14 40h66v30H14z", BROWN); C.shape(g, "M80 40a10 15 0 0 1 0 30a10 15 0 0 1 0-30z", "#e6b07a"); },
    metal: (g) => { C.shape(g, "M16 40h68l-8 30H24z", "#c9ccd6"); C.shape(g, "M26 48h20", "none", { stroke: "#fff", "stroke-width": 5 }); },
    glass: (g) => { C.shape(g, "M26 14h48l-6 72H32z", "#dff1ff"); C.shape(g, "M34 24l-2 40", "none", { stroke: "#fff", "stroke-width": 5 }); },
    fabric: (g) => { C.shape(g, "M14 30q18-12 36 0t36 0v44q-18 12-36 0t-36 0z", "#b37bff"); C.shape(g, "M14 52q18-12 36 0t36 0", "none"); },
    paper: (g) => { C.shape(g, "M24 12h40l14 14v62H24z", "#fff"); C.shape(g, "M34 40h32M34 52h32M34 64h22", "none", { "stroke-width": 3 }); },
    dissolves: (g) => { C.shape(g, "M26 20h48l-6 66H32z", "#fff"); C.shape(g, "M29 44h42l-3 42H32z", "#ffb3c6"); C.shape(g, "M60 10L44 70", "none", { "stroke-width": 5 }); },
    "does not dissolve": (g) => { C.shape(g, "M26 20h48l-6 66H32z", "#fff"); C.shape(g, "M29 44h42l-3 42H32z", "#9cc8ff"); C.shape(g, "M33 86q17-14 34 0z", "#f4c48b"); },
  };
  // A paw print with n toes (2: a split hoof; 3: a bird's or, webbed, a duck's), drawn bigger for a bigger animal.
  const TRACK = { mouse: [4, 0.5], bird: [3, 0.6], duck: [3, 0.8], cat: [4, 0.75], dog: [4, 0.95], deer: [2, 0.95], bear: [5, 1.15] };
  const print = (who) => (g) => {
    const [n, s] = TRACK[who], p = svg("g", { transform: `translate(50 54) scale(${s})` });
    g.append(p);
    if (n === 2) { C.shape(p, "M-4 -30q-18 6-16 30t16 26zM4 -30q18 6 16 30t-16 26z", "#6b3e1f"); return; }
    if (n === 3) { C.shape(p, who === "duck" ? "M0 18L-26 -22q12 2 26 -12 14 14 26 12z" : "M0 18L-22 -24M0 18V-30M0 18L22 -24", who === "duck" ? "#6b3e1f" : "none", { "stroke-width": who === "duck" ? 4 : 7 }); return; }
    C.shape(p, "M-18 10q0-16 18-16t18 16-18 16-18-16z", "#6b3e1f");
    const xs = n === 5 ? [-24, -12, 0, 12, 24] : [-18, -6, 6, 18];
    xs.forEach((x, k) => C.circle(p, x, -16 - (k === 0 || k === xs.length - 1 ? 0 : 6), 6, "#6b3e1f"));
    if (who === "dog" || who === "bear") xs.forEach((x, k) => C.shape(p, `M${x} ${-26 - (k === 0 || k === xs.length - 1 ? 0 : 6)}l0 -6`, "none"));
  };
  for (const w of Object.keys(TRACK)) DRAWN[`${w} track`] = print(w);
  const art = (w) => C.pic(w) || (THINGS.includes(w) ? `../../art/words-things/${nn(THINGS.indexOf(w))}.webp`
    : ACTIONS.includes(w) ? `../../art/words-actions/${nn(ACTIONS.indexOf(w))}.webp`
    : MORE.includes(w) ? `../../art/words-more/${nn(MORE.indexOf(w))}.webp` : null);
  /** A word's card: its picture and name, or (no picture) the word itself written big, with no second word below. */
  C.word = (w) => (art(w) ? { name: w, art: art(w) } : DRAWN[w] ? { name: w, draw: DRAWN[w] }
    : { name: w, word: " ", draw: (g) => words(g, w) });
  /** A word or a short phrase written big, wrapped to fit the card. */
  function words(g, w) {
    const per = w.length > 32 ? 16 : 11; // a whole sentence gets wider, smaller lines so it still fits the card
    const lines = w.split(" ").reduce((ls, x) => ((ls[ls.length - 1] + " " + x).trim().length <= per ? [...ls.slice(0, -1), (ls[ls.length - 1] + " " + x).trim()] : [...ls, x]), [""]);
    const size = lines.length === 1 ? (w.length > 5 ? 24 : 30) : per > 11 ? 11 : Math.min(16, 88 / (lines.length * 1.15));
    lines.forEach((l, k) => C.text(g, 50, 50 + (k - (lines.length - 1) / 2) * size * 1.15, l, size));
  }
  /** The word a question is about, on a gold-edged card for the scene above the board (decorative: the prompt says it). */
  C.wordCard = (w, attrs = {}) => {
    const s = svg("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", class: "show", ...attrs }), L = C.word(w);
    s.append(svg("rect", { x: 3, y: 3, width: 94, height: 94, rx: 16, fill: "#fff", stroke: "#ffb703", "stroke-width": 6 }));
    if (L.art) s.append(svg("image", { href: L.art, x: 15, y: 6, width: 70, height: 70 }));
    else { const g = svg("g", { transform: "translate(15 5) scale(.7)" }); L.draw(g); s.append(g); }
    if (L.word !== " ") C.text(s, 50, 88, w, 17);
    return s;
  };
})();
