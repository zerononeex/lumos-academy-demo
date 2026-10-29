// Balance Scale 1.3.0: the 1.2.0 game on kit 1.5.0 (its world: scene behind the board, painted tile); same items, responses and checker.
// Balance Scale 1.2.0: the 1.1.0 game on the kit 1.4.0 stylesheet (the Lumos look, DESIGN.md v2); same items, responses and checker.
// Balance Scale 1.1.0 (K–3): the 1.0.0 game on kit 1.3.0 with its presentation rebuilt (docs/GAME_FEEL_REVIEW.md,
// Balance Scale). Equality as balance: a two-pan scale the child loads with value tiles. The tilt IS the feedback: every
// tap drops a tile on the child's pan and the beam swings at once (a short spring), level glows. Tiles are picked from a
// tray of big tiles under the scale (tap a tile: one more on the pan; − takes one off), not from a list of counters.
// Stages: make both sides match (K–1) → match a total (a weight, two weights, or a weight and a balloon that lifts its
// side: take away) → tiles of different values (counting tiles never balances, only value does) → same value on both
// sides (4 + 3 = □ + 2: predict, then the scale is let go) → Grade 3: the box in any place. Same items, same responses,
// same checker as 1.0.0: the server decides every answer; this file only presents. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const SIZE = { 1: 42, 2: 50, 5: 60, 10: 70 }; // a tile's size grows with its value (and every tile shows its number)
  const sum = (v) => v.reduce((s, x) => s + x, 0);
  /** One side's value with the box worth `u` (a balloon is negative; a `minus` box is a balloon too). */
  const value = (side, u, minus) => sum(side.map((v) => (v === null ? (minus ? -u : u) : v)));
  const words = (v, minus, box) => (v === null ? `${minus ? "a balloon box lifting" : "the box"} ${box || "?"}` : v < 0 ? `a balloon lifting ${-v}` : String(v));
  /** "4 + 3", "□ − 4", "12 − □" */
  const side = (v, box, minus) => v.map((n, i) => (n === null ? `${i ? (minus ? " − " : " + ") : ""}${box ?? "□"}` : `${i ? (n < 0 ? " − " : " + ") : ""}${Math.abs(n)}`)).join("");

  function scale(item, area, api) {
    const loads = !item.stage.match(/relational|unknown/), g3 = item.skill.startsWith("g3-");
    let spec = item, counts = [], box = 0, held = !loads, showTotals = item.mode === "guided", pulse = null;
    let pic, beam, pans, props, said, steppers = [], eq;

    const pan = () => spec.palette.flatMap((p, i) => Array(counts[i] || 0).fill(p)).sort((a, b) => b - a);
    const left = () => spec.left, right = () => (loads ? pan() : spec.right);
    const totals = () => [value(left(), box, spec.minus), value(right(), box, spec.minus)];

    function board(s) {
      spec = s;
      area.replaceChildren();
      if (!loads) {
        eq = h("p", { class: "eq" });
        area.append(eq);
      }
      pic = svg("svg", { viewBox: "-30 0 760 380", class: "visual scale", "aria-hidden": "true" }); // the pans swing out past 0 and 700
      beam = svg("g", { class: "beam" });
      beam.append(svg("rect", { x: 90, y: 162, width: 520, height: 16, rx: 8 }));
      pans = [svg("g", { class: "pan" }), svg("g", { class: "pan" })];
      props = svg("g");
      pic.append(svg("path", { class: "post", d: "M350 170 L300 360 H400 Z" }), props, beam, ...pans);
      said = h("p", { class: "dom scaletext", "aria-live": "polite" });
      area.append(h("figure", { class: "manip wide" }, h("figcaption", {}, loads ? "The scale: your side is the right" : "The scale"), pic, said));
      const controls = h("div", { class: `loads${loads ? " tiletray" : ""}` });
      area.append(controls);
      steppers = loads
        ? spec.palette.map((p, i) => K.stepper(controls, { label: spec.palette.length > 1 ? `Tiles of ${p}` : "Tiles", min: 0, max: 12, value: counts[i] || 0,
          more: h("span", { class: `traytile v${p}` }, String(p)),
          onChange: (v) => { const added = v > (counts[i] || 0) ? p : null; counts[i] = v; draw(added); api.say(String(p)); api.changed(); } }))
        : g3 ? [K.stepper(controls, { label: "Box tens", min: 0, max: 9, value: Math.floor(box / 10), onChange: (v) => setBox(v * 10 + (box % 10)) }),
          K.stepper(controls, { label: "Box ones", min: 0, max: 9, value: box % 10, onChange: (v) => setBox(box - (box % 10) + v) })]
          : [K.stepper(controls, { label: "The box", min: 0, max: 20, value: box, onChange: setBox })];
      draw();
    }
    function setBox(v) { box = v; draw(); api.changed(); }

    /** Tiles on one pan, sized by value, rows from the tray upward; balloons above. Local coordinates: hook at 0,0. */
    function drawPan(g, tiles, total, weights, added) {
      const kids = [svg("line", { x1: 0, y1: 0, x2: -105, y2: 92 }), svg("line", { x1: 0, y1: 0, x2: 105, y2: 92 }),
        svg("rect", { class: "tray", x: -120, y: 92, width: 240, height: 10, rx: 4 })];
      let x = -112, y = 92, row = 0, b = 0;
      for (const v of tiles) {
        if (v !== null && v < 0 || (v === null && spec.minus)) { // a balloon (or the box as a balloon): it lifts its side
          const bx = -70 + 140 * (b++ % 2), t = svg("text", { x: bx, y: -48, "text-anchor": "middle" });
          t.textContent = `−${v === null ? box || "?" : -v}`;
          const ball = svg("g", { class: `balloon${v === null ? " box" : ""}` });
          ball.append(svg("line", { x1: bx, y1: -30, x2: bx, y2: 92 }), svg("circle", { cx: bx, cy: -56, r: 28 }), t);
          kids.push(ball);
          continue;
        }
        const s = v === null ? 60 : SIZE[v] || 76;
        if (x + s > 112) { x = -112; y -= row + 4; row = 0; }
        const drop = v === added; // one tile of the value just put on drops in
        if (drop) added = null;
        const tile = svg("g", { class: `tile${v === null ? " box" : weights ? " weight" : ""}${drop ? " drop" : ""}` });
        const t = svg("text", { x: x + s / 2, y: y - s / 2 + 8, "text-anchor": "middle" });
        t.textContent = v === null ? (box ? String(box) : "?") : String(v);
        tile.append(svg("rect", { x, y: y - s, width: s, height: s }), t);
        kids.push(tile);
        x += s + 4; row = Math.max(row, s);
      }
      if (total !== null) { const t = svg("text", { class: "total", x: 0, y: 132, "text-anchor": "middle" }); t.textContent = `= ${total}`; kids.push(t); }
      g.replaceChildren(...kids);
    }

    /** Everything follows the tiles: the pans, the tilt (held level while predicting), the words, the equation. */
    /** `added`: the value of the tile just put on (it drops in). */
    function draw(added = null) { // the tilt: every tile moves the beam (at least 3°), nearly level is nearly flat
      const [L, R] = totals(), diff = R - L, deg = held || !diff ? 0 : Math.sign(diff) * Math.max(3, 12 * Math.abs(diff) / Math.max(L, R)), rad = (deg * Math.PI) / 180;
      beam.style.transformOrigin = "350px 170px";
      beam.style.transform = `rotate(${deg}deg)`;
      [-1, 1].forEach((d, i) => { pans[i].style.transform = `translate(${350 + d * 245 * Math.cos(rad)}px, ${170 + d * 245 * Math.sin(rad)}px)`; });
      // Totals on guided items only (and never for a side whose box is still a guess, held still).
      const total = (v) => (showTotals && !(held && v.includes(null)) ? value(v, box, spec.minus) : null);
      drawPan(pans[0], left(), total(left()), spec.stage === "balance_target");
      drawPan(pans[1], right(), total(right()), false, added);
      pans.forEach((p, i) => p.classList.toggle("pulse", pulse === i));
      pans[1].classList.toggle("mine", loads); // the child's side: its tray glows
      pic.classList.toggle("level", !held && diff === 0 && (loads ? pan().length > 0 : box > 0));
      props.replaceChildren(...(held ? [svg("rect", { class: "prop", x: 85, y: 285, width: 50, height: 75 }), svg("rect", { class: "prop", x: 565, y: 285, width: 50, height: 75 })] : []));
      const list = (v) => `${v.map((n) => words(n, spec.minus, box)).join(", ") || "nothing"}${loads ? ` (${v.length} tile${v.length === 1 ? "" : "s"})` : ""}`;
      said.textContent = `Left side: ${list(left())}. Right side: ${list(right())}. ${held ? "The scale is held still until you check."
        : diff === 0 ? "The scale is level." : `The scale tips down on the ${diff > 0 ? "right" : "left"}.`}${total(left()) !== null ? ` Left: ${L}.` : ""}${total(right()) !== null ? ` Right: ${R}.` : ""}`;
      if (eq) eq.replaceChildren(side(spec.left, box || null, spec.minus), h("span", { class: "equals" }, "="), side(spec.right, box || null, spec.minus),
        h("small", {}, "= means the same value"));
      steppers.forEach((st, i) => st.set(loads ? counts[i] || 0 : g3 ? (i ? box % 10 : Math.floor(box / 10)) : box));
      api.refresh();
    }

    async function release(say = true) {
      held = false; draw();
      await wait(900);
      const [L, R] = totals();
      if (say) api.say(L === R ? "Level!" : `It tips. This side is ${Math.abs(R - L)} ${R > L ? "more" : "less"}.`);
      await wait(1500);
    }
    /** Name the unit difference explicitly, and point at the side that needs to change. */
    function difference() {
      const [L, R] = totals(), d = R - L, n = loads ? pan().length : 0;
      pulse = 1; draw();
      if (loads && n === left().length && d) return `Both sides have ${n} tile${n === 1 ? "" : "s"}, but this side is ${Math.abs(d)} ${d > 0 ? "more" : "less"}.`;
      return d < 0 ? `This side needs ${-d} more.` : d > 0 ? `This side has ${d} too many.` : "Level!";
    }

    const ctl = {
      begin(retry) {
        if (retry) return;
        const text = { // one short line: the goal, then where to act
          balance_match: "Make it level. Tap tiles onto your side.",
          balance_target: "Make it level. Tap tiles onto your side.",
          balance_mixed: "Make it level. Look at each tile's number!",
          balance_relational: "Both sides have the same value. What goes in the box?",
          balance_unknown: "What number in the box makes it level?",
        }[item.stage];
        api.prompt(text, "");
      },
      ready: () => (loads ? pan().length > 0 && pan().length <= 12 : box > 0),
      response: () => (loads ? { pan: pan() } : { read: box }),
      state: () => (loads ? { counts: counts.slice() } : { box }),
      restore(s) { counts = (s.counts || []).slice(); box = s.box || 0; held = !loads; pulse = null; draw(); },
      async model() {
        // Same task type, neighbouring numbers (never this item's answer).
        showTotals = true;
        if (loads) {
          const l = item.left.slice(), last = l.length - 1;
          l[last] = l[last] > 1 ? l[last] - 1 : l[last] + 1;
          board({ ...item, left: l });
          api.say(`Watch me. This side is ${value(l, 0)}.`); await wait(2600);
          let rest = value(l, 0);
          for (const [i, p] of [...item.palette.entries()].reverse()) {
            while (rest >= p) { counts[i] = (counts[i] || 0) + 1; rest -= p; draw(); api.say(`A ${p}.`); await wait(1600); }
          }
          api.say(`Level! Both sides are ${value(l, 0)}. Not the same tiles, the same value. Now it's your turn.`); await wait(3500);
        } else {
          const r = item.right.slice(), k = r.findIndex((v) => v !== null && v > 1);
          const s = k >= 0 ? (r[k] -= 1, { ...item, right: r }) : { ...item, left: item.left.map((v) => (v !== null && v > 1 ? v + 1 : v)) };
          board(s);
          const u = boxOf(s);
          api.say(`Watch me. ${side(s.left, null, s.minus)} equals ${side(s.right, null, s.minus)}. Both sides must have the same value.`); await wait(3800);
          box = u; draw();
          api.say(`I think the box is ${u}. Let's let go.`); await wait(2200);
          await release(false);
          api.say(`Level! ${side(s.left, u, s.minus)} is the same value as ${side(s.right, u, s.minus)}. Now it's your turn.`); await wait(3500);
        }
        counts = []; box = 0; held = !loads; showTotals = item.mode === "guided";
        board(item);
      },
      async help(level, fb) {
        if (!loads) await release(false);
        api.say(`${fb.feedback ? `${fb.feedback} ` : ""}${difference()}`);
        await wait(3200);
        pulse = null;
        if (level >= 2) { // partial model: each side's value written under it
          showTotals = true;
          api.say(`This side is ${value(left(), box, spec.minus)} altogether.`);
        }
        held = !loads; draw();
        api.prompt(loads ? "Try again. Make it level." : "Try again. What goes in the box?", "");
      },
      async worked(sol) {
        showTotals = true;
        if (loads) {
          counts = [];
          draw();
          for (const p of sol.pan) { counts[spec.palette.indexOf(p)] = (counts[spec.palette.indexOf(p)] || 0) + 1; draw(); api.say(`A ${p}.`); await wait(1500); }
        } else { box = sol.read; draw(); await wait(1200); await release(false); }
        const [L] = totals();
        api.say(`Level. Both sides are ${L}.`); await wait(2500);
      },
      async success() {
        if (!loads) await release(false);
        const [L] = totals();
        api.say(loads ? `Level! Both sides are ${L}.` : `Level! ${side(spec.left, box, spec.minus)} is the same value as ${side(spec.right, box, spec.minus)}.`);
        api.feedback(loads ? `Yes! Both sides are ${L}.` : `Yes! ${side(spec.left, box, spec.minus)} = ${side(spec.right, box, spec.minus)}`, "good");
        await wait(2500);
      },
    };
    /** The box's value that levels the scale (for the demonstrator's own equation). */
    const boxOf = (s) => {
      const k = (s.left.includes(null) ? 1 : -1) * (s.minus ? -1 : 1);
      return -(value(s.left, 0) - value(s.right, 0)) / k;
    };
    board(item);
    return ctl;
  }

  K.run({
    title: "Balance Scale", goal: "Make both sides weigh the same.",
    closure: "All done! You made the scale level.",
    stages: {
      balance_match: { name: "Make it balance" }, balance_target: { name: "Match the total" },
      balance_mixed: { name: "Tiles of different values" }, balance_relational: { name: "Same value on both sides" },
      balance_unknown: { name: "The box" },
    },
    praise: () => "Yes! Level.",
    mount: scale,
  });
})();
