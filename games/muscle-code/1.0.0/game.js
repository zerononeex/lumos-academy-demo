// Muscle Code 1.0.0 (Coding · Computational thinking, Grades 4–7) on game kit 1.6.0 and picture cards 1.0.0: program the
// body (the owner's anatomy × coding idea). Put a movement's steps in order so Pip performs it (jump, throw, kick,
// climb a step, sit down), then Run it; the top rung asks which muscle pulls for a move, because muscles only pull and
// work in pairs. The steps are written on the cards; Pip is new drawn art in the house style (no landed art exists).
(() => {
  "use strict";
  const C = window.LumosCards, { h, svg, wait } = window.LumosKit;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const limb = (g, d, colour = "#ffb48a") => { C.shape(g, d, "none", { stroke: "#1b1f3b", "stroke-width": 15, "stroke-linecap": "round", "stroke-linejoin": "round" });
    C.shape(g, d, "none", { stroke: colour, "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }); };
  /** Pip: a round friendly figure, arms and legs as soft limbs (crouched when `bend`). */
  function pip(g, bend) {
    limb(g, bend ? "M42 72l-8 10 6 12" : "M44 72l-4 24", "#3c9cff"); limb(g, bend ? "M58 72l8 10-6 12" : "M56 72l4 24", "#3c9cff");
    limb(g, bend ? "M38 48l-14-6-6 8" : "M38 48l-12 14"); limb(g, bend ? "M62 48l14-6 6 8" : "M62 48l12 14");
    C.shape(g, "M36 44q14-8 28 0l2 30H34z", "#ffd23f");
    C.circle(g, 50, 28, 15, "#ffb48a"); C.circle(g, 45, 27, 2.6, "#1b1f3b"); C.circle(g, 55, 27, 2.6, "#1b1f3b");
    C.circle(g, 41, 32, 3, "#ff8fa3"); C.circle(g, 59, 32, 3, "#ff8fa3"); C.shape(g, "M46 33q4 3 8 0", "none");
  }
  C.run({
    title: "Cyborg Training Ground",
    goal: "Program the body, step by step.",
    closure: "All done! Pip moved every way you programmed today.",
    checkLabel: "Run",
    stages: { "muscle.order": "Program the move", "muscle.pair": "Muscle pairs" },
    praise: () => "Yes! Pip did it.",
    look: C.word,
    scene() {
      const s = svg("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", class: "show" }), still = svg("g"), crouch = svg("g", { visibility: "hidden" });
      pip(still, false); pip(crouch, true); s.append(still, crouch);
      /** Pip runs the move: crouch, then up and back down (a still pose when motion is reduced). */
      const run = async () => {
        if (reduced) { await wait(900); return; }
        for (const [down, y] of [[true, 0], [false, -12], [false, 0], [true, 0], [false, 0]]) {
          crouch.setAttribute("visibility", down ? "visible" : "hidden"); still.setAttribute("visibility", down ? "hidden" : "visible");
          s.setAttribute("style", `transform: translateY(${y}px)`); await wait(320);
        }
      };
      return { el: h("div", { class: "scene" }, s), success: run, model: run };
    },
  });
})();
