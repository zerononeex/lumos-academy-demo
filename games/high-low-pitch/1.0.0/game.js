// High and Low 1.0.0 (Music · Listening, K–3) on game kit 1.6.0 and picture cards 1.0.0: play two notes; which one is
// higher? Then (Grades 1–3) put three notes in order, lowest first. Each card plays its note when tapped, and is drawn
// exactly as high on the card as it sounds. The low notes play LOUD and the high one soft, so loudness never gives the
// answer away (louder_taken_as_higher). Gaps shrink by grade. Drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit;
  const PITCH = [262, 294, 330, 349, 392, 440, 494, 523];
  C.run({
    title: "Echo Canyon",
    goal: "Listen for the higher note.",
    closure: "All done! Your ears found lots of high notes today.",
    stages: { "pitch.higher": "Which is higher?", "pitch.order": "Low to high" },
    praise: () => "Yes! You heard which note is higher.",
    words: false,
    look: (id) => {
      const [hz, vol] = id.split(" "), k = PITCH.indexOf(Number(hz)), loud = vol === "loud";
      return { name: `a ${vol} note, ${k} step${k === 1 ? "" : "s"} up`, sound: () => K.tone(Number(hz), 600, loud ? 0.32 : 0.07, "triangle"),
        draw: (g) => { C.shape(g, "M10 90h80", "none", { "stroke-dasharray": "4 6" }); C.circle(g, 50, 84 - k * 10, loud ? 14 : 9, loud ? "#e5383b" : "#ffd23f"); C.shape(g, `M${loud ? 64 : 59} ${84 - k * 10}V${48 - k * 10}`, "none"); } };
    },
  });
})();
