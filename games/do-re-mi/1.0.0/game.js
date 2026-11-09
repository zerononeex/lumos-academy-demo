// Do-Re-Mi 1.0.0 (Music · Notes, K–3) on game kit 1.6.0 and picture cards 1.0.0: notes on a simple staff. Do sits on
// the bottom line, re in the space above, mi on the next line, then fa and sol. K–1: tap the note Pip sings, and put do,
// mi and sol in order, lowest first; Grades 1–3: which note is higher (a big loud low note beside a small soft high one);
// Grades 2–3: do-re-mi-sol in order, and match a three-note tune to its staff picture. Every note plays its pitch when
// tapped; "Hear it again" plays Pip's note or tune as often as the child likes. Each card's name says where its note sits
// (line 1, space 1...), never its name, so the buttons twin asks the same thing. LANDED ART: the note friends
// (public/games/art/do-re-mi, B5-T4, a colour per pitch) and the music scene (public/games/scenes/do-re-mi.webp, B5-W1).
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg } = K;
  const SOLFA = ["do", "re", "mi", "fa", "sol", "la", "ti"], HZ = [262, 294, 330, 349, 392, 440, 494];
  const where = (p) => (p % 2 ? `space ${(p + 1) / 2}` : `line ${p / 2 + 1}`);
  const play = (ps) => ps.forEach((p, k) => K.tone(HZ[p], 420, 0.18, "triangle", k * 520));
  /** A staff with notes at places `ps` (0 = the bottom line); `big`: drawn large (and loud). */
  function staff(g, ps, big) {
    for (let k = 0; k < 4; k++) g.append(svg("line", { x1: 4, x2: 96, y1: 84 - k * 16, y2: 84 - k * 16, stroke: "#1b1f3b", "stroke-width": 2.5 }));
    ps.forEach((p, k) => {
      const x = ps.length === 1 ? 50 : 22 + k * 28, y = 84 - p * 8, s = big ? 40 : ps.length === 1 ? 30 : 26;
      g.append(svg("image", { href: `../../art/do-re-mi/0${p + 1}.webp`, x: x - s * 0.42, y: y - s * 0.72, width: s, height: s }));
    });
  }
  const notes = (id) => id.split(" ").filter((w) => SOLFA.includes(w)).map((w) => SOLFA.indexOf(w));
  C.run({
    title: "Do-Re-Mi",
    goal: "Find the notes on the staff.",
    closure: "All done! You read lots of notes today.",
    stages: { "doremi.tap": "Tap the note Pip sings", "doremi.higher": "Which note is higher?", "doremi.order": "Low to high", "doremi.tune": "Match the tune" },
    praise: () => "Yes! You found it on the staff.",
    words: false,
    look: (id) => {
      const ps = notes(id), big = id.endsWith(" loud");
      return { name: ps.length > 1 ? `notes on ${ps.map(where).join(", ")}` : `a ${big ? "big loud" : id.endsWith(" soft") ? "small soft" : ""} note on ${where(ps[0])}`.replace("a  note", "a note"),
        draw: (g) => staff(g, ps, big), sound: () => play(ps) };
    },
    hear: (item) => item.data && item.data.sing && play(notes(item.data.sing)),
  });
})();
