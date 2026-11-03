// Fraction Fold 1.0.0 (Grade 3) on kit 1.5.0: fractions as equal parts of a whole. Name a shaded part of a folded strip
// or circle; fold and shade a fraction (Fold in half / Fold in three / Unfold, then tap parts to shade them); say whether
// parts are equal (parts that are not the same size are drawn not the same size, and are not thirds yet); and find the
// bigger of two unit fractions by looking at the pieces. Buttons view: the same fold controls, and the parts as a
// labelled list ("Part 1 of 4") that shades the same parts. The server decides every answer; this file only presents.
// Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const NAME = { 1: ["whole", "wholes"], 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 6: ["sixth", "sixths"], 8: ["eighth", "eighths"] };
  const words = (n, d) => `${n} ${NAME[d] ? NAME[d][n === 1 ? 0 : 1] : `out of ${d}`}`;
  const equalParts = (d) => Array(d).fill(24 / d);
  const W = 480, X0 = 20; // a strip 480 wide; a circle of radius 130

  /** The paper: parts of `sizes` (24ths of the whole), `on` shaded; taps on parts when `tap`; `guide`: d equal parts dashed over it. */
  function paper(shape, sizes, on, { tap = false, pulse = [], guide = 0, fresh = false, y = 20, label = "" } = {}) {
    const kids = [], at = (k) => sizes.slice(0, k).reduce((a, b) => a + b, 0) / 24;
    sizes.forEach((s, i) => {
      const cls = `part${on.includes(i) ? " on" : ""}${pulse.includes(i) ? " pulse" : ""}`, a = at(i), b = at(i + 1), extra = tap ? { "data-i": i } : {};
      if (shape === "circle") {
        const p = (t) => [150 + 130 * Math.sin(2 * Math.PI * t), 150 - 130 * Math.cos(2 * Math.PI * t)];
        kids.push(sizes.length === 1 ? svg("circle", { class: cls, cx: 150, cy: 150, r: 130, ...extra })
          : svg("path", { class: cls, d: `M150 150L${p(a).join(" ")}A130 130 0 ${b - a > 0.5 ? 1 : 0} 1 ${p(b).join(" ")}Z`, ...extra }));
      } else kids.push(svg("rect", { class: cls, x: X0 + a * W, y, width: (b - a) * W, height: 110, ...extra }));
    });
    if (fresh && sizes.length > 1) kids.push(...sizes.slice(1).map((_, k) => (shape === "circle"
      ? svg("line", { class: "part crease new", x1: 150, y1: 150, x2: 150 + 130 * Math.sin(2 * Math.PI * at(k + 1)), y2: 150 - 130 * Math.cos(2 * Math.PI * at(k + 1)) })
      : svg("line", { class: "part crease new", x1: X0 + at(k + 1) * W, y1: y, x2: X0 + at(k + 1) * W, y2: y + 110 }))));
    for (let k = 1; k < guide; k++) kids.push(shape === "circle"
      ? svg("line", { class: "guide", x1: 150, y1: 150, x2: 150 + 140 * Math.sin(2 * Math.PI * k / guide), y2: 150 - 140 * Math.cos(2 * Math.PI * k / guide) })
      : svg("line", { class: "guide", x1: X0 + (k / guide) * W, y1: y - 12, x2: X0 + (k / guide) * W, y2: y + 122 }));
    if (label) { const t = svg("text", { x: X0 + W + 6, y: y + 64 }); t.textContent = label; kids.push(t); }
    return kids;
  }
  const picture = (shape, more = "") => svg("svg", { class: `visual paper${shape === "circle" ? " round" : ""}${more}`, viewBox: shape === "circle" ? "0 0 300 300" : "14 0 492 150", "aria-hidden": "true" });
  const describe = (sizes, on) => sizes.map((s, i) => `Part ${i + 1} of ${sizes.length}${on.includes(i) ? ", shaded" : ""}`).join(". ");

  // ---------------------------------------------------------------- How much is shaded?
  function name(item, area, api) {
    const sizes = equalParts(item.parts), on = Array.from({ length: item.n }, (_, i) => i);
    let frac = null, pulse = [];
    const pic = picture(item.shape), show = h("p", { class: "fracshow", "aria-hidden": "true" });
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "How much is shaded?"), pic, h("p", { class: "dom papertext" }, `${describe(sizes, on)}.`)));
    const box = h("div", { class: "side" }, show), set = () => { frac = [top.value, bottom.value]; draw(); api.changed(); };
    const top = K.stepper(box, { label: "Shaded parts", min: 0, max: 8, onChange: set }), bottom = K.stepper(box, { label: "Equal parts", min: 1, max: 8, onChange: set });
    area.append(box);
    function draw() { pic.replaceChildren(...paper(item.shape, sizes, on, { pulse })); show.textContent = frac ? `${frac[0]}/${frac[1]}` : "?"; api.refresh(); }
    async function countParts(which, ms) { for (const i of which) { pulse = [i]; draw(); api.say(String(which.indexOf(i) + 1)); await wait(ms); } pulse = []; draw(); }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("How much is shaded? Count the shaded parts and all the equal parts.", "📄"); },
      ready: () => frac !== null,
      response: () => ({ frac: frac.slice() }),
      state: () => ({ frac }),
      restore(s) { frac = s.frac ? s.frac.slice() : null; top.set(frac ? frac[0] : 0); bottom.set(frac ? frac[1] : 1); pulse = []; draw(); },
      async model() {
        api.say("Watch me. I count all the equal parts: that is the bottom number."); await wait(3000);
        await countParts(sizes.map((_, i) => i), 700);
        api.say("Then I count the shaded parts: that is the top number. Now you."); await wait(3000);
      },
      async help(level, fb) {
        api.say(fb.feedback || "Count the parts again."); await wait(2800);
        if (level >= 2) { await countParts(sizes.map((_, i) => i), 600); api.say(`${item.parts} equal parts in all.`); await wait(2000); }
        api.prompt("Try again. How much is shaded?", "📄");
      },
      async worked(sol) { await countParts(on, 700); frac = sol.frac.slice(); top.set(frac[0]); bottom.set(frac[1]); draw(); api.say(`${words(item.n, item.parts)} is shaded: ${item.n} out of ${item.parts} equal parts.`); await wait(3000); },
      async success() { api.say(`${words(item.n, item.parts)}.`); await wait(1800); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Fold and shade it
  function build(item, area, api) {
    let folds = [], on = [], fresh = false;
    const parts = () => folds.reduce((a, b) => a * b, 1);
    const pic = picture(item.shape);
    pic.addEventListener("click", (e) => { const t = e.target.closest("[data-i]"); if (t) shade(Number(t.dataset.i)); });
    const list = h("ul", { class: "dom partlist", "aria-label": "The parts" });
    const half = h("button", { type: "button", "data-act": "half", onclick: () => fold(2) }, "Fold in half");
    const three = h("button", { type: "button", "data-act": "three", onclick: () => fold(3) }, "Fold in three");
    const unfold = h("button", { type: "button", class: "secondary", "data-act": "unfold", onclick: unfoldOne }, "Unfold");
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, `Show ${item.n}/${item.parts}`), pic, list),
      h("div", { class: "side" }, h("div", { class: "picker", role: "group", "aria-label": "Fold the paper" }, half, three, unfold)));
    function draw() {
      const d = parts(), sizes = equalParts(d);
      pic.replaceChildren(...paper(item.shape, sizes, on, { tap: true, fresh }));
      list.replaceChildren(...sizes.map((_, i) => h("li", {}, h("button", { type: "button", "data-i": i, "aria-pressed": String(on.includes(i)), onclick: () => shade(i) },
        `Part ${i + 1} of ${d}${on.includes(i) ? ": shaded" : ""}`))));
      half.disabled = d * 2 > 8; three.disabled = d * 3 > 8; unfold.disabled = !folds.length;
      api.refresh();
    }
    function fold(k) { if (parts() * k > 8) return; folds.push(k); on = []; fresh = true; api.say(`${parts()} equal parts.`); draw(); fresh = false; api.changed(); }
    function unfoldOne() { if (!folds.length) return; folds.pop(); on = []; api.say(parts() === 1 ? "Unfolded: one whole." : `${parts()} equal parts.`); draw(); api.changed(); }
    function shade(i) { on = on.includes(i) ? on.filter((x) => x !== i) : [...on, i]; api.say(`${on.length} shaded`); draw(); api.changed(); }
    const steps = (d) => ({ 1: [], 2: [2], 3: [3], 4: [2, 2], 6: [2, 3], 8: [2, 2, 2] })[d];
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`Fold the paper and shade ${item.n}/${item.parts}: ${words(item.n, item.parts)}.`, "📄"); },
      ready: () => folds.length > 0,
      response: () => ({ fold: parts(), shaded: on.slice().sort((a, b) => a - b) }),
      state: () => ({ folds: folds.slice(), on: on.slice() }),
      restore(s) { folds = (s.folds || []).slice(); on = (s.on || []).slice(); draw(); },
      async model() { // fourths: in half, then in half again; shade one
        api.say("Watch me make fourths. I fold in half..."); await wait(2400);
        folds = [2]; fresh = true; draw(); fresh = false; await wait(1600);
        api.say("...and in half again. 4 equal parts."); folds = [2, 2]; fresh = true; draw(); fresh = false; await wait(2600);
        on = [0]; draw(); api.say("I shade 1 part: one fourth. Now you."); await wait(2800);
      },
      async help(level, fb) {
        api.say(fb.feedback || "Look at the fraction again."); await wait(2800);
        if (level >= 2 || fb.misconception === "swapped" || fb.misconception === "wrong_fold") {
          folds = []; on = []; draw(); await wait(600);
          if (level >= 2) { for (const k of steps(item.parts)) { folds.push(k); fresh = true; draw(); fresh = false; await wait(1200); } api.say(`${item.parts} equal parts. Now shade ${item.n}.`); await wait(2400); }
        }
        api.prompt(`Try again. Show ${words(item.n, item.parts)}.`, "📄");
      },
      async worked(sol) {
        folds = []; on = []; draw();
        for (const k of steps(sol.fold)) { folds.push(k); fresh = true; draw(); fresh = false; await wait(1100); }
        for (const i of sol.shaded) { on.push(i); draw(); await wait(600); }
        api.say(`${item.parts} equal parts, ${item.n} shaded: ${words(item.n, item.parts)}.`); await wait(2600);
      },
      async success() { api.say(`${words(item.n, item.parts)}.`); await wait(1800); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Are these equal parts?
  function equal(item, area, api) {
    const d = item.sizes.length, on = [item.n];
    let said = null, guide = 0;
    const pic = picture(item.shape);
    const ask = `Is the shaded part one ${NAME[d][0]}?`;
    const yes = h("button", { type: "button", "data-say": "yes", onclick: () => pick(true) }, `Yes, one ${NAME[d][0]}`);
    const no = h("button", { type: "button", "data-say": "no", onclick: () => pick(false) }, "No, the parts are not equal");
    const sizeText = item.sizes.map((s, i) => `Part ${i + 1}: ${s} of 24 pieces`).join(". ");
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, ask), pic, h("p", { class: "dom papertext" }, `${d} parts. ${sizeText}. Part ${item.n + 1} is shaded.`)),
      h("div", { class: "side picks", role: "group", "aria-label": ask }, yes, no));
    function draw() {
      pic.replaceChildren(...paper(item.shape, item.sizes, on, { guide }));
      yes.setAttribute("aria-pressed", String(said === true)); no.setAttribute("aria-pressed", String(said === false));
      api.refresh();
    }
    function pick(v) { said = v; api.say(v ? "Yes" : "No"); draw(); api.changed(); }
    const same = item.sizes.every((s) => s === item.sizes[0]);
    const ctl = {
      begin(retry) { if (!retry) api.prompt(ask, "📄"); },
      ready: () => said !== null,
      response: () => ({ same: [said] }),
      state: () => ({ said }),
      restore(s) { said = s.said ?? null; guide = 0; draw(); },
      async model() {
        api.say(`Watch me check. ${NAME[d][1][0].toUpperCase()}${NAME[d][1].slice(1)} are ${d} parts that are all the same size.`); await wait(3400);
        guide = d; draw(); api.say("I lay equal parts over it. Do the lines match?"); await wait(3000);
        guide = 0; draw(); api.say("Now you."); await wait(1200);
      },
      async help(level, fb) {
        api.say(fb.feedback || "Look at the size of each part."); await wait(2800);
        guide = d; draw();
        api.say(same ? `Every part matches the equal lines: these are ${NAME[d][1]}.` : `These ${d} parts are not the same size, so they are not ${NAME[d][1]} yet.`); await wait(3400);
        if (level < 2) { guide = 0; draw(); }
        api.prompt(`Try again. ${ask}`, "📄");
      },
      async worked(sol) { guide = d; said = sol.same[0]; draw(); api.say(same ? `All ${d} parts are the same size: one ${NAME[d][0]}.` : `The parts are not the same size, so it is not one ${NAME[d][0]}.`); await wait(3200); },
      async success() { api.say(same ? `Yes: ${d} equal parts, so one ${NAME[d][0]}.` : `Right: ${d} parts, but not equal parts.`); await wait(2200); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Which piece is bigger?
  function compare(item, area, api) {
    const ds = [item.a, item.b];
    let picked = null, pulse = -1;
    const pic = svg("svg", { class: "visual paper", viewBox: "0 0 580 290", "aria-hidden": "true" });
    const btns = ds.map((d) => h("button", { type: "button", class: "secondary", "data-pick": d, "aria-label": `one ${NAME[d][0]}`, onclick: () => choose(d) }, `1/${d}`));
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Which piece is bigger?"), pic,
      h("p", { class: "dom papertext" }, ds.map((d) => `A strip in ${d} equal parts, one shaded: one ${NAME[d][0]}`).join(". "))),
      h("div", { class: "side picks", role: "group", "aria-label": "Which piece is bigger?" }, ...btns));
    function draw() {
      pic.replaceChildren(...ds.flatMap((d, k) => paper("strip", equalParts(d), [0], { y: 20 + k * 140, label: `1/${d}`, pulse: pulse === k ? [0] : [] })));
      btns.forEach((b, k) => b.setAttribute("aria-pressed", String(picked === ds[k])));
      api.refresh();
    }
    function choose(d) { picked = d; api.say(`one ${NAME[d][0]}`); draw(); api.changed(); }
    const big = ds.indexOf(Math.min(...ds));
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`Which piece is bigger: one ${NAME[item.a][0]} or one ${NAME[item.b][0]}?`, "📄"); },
      ready: () => picked !== null,
      response: () => ({ pick: picked }),
      state: () => ({ picked }),
      restore(s) { picked = s.picked ?? null; pulse = -1; draw(); },
      async model() { api.say("Watch me. I look at the pieces, not the numbers. The more parts, the smaller each piece."); await wait(3800); },
      async help(level, fb) {
        api.say(fb.feedback || "Look at the pieces."); await wait(2800);
        pulse = big; draw();
        api.say(`One ${NAME[ds[big]][0]} covers more of the strip. ${Math.max(...ds)} parts make smaller pieces.`); await wait(3400);
        pulse = -1; draw(); api.prompt("Try again. Which piece is bigger?", "📄");
      },
      async worked(sol) { pulse = big; picked = sol.pick; draw(); api.say(`One ${NAME[sol.pick][0]} is bigger: fewer parts, bigger pieces.`); await wait(3000); pulse = -1; draw(); },
      async success() { api.say(`Yes, one ${NAME[picked][0]} is the bigger piece.`); await wait(2000); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Fraction Fold",
    goal: "Fold paper into equal parts.",
    closure: "All done! You folded lots of fractions today.",
    stages: { fraction_name: { name: "Name the fraction" }, fraction_build: { name: "Fold and shade" }, fraction_equal: { name: "Equal parts?" }, fraction_compare: { name: "Which piece is bigger?" } },
    praise: () => "Yes! Equal parts.",
    mount: (item, area, api) => ({ fraction_name: name, fraction_build: build, fraction_equal: equal, fraction_compare: compare })[item.stage](item, area, api),
  });
})();
