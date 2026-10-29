// Bridge Builder 1.2.0: the 1.1.0 game on kit 1.3.0 (the game-feel layer: instant press feedback, Watch badge, sounds, goal line,
// drawn chrome; see DESIGN.md and docs/GAME_FEEL_REVIEW.md). Same items, same responses, same checker as 1.1.0.
// Bridge Builder (Grades 1–3): a gap must be crossed, and the span the child composes IS the bridge. Facts to 20
// built through 10 on the ten-frame or on the bead rack (two representations of the same problem), story skins on the
// same mechanic, and two-jump bridges to 100. Go: the walker crosses, or stops at the visible gap, or lands past the
// far side with the extra span shown. Never a buzzer. The server decides every answer and names the strategy the
// planks show (making 10, doubles, compensating …); this file only presents. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, wait } = K;
  const sign = (p) => (p < 0 ? `− ${-p}` : `+ ${p}`);
  const sum = (ps) => ps.reduce((s, p) => s + p, 0);
  const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
  // The strategy the server names, in BC strategy language.
  const STRATEGY = {
    make_ten: "You made 10 first!", bridge_ten: "You bridged through a ten!", doubles: "You used a double!",
    compensating: "You went past and came back. That's compensating!", tens_then_ones: "Tens first, then ones!",
    counting_on: "You counted on, one at a time.", one_jump: "One big jump!", decomposing: "You broke the number into parts!",
  };
  // Story skins: short acted stories, objects and narration; the answer is built the same way. Neutral contexts only.
  const STORIES = [
    { thing: "🦆", name: "ducks", start: "on the pond", more: "swim over", away: "swim away" },
    { thing: "🍎", name: "apples", start: "in the basket", more: "are picked and put in", away: "are taken out" },
    { thing: "🐦", name: "birds", start: "on the wire", more: "fly in", away: "fly away" },
    { thing: "⛵", name: "boats", start: "at the dock", more: "sail in", away: "sail away" },
  ];
  /** The next ten from `from` in the bridge's direction (where "making 10" or "bridging" stops). */
  const nextTen = (from, d) => (d > 0 ? Math.ceil((from + 1) / 10) * 10 : Math.floor((from - 1) / 10) * 10);

  function bridge(item, area, api) {
    const big = item.max === 100, story = item.stage === "bridge_story" ? STORIES[item.story % STORIES.length] : null;
    const gr1 = item.skill.startsWith("g1-");
    let fact, parts = [], line, rep, tray, total, len, tens, ones;

    /** Draw the board for a fact (the item's own, or the demonstrator's neighbouring one). */
    function board(from, by) {
      fact = { from, by, to: from + by, d: Math.sign(by), b: Math.abs(by) };
      area.replaceChildren();
      const lo = big ? Math.max(0, Math.floor((Math.min(from, fact.to) - 4) / 10) * 10) : 0;
      const hi = big ? Math.min(100, Math.ceil((Math.max(from, fact.to) + 4) / 10) * 10) : 20;
      const card = story
        ? h("p", { class: "card" }, h("span", { "aria-hidden": "true" }, `${story.thing.repeat(Math.min(from, 20))}`), h("br"),
          `${from} ${story.name} ${story.start}. ${fact.b} ${fact.d > 0 ? story.more : story.away}.`)
        : h("p", { class: "card" }, `${from} ${sign(by)}`);
      if (big) area.append(card); // facts: the card sits with the counters, so the board fits a tablet screen
      line = K.jumpLine(area, { lo, hi, from, to: fact.to, labels: [...new Set([lo, hi, from, ...range(lo, hi + 1).filter((v) => v % 10 === 0)])],
        label: "The bridge", onTap: big ? null : (n) => n !== end() && lay(n - end()) });
      const row = h("div", { class: "row" });
      area.append(row);
      if (!big) {
        rep = item.stage === "bridge_rack" ? K.beadRack(row, { label: "Bead rack" }) : K.tenFrame(row, { frames: 2, readOnly: true, label: "Ten-frames" });
        const fig = h("figure", { class: "manip" }, card, h("figcaption", {}, `${fact.d > 0 ? "To add" : "To take away"}: ${fact.b}`));
        tray = h("p", { class: "tray", role: "img" });
        fig.append(tray);
        row.append(fig);
      }
      const ctl = h("div", { class: "planker" });
      row.append(ctl);
      // The plank's length: one stepper for facts; tens and ones for bridges to 100 (no long runs of single taps).
      if (big) { tens = K.stepper(ctl, { label: "Tens", min: 0, max: 4, value: 1 }); ones = K.stepper(ctl, { label: "Ones", min: 0, max: 9, value: 0 }); }
      else len = K.stepper(ctl, { label: "Plank", min: 1, max: 10, value: 1 });
      const length = () => (big ? tens.value * 10 + ones.value : len.value);
      ctl.append(h("button", { type: "button", onclick: () => length() && lay(fact.d * length()) }, `${fact.d > 0 ? "➡" : "⬅"} Lay plank`));
      if (!gr1) ctl.append(h("button", { type: "button", class: "secondary", onclick: () => length() && lay(-fact.d * length()) }, `${fact.d > 0 ? "⬅" : "➡"} Plank back`));
      total = h("p", { class: "count", "aria-live": "polite" });
      area.append(total);
      draw();
    }
    const end = () => fact.from + sum(parts);
    function lay(p) { parts.push(p); draw(); api.say(sign(p)); api.changed(); }

    /** Everything follows the planks: the bridge, the counters or beads moved across (or taken away), the tray. */
    function draw() {
      line.planks(parts);
      total.textContent = item.mode === "guided" && parts.length ? `Your bridge reaches ${end()}.` : ""; // guided only: Prove shows no totals
      if (big) return;
      const { from, d, b } = fact, net = Math.max(0, sum(parts) * d), used = Math.min(net, b), extra = net - used;
      rep.unmark();
      if (d > 0) {
        rep.set(range(0, Math.min(20, from + net)));
        rep.mark(range(from, from + used), "tint");
        rep.mark(range(from + b, Math.min(20, from + net)), "twice"); // moved across, but still counted in the other group
      } else {
        rep.set(range(0, from));
        rep.mark(range(from - used, from), "gone");
        rep.mark(range(Math.max(0, from - net), from - b), "twice");
      }
      // Object identity: each of the b counters (or story objects) keeps its place; used ones move, reused ones say so.
      const token = story ? story.thing : "●";
      tray.replaceChildren(...range(0, b).map((i) => h("span", { class: `token${i < used ? " used" : ""}${i < extra ? " twice" : ""}` },
        i < used && !story ? "○" : token)));
      tray.setAttribute("aria-label", `${b} ${story ? story.name : "counters"}: ${used} used${extra ? `, ${extra} of them counted twice` : ""}, ${b - used} left.`);
    }

    const ctl = {
      begin(retry) {
        if (retry) return;
        const { from, b, d } = fact;
        api.prompt(story ? `${from} ${story.name} ${story.start}. ${b} ${d > 0 ? story.more : story.away}. How many now? Build the bridge.`
          : `Build a bridge for ${from} ${d > 0 ? "plus" : "take away"} ${b}. Then press Go.`, "🌉");
      },
      ready: () => parts.length > 0,
      response: () => ({ parts: parts.slice() }),
      state: () => ({ parts: parts.slice() }),
      restore(s) { parts = (s.parts || []).slice(0, 6); line.reset(); draw(); },
      async model() {
        // Same task type, a neighbouring fact (never this item's answer), built through the next ten and crossed.
        const d = Math.sign(item.by), by = Math.abs(item.by) > 2 ? item.by - d : item.by + d;
        board(item.from, by);
        const ten = nextTen(item.from, d), first = ten - item.from;
        api.say(`Watch me. ${item.from} ${d > 0 ? "plus" : "take away"} ${Math.abs(by)}.`); await wait(2600);
        api.say(`First I ${d > 0 ? "fill up" : "go back"} to ${ten}: ${Math.abs(first)}.`); parts = [first]; draw(); await wait(3200);
        api.say(`Then the rest: ${Math.abs(by - first)}.`); parts = [first, by - first]; draw(); await wait(2800);
        await line.walk(api.say);
        line.reveal();
        api.say(`${item.from} ${sign(first)} ${sign(by - first)} is ${item.from + by}. I made ${ten} first. Now it's your turn.`); await wait(3500);
        parts = [];
        board(item.from, item.by);
      },
      async help(level, fb) {
        line.ghost([]);
        // The consequence first: the walker crosses as far as the bridge goes. The gap (or the extra span) is the feedback.
        await line.walk(api.say);
        if (fb.misconception === "double_count") tray?.classList.add("pulse");
        api.say(fb.feedback || "Look at the gap, then build the bridge again.");
        await wait(2500);
        tray?.classList.remove("pulse");
        // A short bridge stays up so the missing plank can be added; anything else is rebuilt (Grade 1 has no plank back).
        if (fb.misconception !== "short" || level >= 2) { parts = []; draw(); }
        if (level >= 2) { // partial model: the first plank, to the next ten, drawn dashed
          const ten = nextTen(fact.from, fact.d), first = ten - fact.from;
          if (Math.abs(first) < fact.b) { line.ghost([first]); api.say(`Try ${fact.d > 0 ? "filling up" : "going back"} to ${ten} first: ${Math.abs(first)}. Then the rest.`); }
        }
        api.prompt(`Try again: ${fact.from} ${fact.d > 0 ? "plus" : "take away"} ${fact.b}.`, "🌉");
      },
      async worked(sol) {
        parts = []; draw(); line.ghost([]);
        for (const p of sol.parts) { parts.push(p); draw(); api.say(`${end() - p} ${sign(p)} is ${end()}.`); await wait(2600); }
        await line.walk(api.say);
        line.reveal();
        api.say(`${fact.from} ${sign(fact.by)} is ${fact.to}.`); await wait(2500);
      },
      async success(fb) {
        await line.walk(api.say);
        line.reveal();
        api.say(STRATEGY[fb.strategy] || "Across!");
        api.feedback(`Yes! ${api.item().from} ${sign(api.item().by)} = ${api.item().from + api.item().by}. ${STRATEGY[fb.strategy] || ""}`, "good");
        await wait(2500);
      },
    };
    board(item.from, item.by);
    return ctl;
  }

  K.run({
    goal: "Lay planks to get across the river.",
    title: "Bridge Builder", checkLabel: "Go",
    closure: "All done! You built great bridges today.",
    stages: {
      bridge_frame: { name: "Bridge on the ten-frame" }, bridge_rack: { name: "Bridge on the bead rack" },
      bridge_story: { name: "Story bridges" }, bridge_100: { name: "Bridges to 100" },
    },
    praise: (item) => `Yes! ${item.from} ${sign(item.by)} = ${item.from + item.by}.`,
    mount: bridge,
  });
})();
