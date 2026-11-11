// Bridge Constructor 1.0.0 (Physics · Building, Grades 4–7) on game kit 1.6.0 and picture cards 1.0.0: build a bridge
// across the gap from planks (one span long), steel beams (two spans long) and stone pillars (a support under a joint),
// left to right, then Test it under the truck. A light truck: every joint between two pieces needs a pillar under it.
// A heavy truck: planks bend, so only beams will hold it. A bridge that will not hold sags in code and the truck rolls
// back gently (never a crash). Landed art: the bridge parts (B6-T2), the truck (B6-A1) and the valley scene (B6-W3).
(() => {
  "use strict";
  const C = window.LumosCards, { h, svg, wait } = window.LumosKit;
  const ART = "../../art/bridge-constructor/";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PART = { plank: "01", "steel beam": "02", pillar: "04" }, LONG = { plank: 1, "steel beam": 2, pillar: 0 };
  const look = (id) => ({ name: id, art: `${ART}${PART[id]}.webp` });
  function scene(item) {
    const w = item.data.span, L = 60, R = 340, unit = (R - L) / w, DECK = 84;
    const s = svg("svg", { viewBox: "0 0 400 190", "aria-hidden": "true" });
    s.append(svg("path", { d: `M0 ${DECK + 12}H${L}V190H0z M${R} ${DECK + 12}H400V190H${R}z`, fill: "#8fdc9a", stroke: "#1b1f3b", "stroke-width": 4, "stroke-linejoin": "round" }),
      svg("path", { d: `M${L} 176q35-8 70 0t70 0 70 0 70 0V190H${L}z`, fill: "#7ec3ff" }));
    const bridge = svg("g"), truck = svg("svg", { width: 90, height: 90, viewBox: "0 0 256 256", y: DECK - 74 });
    const sheet = svg("image", { href: `${ART}truck.webp`, width: 1024, height: 256 });
    truck.append(sheet); s.append(bridge, truck);
    if (item.data.heavy) s.append(Object.assign(svg("text", { x: 200, y: 22, "font-size": 18, "text-anchor": "middle", fill: "#1b1f3b" }), { textContent: "Heavy truck" }));
    const at = (x) => truck.setAttribute("x", x - 45);
    const build = (taps) => {
      bridge.replaceChildren(); let x = L;
      for (const id of (taps || []).map((i) => item.cards[i])) {
        if (id === "pillar") { bridge.append(svg("image", { href: `${ART}04.webp`, x: x - 14, y: DECK + 4, width: 28, height: 190 - DECK - 4, preserveAspectRatio: "none" })); continue; }
        const len = Math.min(LONG[id] * unit, 400 - x);
        bridge.append(svg("image", { href: `${ART}${PART[id]}.webp`, x, y: DECK - 6, width: len, height: 26, preserveAspectRatio: "none" })); x += LONG[id] * unit;
      }
    };
    /** The truck drives from the left cliff; `to` is where it stops (past the right cliff when the bridge holds). */
    const drive = async (from, to) => {
      const n = reduced ? 1 : 24;
      for (let k = 1; k <= n; k++) { at(from + ((to - from) * k) / n); sheet.setAttribute("x", -256 * (k % 4)); await wait(reduced ? 600 : 70); }
    };
    const reset = () => { at(30); bridge.removeAttribute("transform"); };
    reset(); build([]);
    const holds = async (res) => { build(res.taps); await drive(30, 370); await wait(400); reset(); };
    return {
      el: h("div", { class: "scene" }, s),
      update: (res) => build(res.taps),
      success: holds, model: holds,
      async help(_l, _f, res) { // it will not hold: the truck starts across, the bridge sags, the truck rolls back
        build(res.taps); await drive(30, L + unit / 2);
        bridge.setAttribute("transform", "translate(0 10)"); await wait(500);
        await drive(L + unit / 2, 30); bridge.removeAttribute("transform"); await wait(300);
      },
    };
  }
  C.run({
    title: "Master Architect's Studio",
    goal: "Build a bridge that holds the truck.",
    closure: "All done! Your bridges held lots of trucks today.",
    checkLabel: "Test it",
    stages: { "bridgecon.span": "Span the gap", "bridgecon.load": "Heavy truck" },
    praise: () => "Yes! The bridge holds.",
    look,
    scene,
  });
})();
