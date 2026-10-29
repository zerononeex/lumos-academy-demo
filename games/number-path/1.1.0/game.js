// Number Path 1.1.0: the 1.0.0 game on kit 1.2.0 (tablet, browser window and phone layouts; see docs/GAME_KIT.md §9).
// Number Path (K–1, with the Grades 2–3 estimation variant): the number line IS the board. Moves (tap each
// square and hear its number), "who is closer?", the optional two-piece co-operative mode (no racing, no winner), and
// estimation on an unmarked 0–100 line. Items come from the server; the server decides every answer. Original art.
(() => {
  "use strict";
  const K = window.LumosKit, { h, wait } = K;
  const dir = (by) => (by > 0 ? "forward" : "back");
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
    const card = h("p", { class: "count", "aria-hidden": "true" }, `${"●".repeat(m)} ${d > 0 ? "➡" : "⬅"}`);
    area.prepend(card);
    function draw() { path.piece(me, taps.length ? taps[taps.length - 1] : item.from); path.marks(taps); }
    function tap(n) {
      if (taps.length >= m) return;
      taps.push(n);
      draw();
      api.say(taps.length === m ? `${n}. You landed on ${n}.` : String(n)); // say-while-moving
      api.changed();
    }
    const who = item.piece ? `${me === 1 ? "Blue" : "Green"} piece. ` : "";
    return {
      begin(retry) { if (!retry) api.prompt(`${who}Move ${m} ${dir(item.by)}. Tap each square as you go.`, d > 0 ? "➡️" : "⬅️"); },
      ready: () => taps.length === m,
      response: () => ({ taps }),
      state: () => ({ taps }),
      restore(s) { taps = (s.taps || []).slice(0, m); path.arcs([]); draw(); },
      async model() {
        // Same task type, same path, a neighbouring move (not this item's answer).
        const mm = m > 1 ? m - 1 : m + 1, end = item.from + d * mm;
        const by = end < 0 || end > item.max ? -d * mm : d * mm, steps = Array.from({ length: mm }, (_, i) => item.from + Math.sign(by) * (i + 1));
        api.say(`Watch me move ${mm} ${dir(by)}. I start on ${item.from}. The start is not a jump.`); await wait(3500);
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
        api.prompt(`Try again: move ${m} ${dir(item.by)} from ${item.from}.`, d > 0 ? "➡️" : "⬅️");
      },
      async worked(sol) {
        taps = []; draw();
        for (const n of sol.taps) { taps.push(n); draw(); path.arcs(jumpsFrom(item.from, taps), "model"); api.say(String(n)); await wait(1000); }
        api.say(`${item.from}, move ${m} ${dir(item.by)}: ${sol.taps[sol.taps.length - 1]}.`); await wait(2500);
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
      begin(retry) { if (!retry) api.prompt(`Which piece is closer to ${item.to}: on ${item.a}, or on ${item.b}? Tap it.`, "🎯"); },
      ready: () => pick !== null,
      response: () => ({ pick }),
      state: () => ({ pick }),
      restore(s) { pick = s.pick ?? null; path.unhl(); path.hl([item.to], "star"); if (pick !== null) path.hl([pick], "hl1"); },
      async model() {
        api.say(`Watch me. To find who is closer to ${item.to}, I count the jumps from each piece.`); await wait(3500);
        path.arcs(jumps(item.a), "model"); api.say(`From ${item.a}: ${Math.abs(item.a - item.to)} jumps.`); await wait(2500);
        path.arcs(jumps(item.b), "model"); api.say(`From ${item.b}: ${Math.abs(item.b - item.to)} jumps.`); await wait(2500);
        api.say("Fewer jumps means closer. Now it's your turn."); await wait(2500);
        path.arcs([]);
      },
      async help(level, fb) {
        path.unhl(); path.hl([item.to], "star");
        path.hl(span(item.a), "hl1"); path.hl(span(item.b), "hl2"); // structural highlight: the stretch from each piece to the target
        if (level >= 2) { path.arcs(jumps(item.a), "model"); api.say(`From ${item.a} to ${item.to} is ${Math.abs(item.a - item.to)} jumps. How many from ${item.b}?`); }
        else api.say(fb.feedback || "Look at the stretch from each piece.");
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
    title: "Number Path", icon: "🛤️",
    closure: "All done! You did great thinking on the number path today.",
    stages: {
      path_move: { name: "Moves on the path", icon: "🛤️" }, path_compare: { name: "Who is closer?", icon: "🎯" },
      pairs: { name: "Two pieces, one path", icon: "🤝" }, estimate: { name: "Where does it go?", icon: "📍" },
    },
    praise: (item) => item.stage === "estimate" ? "Yes!" : item.stage === "path_compare" ? "Yes! That one is closer." : `Yes! ${item.from + item.by}.`,
    mount: (item, area, api) => (item.stage === "path_compare" ? compare : item.stage === "estimate" ? estimate : move)(item, area, api),
  });
})();
