// Bridge Builder 1.6.0 (art step, docs/art-inventory.md): the 1.5.0 game on kit 1.6.0 with its art. The story objects
// are pictures (G03-T) instead of emoji, the walker is the star sheet (G03-A: it walks, stops kindly at a gap, hops
// across), and the two Batch 3 strands have their own wallpapers (B3-W1, B3-W2). Same items, responses and checker.
// Bridge Builder 1.5.0 (Step 5 Batch 3): the 1.4.0 game plus two strands on the same river. Parts that make it: pick the
// cards that make the target span (two or three parts; the child picks every card). Set some aside: a row of blocks is
// too long for the gap; set aside the part that is extra, so the blocks left standing make the target. Untimed, like
// every strand. The server checks the cards picked; this file only presents. Art drop-in (docs/art-inventory.md section 4):
// B3-W1 is the parts strand's wallpaper, B3-W2 the set-aside strand's, and B3-A1 the burrow friend each block becomes (it
// holds up the block's number and ducks down, gently, when set aside). Until the art lands: plain drawn cards and blocks.
// Bridge Builder 1.4.0: the 1.3.0 game on kit 1.5.0 (its world: scene behind the board, painted tile); same items, responses and checker.
// Bridge Builder 1.3.0: the 1.2.0 game on the kit 1.4.0 stylesheet (the Lumos look, DESIGN.md v2); same items, responses and checker.
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
  /** A story object's picture (art row G03-T); the card and the tray say the words. */
  const thing = (story) => h("img", { class: "thing", src: `../../art/bridge-builder/${story.thing}.webp`, alt: "" });
  /** The walker (art row G03-A): frames 1-6 walk, 7 stops kindly at a gap, 8 a happy hop across. */
  const WALKER = { src: "../../art/bridge-builder/walker.webp", cols: 4, rows: 2, walk: [0, 1, 2, 3, 4, 5], stop: 6, done: 7 };
  // Story skins: short acted stories, objects and narration; the answer is built the same way. Neutral contexts only.
  const STORIES = [
    { thing: "duck", name: "ducks", start: "on the pond", more: "swim over", away: "swim away" },
    { thing: "apple", name: "apples", start: "in the basket", more: "are picked and put in", away: "are taken out" },
    { thing: "bird", name: "birds", start: "on the wire", more: "fly in", away: "fly away" },
    { thing: "boat", name: "boats", start: "at the dock", more: "sail in", away: "sail away" },
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
        ? h("p", { class: "card" }, h("span", { "aria-hidden": "true" }, ...range(0, Math.min(from, 20)).map(() => thing(story))), h("br"),
          `${from} ${story.name} ${story.start}. ${fact.b} ${fact.d > 0 ? story.more : story.away}.`)
        : h("p", { class: "card" }, `${from} ${sign(by)}`);
      if (big) area.append(card); // facts: the card sits with the counters, so the board fits a tablet screen
      line = K.jumpLine(area, { lo, hi, from, to: fact.to, labels: [...new Set([lo, hi, from, ...range(lo, hi + 1).filter((v) => v % 10 === 0)])],
        label: "The bridge", actor: WALKER, onTap: big ? null : (n) => n !== end() && lay(n - end()) });
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
      tray.replaceChildren(...range(0, b).map((i) => h("span", { class: `token${i < used ? " used" : ""}${i < extra ? " twice" : ""}` },
        story ? thing(story) : i < used ? "○" : "●")));
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

  // ---------------------------------------------------------------- Batch 3: the sums strands
  /** The places of the fewest values (at least `min`) that make `want`: the same search as the server's (items.ts fewest). */
  function fewest(values, want, min = 1) {
    let best = null;
    for (let m = 1; m < 2 ** values.length; m++) {
      const p = values.flatMap((_, i) => ((m >> i) & 1 ? [i] : []));
      if (p.length >= min && sum(p.map((i) => values[i])) === want && (!best || p.length < best.length)) best = p;
    }
    return best;
  }
  /** The span over the river: the gap is the target, each picked value a plank laid in it (a short bridge shows its gap,
   * a long one its extra part). Drawn, so it sits in the picture; the words beside it say the same. */
  function span(parent, label) {
    const bar = h("div", { class: "span", role: "img" }), words = h("p", { class: "count", "aria-live": "polite" });
    parent.append(h("figure", { class: "manip spanfig" }, h("figcaption", {}, label), bar), words);
    return (to, vals, guided) => {
      const got = sum(vals), w = Math.max(to, got);
      bar.replaceChildren(...vals.map((v) => h("span", { class: "plank", style: `flex: ${v}` }, String(v))),
        ...(got < to ? [h("span", { class: "gap", style: `flex: ${to - got}` })] : []));
      bar.style.setProperty("--goal", `${(to / w) * 100}%`);
      bar.setAttribute("aria-label", vals.length ? `${vals.join(" + ")}${got < to ? ": short of the far side" : got > to ? ": past the far side" : ": across"}` : "No planks yet");
      words.textContent = guided && vals.length ? `${vals.join(" + ")} = ${got}` : ""; // guided only: Prove shows no totals
    };
  }

  // Parts that make it: number cards; tap a card to lay it as a plank, tap it again to take it back.
  function sums(item, area, api) {
    let picks = [], pulse = [], cards = item.palette, to = item.to;
    const head = h("p", { class: "card target" }), row = h("div", { class: "palette cards", role: "group", "aria-label": "Number cards" });
    area.append(head, row);
    const lay = span(area, "The bridge");
    function draw() {
      head.textContent = `Make ${to}`;
      row.replaceChildren(...cards.map((v, i) => h("button", { type: "button", class: `numcard${pulse.includes(i) ? " pulse" : ""}`, "data-i": i,
        "aria-pressed": String(picks.includes(i)), "aria-label": `${v}${picks.includes(i) ? ", picked" : ""}`, onclick: () => tap(i) }, String(v))));
      lay(to, picks.map((i) => cards[i]), item.mode === "guided");
      api.refresh();
    }
    function tap(i) { picks = picks.includes(i) ? picks.filter((p) => p !== i) : [...picks, i]; pulse = []; api.say(`${cards[i]}${picks.includes(i) ? "" : ": taken back"}`); draw(); api.changed(); }
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`Pick the cards that make ${to} together. Then press Go.`, "🌉"); },
      ready: () => picks.length > 0,
      response: () => ({ taps: picks.slice() }),
      state: () => ({ picks: picks.slice() }),
      restore(s) { picks = (s.picks || []).slice(0, cards.length); pulse = []; draw(); },
      async model() { // a small example of the same kind (never this item's cards): one card, then what is missing
        cards = [4, 1, 3]; to = 5; picks = []; draw();
        api.say("Watch me. I need 5. I take a card: 4."); picks = [0]; draw(); await wait(2800);
        api.say("4 and what make 5? 1 more. Here is a 1."); picks = [0, 1]; draw(); await wait(2800);
        api.say("4 + 1 = 5. Across! Now it's your turn."); await wait(2600);
        cards = item.palette; to = item.to; picks = []; draw();
      },
      async help(level, fb) {
        const vals = picks.map((i) => cards[i]), got = sum(vals);
        api.say(fb.feedback || "Add your parts together. Do they make the target?"); await wait(2600);
        if (fb.misconception === "near_sum") { api.say(`Your parts make ${got}. The target is ${to}. ${got > to ? `${got - to} too many` : `${to - got} more needed`}.`); await wait(3200); }
        picks = []; draw();
        if (level >= 2) { // partial model: the first card of a way that works, picked
          const way = fewest(cards, to, 2);
          if (way) { picks = [way[0]]; pulse = []; draw(); api.say(`Start with ${cards[way[0]]}. What makes the rest?`); await wait(2600); }
        }
        api.prompt(`Try again. Pick the cards that make ${to}.`, "🌉");
      },
      async worked(sol) { picks = []; draw(); for (const i of sol.taps) { picks.push(i); draw(); api.say(`${cards[i]}.`); await wait(1800); } api.say(`${sol.taps.map((i) => cards[i]).join(" + ")} = ${to}.`); await wait(2400); },
      async success() { api.say(`Yes! ${picks.map((i) => cards[i]).join(" + ")} = ${to}. Across!`); await wait(2400); },
    };
    draw();
    return ctl;
  }

  // Set some aside: a row of number blocks longer than the gap; a tapped block slides down to the shelf (gently, no
  // smashing), tap it again to stand it back up. The blocks left standing are the bridge.
  function aside(item, area, api) {
    let picks = [], pulse = [], blocks = item.palette, to = item.to;
    const head = h("p", { class: "card target" }), row = h("div", { class: "palette blocks", role: "group", "aria-label": "Number blocks" });
    area.append(head, row);
    const lay = span(area, "Standing");
    const standing = () => blocks.flatMap((v, i) => (picks.includes(i) ? [] : [v]));
    function draw() {
      head.textContent = `Keep ${to} standing`;
      row.replaceChildren(...blocks.map((v, i) => h("button", { type: "button", class: `numblock${picks.includes(i) ? " aside" : ""}${pulse.includes(i) ? " pulse" : ""}`, "data-i": i,
        "aria-pressed": String(picks.includes(i)), "aria-label": `${v}${picks.includes(i) ? ", set aside" : ""}`, style: `--h: ${Math.max(...blocks) ? v / Math.max(...blocks) : 1}`, onclick: () => tap(i) },
        h("span", {}, String(v)))));
      lay(to, standing(), item.mode === "guided");
      api.refresh();
    }
    function tap(i) { picks = picks.includes(i) ? picks.filter((p) => p !== i) : [...picks, i]; pulse = []; api.say(`${blocks[i]}${picks.includes(i) ? ": set aside" : ": standing again"}`); draw(); api.changed(); }
    const tell = () => `All together is ${sum(blocks)}. The target is ${to}. The part to set aside is ${sum(blocks) - to}.`;
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`The blocks are too long for the gap. Set some aside so ${to} stays standing. Then press Go.`, "🌉"); },
      ready: () => picks.length > 0 && picks.length < blocks.length,
      response: () => ({ taps: picks.slice() }),
      state: () => ({ picks: picks.slice() }),
      restore(s) { picks = (s.picks || []).slice(0, blocks.length); pulse = []; draw(); },
      async model() { // a small example of the same kind (never this item's blocks): all together, the target, the extra
        blocks = [3, 2, 1]; to = 5; picks = []; draw();
        api.say("Watch me. I need 5 standing. All together is 6."); await wait(2800);
        api.say("6 is 1 too many. The part to set aside is 1."); picks = [2]; draw(); await wait(2800);
        api.say("3 + 2 = 5 standing. Now it's your turn."); await wait(2600);
        blocks = item.palette; to = item.to; picks = []; draw();
      },
      async help(level, fb) {
        pulse = picks.slice(); draw();
        api.say(fb.feedback || "Find all together, then set aside only the extra."); await wait(2600);
        api.say(tell()); await wait(3600); // the subtraction said aloud, every time
        picks = []; pulse = []; draw();
        if (level >= 2) { // partial model: one block of the extra set aside
          const way = fewest(blocks, sum(blocks) - to);
          if (way) { picks = [way[0]]; draw(); api.say(`I set aside ${blocks[way[0]]}.`); await wait(2400); }
        }
        api.prompt(`Try again. Keep ${to} standing.`, "🌉");
      },
      async worked(sol) { picks = []; draw(); api.say(tell()); await wait(3200); for (const i of sol.taps) { picks.push(i); draw(); api.say(`Set aside ${blocks[i]}.`); await wait(1800); } },
      async success() { api.say(`Yes! ${standing().join(" + ")} = ${to} standing.`); await wait(2400); },
    };
    draw();
    return ctl;
  }

  K.run({
    goal: "Lay planks to get across the river.",
    title: "The Chasm Crossing", checkLabel: "Go",
    closure: "All done! You built great bridges today.",
    stages: {
      bridge_frame: { name: "Bridge on the ten-frame" }, bridge_rack: { name: "Bridge on the bead rack" },
      bridge_story: { name: "Story bridges" }, bridge_100: { name: "Bridges to 100" },
      bridge_sums: { name: "Parts that make it" }, bridge_aside: { name: "Set some aside" },
    },
    praise: (item) => (item.stage === "bridge_sums" ? `Yes! You made ${item.to}.` : item.stage === "bridge_aside" ? `Yes! ${item.to} standing.` : `Yes! ${item.from} ${sign(item.by)} = ${item.from + item.by}.`),
    mount: (item, area, api) => {
      // The two Batch 3 strands have their own wallpapers (B3-W1, B3-W2); every other stage keeps the game's scene.
      document.body.style.backgroundImage = `url(../../scenes/bridge-builder${{ bridge_sums: "-parts", bridge_aside: "-set-aside" }[item.stage] ?? ""}.webp)`;
      return (item.stage === "bridge_sums" ? sums : item.stage === "bridge_aside" ? aside : bridge)(item, area, api);
    },
  });
})();
