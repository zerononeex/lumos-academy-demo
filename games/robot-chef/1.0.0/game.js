// Robot Chef 1.0.0 (Coding · Computational thinking, K–3) on game kit 1.6.0 and picture cards 1.0.0: the robot chef does
// exactly what the cards say, in order. Put the instruction cards in order (three for Kindergarten, four after); from
// Grade 1 some rounds hide a silly card to leave out. The instructions are written on the cards; the robot is drawn in
// the house style (no landed art exists for this game yet).
(() => {
  "use strict";
  const C = window.LumosCards, { h, svg } = window.LumosKit;
  const robot = () => {
    const s = svg("svg", { viewBox: "0 0 100 100", "aria-hidden": "true", class: "show" });
    C.shape(s, "M28 34h44v40H28z", "#c9ccd6"); C.shape(s, "M34 14h32l4 20H30z", "#fff"); C.circle(s, 42, 50, 5, "#3c9cff"); C.circle(s, 58, 50, 5, "#3c9cff");
    C.shape(s, "M42 62q8 6 16 0", "none"); C.shape(s, "M28 44H14v14M72 44h14v14", "none", { "stroke-width": 6 });
    return s;
  };
  C.run({
    title: "Robot Chef",
    goal: "Tell the robot chef what to do, in order.",
    closure: "All done! The robot chef cooked lots of snacks today.",
    checkLabel: "Cook",
    stages: { "chef.recipe": "In order", "chef.silly": "Leave out the silly card" },
    praise: () => "Yes! The robot followed every step.",
    look: C.word,
    scene: () => ({ el: h("div", { class: "scene" }, robot()) }),
  });
})();
