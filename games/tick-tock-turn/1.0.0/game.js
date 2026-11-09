// Tick-Tock Turn 1.0.0 (Math · Shapes and measuring, Grades 4–5) on game kit 1.6.0 and picture cards 1.0.0: the clock
// shows a time; move its hands forward or back by the minutes said, and pick the clock that shows the new time. Jumps
// grow: up to half an hour, then back, then over an hour ("1 hour and 20 minutes"). Clock reading is BC content at this
// band. The cards show clocks only (no digits: reading them is the point); each card's name says its time for the
// buttons twin. The hands are code, so every time shown is exact; the clock bodies are the landed tile set (B6-T1).
(() => {
  "use strict";
  const C = window.LumosCards, { h, svg, wait } = window.LumosKit;
  const ART = "../../art/tick-tock-turn/";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** Hands at `t` minutes past 12 on a face centred at (cx, cy): the hour hand moves on as the minutes pass. */
  function hands(g, cx, cy, len) {
    const hour = svg("line", { x1: cx, y1: cy, x2: cx, y2: cy - len * 0.62, stroke: "#1b1f3b", "stroke-width": len * 0.16, "stroke-linecap": "round" });
    const min = svg("line", { x1: cx, y1: cy, x2: cx, y2: cy - len, stroke: "#3c9cff", "stroke-width": len * 0.1, "stroke-linecap": "round" });
    g.append(hour, min, svg("circle", { cx, cy, r: len * 0.1, fill: "#1b1f3b" }));
    return (t) => { hour.setAttribute("transform", `rotate(${(t / 2) % 360} ${cx} ${cy})`); min.setAttribute("transform", `rotate(${(t * 6) % 360} ${cx} ${cy})`); };
  }
  const minutes = (id) => { const [hh, mm] = id.split(":").map(Number); return (hh % 12) * 60 + mm; };
  const look = (id) => ({ name: id, draw: (g) => {
    g.append(svg("image", { href: `${ART}01.webp`, width: 100, height: 100 }));
    hands(g, 50, 53, 25)(minutes(id));
  } });
  C.run({
    title: "Tick-Tock Turn",
    goal: "Move the hands, then pick the new time.",
    closure: "All done! You moved the clock hands lots of times today.",
    stages: { "ticktock.forward": "Forward", "ticktock.back": "Back", "ticktock.big": "Big jumps" },
    praise: () => "Yes! That is the new time.",
    words: false,
    look,
    scene(item) {
      const s = svg("svg", { viewBox: "0 0 256 256", "aria-hidden": "true" }), from = item.data.from, by = item.data.by;
      s.append(svg("image", { href: `${ART}04.webp`, width: 256, height: 256 }));
      const set = hands(s, 128, 135, 60);
      set(from);
      /** The hands sweep from the start by the minutes said, as a real clock turns (or jump there when motion is reduced). */
      const turn = async () => {
        if (reduced) { set(from + by); await wait(1200); }
        else for (let k = 1; k <= 30; k++) { set(from + (by * k) / 30); await wait(50); }
        await wait(700); set(from);
      };
      return { el: h("div", { class: "scene" }, s), success: turn, model: turn };
    },
  });
})();
