// Number Path 1.4.0: the 1.3.0 game on kit 1.5.0 (its world: scene behind the board, painted tile); same items, responses and checker.
// Number Path 1.3.0: the 1.2.0 game on the kit 1.4.0 stylesheet (the Lumos look, DESIGN.md v2); same items, responses and checker.
// Number Path 1.2.0: the 1.1.0 game on kit 1.3.0, presented as what it is: a train on a railway of numbered stations
// (docs/GAME_FEEL_REVIEW.md, Number Path). The child drives the train one station per tap and hears each number
// (say-while-moving); a ticket of stops punches as they go; the start station is shown. "Which train is closer to the
// star?"; the optional two-train co-operative mode (no racing, no winner); estimation on an unmarked 0–100 line (Grades
// 2–3). Same items, same responses, same checker as 1.1.0: items come from the server, which decides every answer.
(() => {
  "use strict";
  const K = window.LumosKit, { h, wait } = K;
  const dir = (by) => (by > 0 ? "forward" : "back");
  const stops = (m) => `${m} stop${m === 1 ? "" : "s"}`;
  const jumpsFrom = (from, taps) => taps.map((t, i) => [i ? taps[i - 1] : from, t]);

  /** Where the other piece stands in the two-piece mode: at the start of its next move, or where it last landed. */
  function otherPiece(api, item) {
    const all = api.items(), i = api.index(), k = item.piece === 1 ? 2 : 1;
    const next = all.slice(i + 1).find((x) => x.piece === k);
    const last = all.slice(0, i).reverse().find((x) => x.piece === k);
    return next ? next.from : last ? last.from + last.by : 0;
  }

  function move(item, area, api) {
    const m = Math.abs(item.by), d = Math.sign(item.by), me = item.piece || 1;
    let taps = [];
    const path = K.numberPath(area, { max: item.max, label: "The number path", onTap: tap });
    if (item.piece) path.piece(me === 1 ? 2 : 1, otherPiece(api, item));
    path.hl([item.from], "start");
    // The ticket: one hole per stop to drive, punched as each station is tapped, and the way to go (picture only: the
    // prompt and the buttons twin say the same in words).
    const holes = Array.from({ length: m }, () => h("span", { class: "hole" }));
    const arrow = K.icon("next");
    if (d < 0) arrow.classList.add("back");
    area.prepend(h("p", { class: `ticket piece${me}`, "aria-hidden": "true" }, ...holes, arrow));
    function draw() {
      path.piece(me, taps.length ? taps[taps.length - 1] : item.from); path.marks(taps);
      holes.forEach((e, i) => e.classList.toggle("punched", i < taps.length));
    }
    draw(); // the train waits at the start from the first moment, demonstrator included
    function tap(n) {
      if (taps.length >= m) return;
      taps.push(n);
      draw();
      api.say(taps.length === m ? `${n}. You landed on ${n}.` : String(n)); // say-while-moving
      api.changed();
    }
    const who = item.piece ? `${me === 1 ? "Blue" : "Green"} train. ` : "";
    return {
      begin(retry) { if (!retry) api.prompt(`${who}Drive ${stops(m)} ${dir(item.by)}. Tap each stop.`, ""); },
      ready: () => taps.length === m,
      response: () => ({ taps }),
      state: () => ({ taps }),
      restore(s) { taps = (s.taps || []).slice(0, m); path.arcs([]); draw(); },
      async model() {
        // Same task type, same path, a neighbouring move (not this item's answer).
        const mm = m > 1 ? m - 1 : m + 1, end = item.from + d * mm;
        const by = end < 0 || end > item.max ? -d * mm : d * mm, steps = Array.from({ length: mm }, (_, i) => item.from + Math.sign(by) * (i + 1));
        api.say(`Watch me drive ${stops(mm)} ${dir(by)}. I start on ${item.from}. The start is not a stop.`); await wait(3500);
        for (const [i, n] of steps.entries()) { path.piece(me, n); path.arcs(jumpsFrom(item.from, steps.slice(0, i + 1)), "model"); api.say(String(n)); await wait(1000); }
        api.say(`I landed on ${steps[steps.length - 1]}. Now it's your turn.`); await wait(2500);
        path.arcs([]);
      },
      async help(level, fb) {
        path.arcs([]); path.unhl();
        const want = Array.from({ length: m }, (_, i) => item.from + d * (i + 1));
        if (level >= 2) { // partial model: the first jump is done for you
          taps = [want[0]]; draw(); path.arcs([[item.from, want[0]]], "model");
          api.say(fb.feedback || `The first jump is done: ${item.from} to ${want[0]}. Keep going.`);
          return;
        }
        if (fb.misconception === "skipped_square") { // the piece settles between squares, with the count spoken
          const k = taps.findIndex((t, i) => Math.abs(t - (i ? taps[i - 1] : item.from)) > 1);
          const before = k ? taps[k - 1] : item.from;
          path.piece(me, d > 0 ? before : before - 1, true);
          api.say(`${before}, then ${taps[k]}. ${before + d} was skipped.`); await wait(3500);
        } else { // counted the start square, or anything else: the jumps (arcs) against the squares you tapped (marks)
          path.marks(taps); path.arcs(jumpsFrom(item.from, want), "model");
          api.say(fb.feedback || "Watch the jumps."); await wait(3500);
          for (const n of want) { path.piece(me, n); api.say(String(n)); await wait(900); }
          await wait(800);
        }
        taps = []; path.arcs([]); draw(); // revise the same move
        api.prompt(`Try again: drive ${stops(m)} ${dir(item.by)} from ${item.from}.`, "");
      },
      async worked(sol) {
        taps = []; draw();
        for (const n of sol.taps) { taps.push(n); draw(); path.arcs(jumpsFrom(item.from, taps), "model"); api.say(String(n)); await wait(1000); }
        api.say(`${item.from}, ${stops(m)} ${dir(item.by)}: ${sol.taps[sol.taps.length - 1]}.`); await wait(2500);
      },
      async success() { path.arcs(jumpsFrom(item.from, taps)); await wait(600); },
    };
  }

  function compare(item, area, api) {
    let pick = null;
    const path = K.numberPath(area, { max: item.max, label: "The number path", onTap: (n) => {
      if (n !== item.a && n !== item.b) return;
      pick = n; path.unhl(); path.hl([item.to], "star"); path.hl([n], "hl1"); api.say(String(n)); api.changed();
    } });
    path.piece(1, item.a); path.piece(2, item.b); path.hl([item.to], "star");
    const span = (p) => Array.from({ length: Math.abs(p - item.to) + 1 }, (_, i) => Math.min(p, item.to) + i);
    const jumps = (p) => Array.from({ length: Math.abs(p - item.to) }, (_, i) => p < item.to ? [p + i, p + i + 1] : [p - i, p - i - 1]);
    return {
      begin(retry) { if (!retry) api.prompt(`Which train is closer to the star, ${item.to}? Tap it.`, ""); },
      ready: () => pick !== null,
      response: () => ({ pick }),
      state: () => ({ pick }),
      restore(s) { pick = s.pick ?? null; path.unhl(); path.hl([item.to], "star"); if (pick !== null) path.hl([pick], "hl1"); },
      async model() {
        api.say(`Watch me. To find which train is closer to ${item.to}, I count the jumps from each train.`); await wait(3500);
        path.arcs(jumps(item.a), "model"); api.say(`From ${item.a}: ${Math.abs(item.a - item.to)} jumps.`); await wait(2500);
        path.arcs(jumps(item.b), "model"); api.say(`From ${item.b}: ${Math.abs(item.b - item.to)} jumps.`); await wait(2500);
        api.say("Fewer jumps means closer. Now it's your turn."); await wait(2500);
        path.arcs([]);
      },
      async help(level, fb) {
        path.unhl(); path.hl([item.to], "star");
        path.hl(span(item.a), "hl1"); path.hl(span(item.b), "hl2"); // structural highlight: the stretch from each piece to the target
        if (level >= 2) { path.arcs(jumps(item.a), "model"); api.say(`From ${item.a} to ${item.to} is ${Math.abs(item.a - item.to)} jumps. How many from ${item.b}?`); }
        else api.say(fb.feedback || "Look at the stretch from each train.");
        pick = null;
      },
      async worked(sol) {
        path.arcs(jumps(item.a), "model"); api.say(`${item.a}: ${Math.abs(item.a - item.to)} jumps.`); await wait(2200);
        path.arcs(jumps(item.b), "model"); api.say(`${item.b}: ${Math.abs(item.b - item.to)} jumps.`); await wait(2200);
        path.unhl(); path.hl([item.to], "star"); path.hl([sol.pick], "hl1"); api.say(`${sol.pick} is closer to ${item.to}.`); await wait(2200);
      },
      async success() { await wait(400); },
    };
  }

  function estimate(item, area, api) {
    const line = K.numberLine(area, { max: item.max, label: `Where does ${item.n} go?`, onPlace: (v) => { line.place(v); api.changed(); } });
    const away = () => Math.abs(line.at - item.n);
    return {
      begin(retry) { if (!retry) api.prompt(`Where does ${item.n} go? Tap the line.`, "📍"); },
      ready: () => line.at !== null,
      response: () => ({ at: line.at }),
      state: () => ({ at: line.at }),
      restore(s) { line.place(s.at ?? null); },
      async model() {
        const n = item.n < 50 ? item.n + 20 : item.n - 20; // a different number on the same line
        api.say(`Watch me place ${n}. The middle of the line is 50.`); line.reveal(1); await wait(3500);
        api.say(`${n} is ${n < 50 ? "less" : "more"} than 50, so it goes ${n < 50 ? "before" : "after"} the middle.`); line.place(n); await wait(4000);
        api.say("Now it's your turn."); await wait(1500);
      },
      // After a check the benchmarks reveal and the distance is named. Nothing is docked.
      async help(level, fb) {
        line.reveal(level);
        api.say(`${away()} away. ${fb.feedback || ""}`.trim());
      },
      async worked(sol) { line.reveal(2); line.truth(sol.at); api.say(`${item.n} goes here.`); await wait(2500); },
      async success() { line.reveal(2); line.truth(item.n); api.say(`${away()} away. Close!`); await wait(2500); },
    };
  }

  K.run({
    title: "Number Path",
    goal: (item) => item.stage === "estimate" ? "Find where each number goes on the line." : "Drive the train. Count every stop.",
    closure: "All done! You did great thinking on the number path today.",
    stages: {
      path_move: { name: "Drive the train" }, path_compare: { name: "Which train is closer?" },
      pairs: { name: "Two trains, one track" }, estimate: { name: "Where does it go?" },
    },
    praise: (item) => item.stage === "estimate" ? "Yes!" : item.stage === "path_compare" ? "Yes! That train is closer." : `Yes! ${item.from + item.by}.`,
    mount: (item, area, api) => (item.stage === "path_compare" ? compare : item.stage === "estimate" ? estimate : move)(item, area, api),
  });
})();
