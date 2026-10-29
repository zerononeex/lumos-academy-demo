// Hundred Chart Trek 1.0.0 (Grades 2–3) on kit 1.1.0 + the 1.2.0 layouts: the hundred chart (0–99, or a page of
// 100 up to 999) as a map. Clue treks ("start at 47, one row down, two left") moved with direction buttons, each row
// shown as 10 more; trails of skip counts, columns and diagonals to extend; a chart with covered numbers to work out.
// Moving past the end of a row is animated (29 → 30 is the start of the next row), and the scaffold sets "next number"
// beside "next row". The chart itself is a picture; every action is a button. The server decides every answer; this
// file only presents. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const C = 50, STEP = { r: 1, l: -1, d: 10, u: -10 };
  const MOVES = { u: ["⬆", "Up one row"], l: ["⬅", "Number before"], r: ["➡", "Next number"], d: ["⬇", "Down one row"] };
  const at = (base, v) => [((v - base) % 10) * C, Math.floor((v - base) / 10) * C]; // a cell's top-left corner
  const mid = (base, v) => at(base, v).map((c) => c + C / 2);
  const crosses = (v, m) => (m === "r" || m === "l") && Math.floor((v + STEP[m]) / 10) !== Math.floor(v / 10);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  /** A clue in words: rows in chart words ("1 row down") or number words ("10 more"); sideways as more or less. */
  const clueWords = ([d, n, w]) => (d === "u" || d === "d") && !w ? `${plural(n, "row", "rows")} ${d === "d" ? "down" : "up"}`
    : `${(d === "u" || d === "d") ? n * 10 : n} ${d === "d" || d === "r" ? "more" : "less"}`;

  function trek(item, area, api) {
    const base = item.base, stage = item.stage, big = base >= 100;
    let moves = [], marks = [], read = null, hint = [], wrapAt = null, here = item.from, extra = []; // extra: drawn on top for a moment
    const pic = svg("svg", { viewBox: "-64 -4 598 508", class: `visual chart${big ? " big" : ""}`, "aria-hidden": "true" });
    const said = h("p", { class: "dom charttext", "aria-live": "polite" });
    const card = h("div", { class: "cluecard" });
    const side = h("div", { class: "side" }, card);
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "The hundred chart"), pic, said), side);
    const path = () => moves.reduce((p, m) => [...p, p[p.length - 1] + STEP[m]], [item.from]);
    const covered = new Set(stage === "chart_missing" ? item.covered : []);
    const shown = stage === "chart_pattern" ? Array.from({ length: item.shown }, (_, i) => item.from + i * item.step) : [];

    // Number pickers (trails and covered numbers): tens and ones on this page of the chart.
    let pick = null;
    if (stage !== "chart_clues") {
      const box = h("div", { class: "picker" });
      const start = stage === "chart_pattern" ? item.from - base : 0; // the page's hundreds stay; tens and ones move
      const st = [["Tens", Math.floor(start / 10)], ["Ones", start % 10]].map(([label, value]) => K.stepper(box, { label, min: 0, max: 9, value, onChange: draw }));
      pick = () => base + st[0].value * 10 + st[1].value;
      side.append(box);
      if (stage === "chart_pattern") side.append(h("button", { type: "button", "data-act": "mark", onclick: mark }, "🚩 Mark it"));
      else side.append(h("button", { type: "button", "data-act": "say", onclick: answer }, "✋ That's the number"));
    } else {
      side.append(h("div", { class: "moves", role: "group", "aria-label": "Move" }, ...["u", "l", "r", "d"].map((m) =>
        h("button", { type: "button", "data-move": m, "aria-label": MOVES[m][1], onclick: () => step(m) }, `${MOVES[m][0]} ${MOVES[m][1]}`))));
    }

    function step(m) {
      const v = here + STEP[m];
      if (v < base || v > base + 99) return api.say("That's off the chart.");
      if (moves.length >= 40) return api.say("That's a long trek. Check, or undo some steps.");
      wrapAt = crosses(here, m) ? here : null;
      moves.push(m); here = v; hint = [];
      api.say(wrapAt !== null ? `${v}. The next number is at the start of the next row.` : String(v)); draw(); api.changed();
    }
    function mark() {
      const v = pick();
      if (shown.includes(v)) return api.say(`${v} is already in the trail.`);
      marks = marks.includes(v) ? marks.filter((x) => x !== v) : [...marks, v].slice(-12);
      api.say(marks.includes(v) ? `${v} marked.` : `${v} unmarked.`); draw(); api.changed();
    }
    function answer() { read = pick(); api.say(`${read}.`); draw(); api.changed(); }

    /** The wrap past a row's end, drawn out of the right edge and into the start of the next row (or back). */
    function wrapPath(v, m, cls) {
      const [x1, y1] = mid(base, v), [x2, y2] = mid(base, v + STEP[m]), out = m === "r" ? 500 + 0 : 0;
      return svg("path", { class: cls, d: `M${x1} ${y1} L${out} ${y1} C${m === "r" ? 524 : -24} ${y1} ${m === "r" ? 524 : -24} ${y2} ${500 - out} ${y2} L${x2} ${y2}` });
    }
    function draw() {
      const kids = [];
      const target = stage === "chart_missing" ? item.from : null, cur = pick && stage === "chart_pattern" ? pick() : null;
      for (let v = base; v <= base + 99; v++) {
        const [x, y] = at(base, v), cls = ["cell"];
        if (shown.includes(v)) cls.push("trail"); if (marks.includes(v)) cls.push("mark"); if (hint.includes(v)) cls.push("pulse");
        if (v === target) cls.push("ask"); else if (covered.has(v)) cls.push("covered");
        if (v === cur) cls.push("cursor");
        const g = svg("g", { class: cls.join(" ") }), t = svg("text", { x: x + C / 2, y: y + C / 2 + 7, "text-anchor": "middle" });
        t.textContent = v === target ? (read === null ? "?" : read) : covered.has(v) ? "" : v;
        g.append(svg("rect", { x, y, width: C, height: C }), t);
        kids.push(g);
      }
      if (stage === "chart_clues") {
        const p = path();
        kids.push(...p.slice(1).map((v, i) => (crosses(p[i], moves[i]) ? wrapPath(p[i], moves[i], `trailline wrap${wrapAt === p[i] && i === p.length - 2 ? " anim" : ""}`)
          : (() => { const [x1, y1] = mid(base, p[i]), [x2, y2] = mid(base, v); return svg("line", { class: "trailline", x1, y1, x2, y2 }); })())));
        const [mx, my] = mid(base, here);
        kids.push(svg("circle", { class: "you", cx: mx, cy: my, r: 15 }));
      }
      if (stage === "chart_pattern") kids.push(...[...shown, ...[...marks].sort((a, b) => a - b)].slice(1).map((v, i, a) => {
        const prev = i ? a[i - 1] : shown[0], [x1, y1] = mid(base, prev), [x2, y2] = mid(base, v);
        return svg("line", { class: "trailline", x1, y1, x2, y2 });
      }));
      // Each row down is 10 more: said down the left edge.
      for (let r = 1; r < 10; r++) { const t = svg("text", { class: "ten", x: -32, y: r * C + 7, "text-anchor": "middle" }); t.textContent = "+10"; kids.push(t); }
      pic.replaceChildren(...kids, ...extra);
      card.replaceChildren(...(stage === "chart_clues"
        ? [h("p", { class: "clue" }, `Start at ${item.from}.`), h("ol", {}, ...item.clue.map((c) => h("li", {}, clueWords(c))))]
        : stage === "chart_pattern" ? [h("p", { class: "clue" }, `The trail: ${shown.join(", ")}, …`), h("p", {}, `Mark the next ${item.extend}.`), h("p", { class: "pick" }, `Number: ${pick()}`)]
        : [h("p", { class: "clue" }, "Which number is under the ?"), h("p", { class: "pick" }, `Number: ${pick()}`)]));
      said.textContent = stage === "chart_clues" ? `You are on ${here}. ${moves.length ? `Steps: ${moves.map((m) => MOVES[m][1].toLowerCase()).join(", ")}.` : "No steps yet."}`
        : stage === "chart_pattern" ? `Marked by you: ${marks.length ? [...marks].sort((a, b) => a - b).join(", ") : "none yet"}.`
        : `The ? is between ${neighbours(item.from)}. ${read === null ? "" : `You said ${read}.`}`;
      api.refresh();
    }
    function neighbours(v) { // the cells beside, above and below, as the buttons twin reads them
      const name = (n, where) => `${where}: ${covered.has(n) ? "covered" : n}`;
      return [v % 10 && name(v - 1, "left"), (v + 1) % 10 && name(v + 1, "right"), v - 10 >= base && name(v - 10, "above"),
        v + 10 <= base + 99 && name(v + 10, "below")].filter(Boolean).join("; ");
    }

    const ctl = {
      begin(retry) {
        if (retry) return;
        api.prompt(stage === "chart_clues" ? `Start at ${item.from}. Follow the clues.` : stage === "chart_pattern" ? "Keep the trail going." : "Which number is covered?", "🗺️");
      },
      ready: () => (stage === "chart_clues" ? moves.length > 0 : stage === "chart_pattern" ? marks.length > 0 : read !== null),
      response: () => (stage === "chart_clues" ? { moves: moves.slice() } : stage === "chart_pattern" ? { taps: marks.slice() } : { read }),
      state: () => ({ moves: moves.slice(), marks: marks.slice(), read }),
      restore(s) { moves = (s.moves || []).slice(); marks = (s.marks || []).slice(); read = s.read ?? null; here = path()[moves.length]; wrapAt = null; hint = []; extra = []; draw(); },
      async model() { // the same kind of task somewhere else on the chart
        if (stage === "chart_clues") {
          api.say(`Watch me. From ${base + 19}: one row down is 10 more.`); here = base + 19; moves = []; draw(); await wait(2600);
          here = base + 29; extra = [svg("line", { class: "trailline", x1: mid(base, base + 19)[0], y1: mid(base, base + 19)[1], x2: mid(base, base + 29)[0], y2: mid(base, base + 29)[1] })]; draw();
          api.say(`${base + 29}.`); await wait(1800);
          extra.push(wrapPath(base + 29, "r", "trailline wrap anim")); here = base + 30; draw();
          api.say(`The next number, ${base + 30}, is at the start of the next row.`); await wait(3200);
          api.say("Now it's your turn."); await wait(1500);
          extra = []; here = item.from;
        } else if (stage === "chart_pattern") {
          api.say(`Watch me. Every jump in a trail is the same: ${item.step} more each time.`); await wait(2800);
          for (const [i, v] of shown.slice(1).entries()) { hint = [shown[i], v]; draw(); api.say(`${shown[i]}, ${item.step} more, ${v}.`); await wait(2200); }
          api.say("Now you keep it going."); await wait(1500);
        } else {
          const v = item.from;
          api.say("Watch me use the numbers around it. Left is one less, right is one more, above is 10 less, below is 10 more."); await wait(4200);
          hint = [v - 1, v + 1, v - 10, v + 10].filter((n) => n >= base && n <= base + 99 && !covered.has(n)); draw(); await wait(2500);
          api.say("Now you work it out."); await wait(1500);
        }
        hint = []; draw();
      },
      async help(level, fb) {
        if (stage === "chart_clues") {
          // Walk the trek back from the start, step by step, then set "next number" beside "next row" at a row's end.
          const p = path(), old = moves; moves = []; here = item.from; draw(); await wait(500);
          for (const m of old) { wrapAt = crosses(here, m) ? here : null; moves.push(m); here += STEP[m]; draw(); await wait(500); }
          api.say(fb.feedback || "Let's look at the chart again."); await wait(2600);
          const end = [9, 19, 29, 39, 49, 59, 69, 79, 89].map((k) => base + k).find((v) => p.includes(v)) ?? base + 29;
          if (fb.misconception === "wrap" || fb.misconception === "off_by_ten") {
            const [x, y] = mid(base, end), [, y2] = mid(base, end + 10);
            extra = [wrapPath(end, "r", "trailline wrap anim"), svg("line", { class: "trailline down", x1: x, y1: y, x2: x, y2 })];
            const t1 = svg("text", { class: "tag", x: x - 80, y: y + 40, "text-anchor": "middle" }), t2 = svg("text", { class: "tag down", x, y: y2 + 40, "text-anchor": "middle" });
            t1.textContent = `next number: ${end + 1}`; t2.textContent = `next row: ${end + 10}`;
            extra.push(t1, t2); draw();
            api.say(`From ${end}, the next number is ${end + 1}, at the start of the next row. The next row down is ${end + 10}.`); await wait(4200);
            extra = [];
          }
          moves = []; here = item.from; wrapAt = null;
          if (level >= 2) { // partial model: the first clue done for you
            const [d, n] = item.clue[0];
            for (let k = 0; k < n; k++) { moves.push(d); here += STEP[d]; }
            api.say(`That's the first clue: ${clueWords(item.clue[0])}. You are on ${here}.`); await wait(2600);
          }
        } else if (stage === "chart_pattern") {
          hint = shown; draw();
          api.say(fb.feedback || "Look at the trail."); await wait(2600);
          if (level >= 2) { const v = shown[shown.length - 1] + item.step; marks = [v]; hint = [v]; draw(); api.say(`${shown[shown.length - 1]}, ${item.step} more, is ${v}. I marked it.`); await wait(2800); }
          else marks = [];
        } else {
          hint = [item.from - 1, item.from + 1, item.from - 10, item.from + 10].filter((n) => n >= base && n <= base + 99 && !covered.has(n)); draw();
          api.say(fb.feedback || "Look at the numbers around it."); await wait(2600);
          if (level >= 2) { const n = hint[0]; api.say(`${n} is ${n < item.from ? (item.from - n === 1 ? "just before it" : "in the row above") : item.from - n === -1 ? "just after it" : "in the row below"}.`); await wait(2800); }
          read = null;
        }
        hint = []; draw();
        api.prompt("Try again.", "🗺️");
      },
      async worked(sol) {
        if (stage === "chart_clues") { moves = []; here = item.from; draw(); for (const m of sol.moves) { step(m); await wait(700); } }
        else if (stage === "chart_pattern") { marks = []; for (const v of sol.taps) { marks.push(v); hint = [v]; draw(); api.say(String(v)); await wait(1200); } }
        else { read = sol.read; draw(); api.say(`It is ${sol.read}.`); }
        await wait(2000);
      },
      async success(fb) {
        api.say(stage === "chart_clues" ? `You found ${here}!${fb.strategy === "direct" ? " The shortest way, too." : ""}`
          : stage === "chart_pattern" ? `The trail goes on: ${item.step} more each time.` : `Yes, ${read}!`);
        await wait(2200);
      },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Hundred Chart Trek", icon: "🗺️",
    closure: "All done! You found your way around the chart today.",
    stages: {
      chart_clues: { name: "Clue trek", icon: "🧭" }, chart_pattern: { name: "Trails", icon: "🐾" }, chart_missing: { name: "Covered numbers", icon: "❓" },
    },
    praise: () => "Yes! You found it.",
    mount: trek,
  });
})();
