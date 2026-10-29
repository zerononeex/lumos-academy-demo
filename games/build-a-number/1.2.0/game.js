// Build-a-Number 1.2.0: the 1.1.0 game on kit 1.3.0 (the game-feel layer: instant press feedback, Watch badge, sounds, goal line,
// drawn chrome; see DESIGN.md and docs/GAME_FEEL_REVIEW.md). Same items, same responses, same checker as 1.1.0.
// Build-a-Number: Tens & Ones Workshop (Grades 1–3): build, read and trade on a place-value mat (to 20, 100 or
// 1000: the teacher's range). Ten loose cubes snap into a ten-stick, counted aloud by tens; ten sticks snap into a
// hundred flat; the numeral and expanded form update live from what the child built. Canonical and non-canonical
// builds both count (34 = 3 tens 4 ones = 2 tens 14 ones), and the trade between them is a named action. Every place
// stays on the mat when it is empty: 304 keeps its 0 tens. The server decides every answer. Original art.
(() => {
  "use strict";
  const K = window.LumosKit, { h, wait } = K;
  const NAME = { hundreds: ["hundred", "hundreds"], tens: ["ten", "tens"], ones: ["one", "ones"] };
  const AT = { hundreds: 0, tens: 1, ones: 2 }, UNIT = { hundreds: 100, tens: 10, ones: 1 };
  const words = (k, p) => `${k} ${NAME[p][k === 1 ? 0 : 1]}`;
  const valueOf = (b) => b[0] * 100 + b[1] * 10 + b[2];
  const digits = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
  const cap = (p) => p[0].toUpperCase() + p.slice(1);

  function workshop(item, area, api) {
    const places = item.max === 1000 ? ["hundreds", "tens", "ones"] : ["tens", "ones"];
    const read = item.stage === "place_read", trade = item.stage === "place_trade";
    let blocks = [0, 0, 0], said = [0, 0, 0], mat, live, steppers = {}, trades = [];
    const say = (b) => places.map((p) => words(b[AT[p]], p)).join(", ").replace(/, ([^,]*)$/, " and $1");
    const expanded = (b) => places.map((p) => b[AT[p]] * UNIT[p]).join(" + ");

    /** Draw the mat and its controls for a number's starting blocks (the item's, or the demonstrator's). */
    function board(start) {
      area.replaceChildren();
      mat = K.baseTen(area, { places, label: read ? "Look at the blocks" : "Your mat", onTap: read ? null : (p) => setPlace(p, blocks[AT[p]] + 1) });
      const side = h("div", { class: "planker" });
      area.append(side);
      steppers = {};
      if (read) for (const p of places) steppers[p] = K.stepper(side, { label: `${cap(p)} digit`, min: 0, max: 9, value: 0,
        onChange: (v) => { said[AT[p]] = v; show(); api.changed(); } });
      else {
        for (const p of places) steppers[p] = K.stepper(side, { label: cap(p), min: 0, max: 30, value: 0, onChange: (v) => setPlace(p, v, true) });
        // The trades, named. "Snap" makes the bigger block; "break" takes it apart again.
        const pairs = [["ones", "tens"], ...(places.length === 3 ? [["tens", "hundreds"]] : [])];
        trades = pairs.flatMap(([small, bigger]) => [
          h("button", { type: "button", class: "secondary", "data-trade": `snap-${small}`, onclick: () => snap(small, bigger) }, `🔗 Snap 10 ${small} into a ${NAME[bigger][0]}`),
          h("button", { type: "button", class: "secondary", "data-trade": `break-${bigger}`, onclick: () => breakUp(bigger, small) }, `💥 Break a ${NAME[bigger][0]} into 10 ${small}`)]);
        area.append(h("div", { class: "trades" }, ...trades));
      }
      live = h("p", { class: "count", "aria-live": "polite" });
      side.append(live);
      blocks = start.slice();
      show();
    }
    function show() {
      mat.set(places.map((p) => blocks[AT[p]]));
      for (const p of places) steppers[p].set(read ? said[AT[p]] : blocks[AT[p]]);
      for (const b of trades) {
        const [what, p] = b.dataset.trade.split("-");
        b.disabled = what === "snap" ? blocks[AT[p]] < 10 : blocks[AT[p]] < 1;
      }
      // The numeral and the expanded form, live from the blocks (reading: the number the child is saying).
      live.textContent = read ? `You say: ${valueOf(said)}` : `${say(blocks)}: ${expanded(blocks)} = ${valueOf(blocks)}`;
    }
    function setPlace(p, v, fromStepper) {
      blocks[AT[p]] = Math.max(0, Math.min(30, v));
      show();
      if (!fromStepper) api.say(words(blocks[AT[p]], p));
      api.changed();
    }
    /** Count a place's blocks aloud, one highlighted at a time: sticks by tens, flats by hundreds, cubes by ones. */
    async function countAloud(b, from = 0) {
      let n = from;
      for (const p of places) for (let j = 0; j < b[AT[p]]; j++) {
        mat.unmark(); mat.markBlock(p, j);
        n += UNIT[p];
        api.say(String(n));
        await wait(700);
      }
      mat.unmark();
      return n;
    }
    async function snap(small, bigger) {
      if (blocks[AT[small]] < 10) return;
      blocks[AT[small]] -= 10; blocks[AT[bigger]] += 1;
      show(); api.changed();
      // Counting-by-tens (or hundreds) audio: the bigger blocks counted aloud after the snap.
      api.say(`10 ${small} snap into 1 ${NAME[bigger][0]}. ${Array.from({ length: blocks[AT[bigger]] }, (_, j) => (j + 1) * UNIT[bigger]).join(", ")}.`);
    }
    async function breakUp(bigger, small) {
      if (blocks[AT[bigger]] < 1) return;
      blocks[AT[bigger]] -= 1; blocks[AT[small]] += 10;
      show(); api.changed();
      api.say(`1 ${NAME[bigger][0]} breaks into 10 ${small}. Still ${valueOf(blocks)}.`);
    }
    const start = () => (item.blocks ? item.blocks.slice() : [0, 0, 0]);

    /** The ladder's scaffolds (rung 1, then rung 2's partial model); the "Try again" prompt follows. */
    async function hint(level, fb) {
      mat.unmark(); trades.forEach((b) => b.classList.remove("pulse"));
      const want = digits(item.n), top = places.find((p) => want[AT[p]]) ?? "ones";
      const breakBtn = trades.find((b) => b.dataset.trade === (want[1] ? "break-tens" : "break-hundreds"));
      if (level >= 2) { // partial model: the biggest place done for you
        if (read) { said[AT[top]] = want[AT[top]]; show(); api.say(`The ${top} digit is ${want[AT[top]]}. Now the rest.`); }
        else if (trade) { breakBtn.classList.add("pulse"); mat.markBlock(want[1] ? "tens" : "hundreds", 0); api.say(`Break this ${want[1] ? "ten" : "hundred"} up.`); }
        else { blocks[AT[top]] = want[AT[top]]; show(); api.say(`Here ${want[AT[top]] === 1 ? "is" : "are"} ${words(want[AT[top]], top)}. Now the rest.`); }
        return;
      }
      if (fb.misconception === "same_way") { breakBtn?.classList.add("pulse"); api.say(fb.feedback || "Trade a ten for ten ones."); return; }
      if (fb.misconception === "zero_place") { // the empty place stays on the mat, never collapsed
        const empty = places.find((p) => !want[AT[p]]);
        if (empty) mat.markCol(empty, "pulse");
        api.say(`${item.n} is ${say(want)}. ${fb.feedback || ""}`.trim());
        return;
      }
      // Side by side: the blocks counted aloud, tens by tens, then the ones ("47 is not 4 and 7").
      api.say(fb.feedback || "Let's count together."); await wait(2500);
      if (read) {
        let n = 0;
        for (const p of places) {
          for (let j = 0; j < item.blocks[AT[p]] && p !== "ones"; j++) { mat.unmark(); mat.markBlock(p, j); n += UNIT[p]; api.say(String(n)); await wait(700); }
        }
        mat.unmark();
        api.say(`${words(n / 10, "tens")} make ${n}. And ${words(item.blocks[2], "ones")}.`);
      } else {
        const got = await countAloud(blocks);
        api.say(`That's ${got}. We need ${item.n}.`);
      }
    }
    const task = read ? "What number is this? Set the digits." : trade ? `This is ${item.n}. Show ${item.n} another way: make a trade.` : `Build ${item.n}.`;
    const icon = read ? "🔎" : trade ? "🔁" : "🧱";
    const ctl = {
      begin(retry) { if (!retry) api.prompt(task, icon); },
      ready: () => (read ? valueOf(said) > 0 : valueOf(blocks) > 0),
      response: () => (read ? { read: valueOf(said) } : { blocks: blocks.slice() }),
      state: () => (read ? { said: said.slice() } : { blocks: blocks.slice() }),
      restore(s) { if (read) said = (s.said || [0, 0, 0]).slice(); else blocks = (s.blocks || start()).slice(); show(); },
      async model() {
        // Same task, a neighbouring number on the same mat.
        const m = item.n % 10 === 9 ? item.n - 1 : item.n + 1, b = digits(m);
        if (trade) {
          board(b); api.say(`Watch me. This is ${m}: ${say(b)}.`); await wait(3500);
          const [small, bigger] = b[1] ? ["ones", "tens"] : ["tens", "hundreds"];
          await breakUp(bigger, small); await wait(3500);
          api.say(`Now it's ${say(blocks)}. Still ${m}. Now it's your turn.`); await wait(3500);
        } else {
          board(read ? b : [0, 0, 0]);
          api.say(read ? `Watch me read it. I count the tens by tens, then the ones.` : `Watch me build ${m}. Tens first, counting by tens, then the ones.`); await wait(3000);
          if (!read) { blocks = b.slice(); show(); }
          await countAloud(b);
          if (read) { said = b.slice(); show(); }
          api.say(`${say(b)} is ${m}. Now it's your turn.`); await wait(3200);
        }
        said = [0, 0, 0];
        board(start());
      },
      async help(level, fb) { await hint(level, fb); api.prompt(`Try again. ${task}`, icon); },
      async worked(sol) {
        mat.unmark();
        if (read) { await countAloud(item.blocks); said = digits(item.n); show(); api.say(`${say(item.blocks)} is ${item.n}.`); }
        else if (trade) { blocks = start(); show(); const [small, bigger] = start()[1] ? ["ones", "tens"] : ["tens", "hundreds"]; await breakUp(bigger, small); }
        else { blocks = [0, 0, 0]; show(); blocks = sol.blocks.slice(); show(); await countAloud(blocks); api.say(`${say(blocks)} is ${item.n}.`); }
        await wait(2500);
      },
      async success(fb) {
        const b = read ? item.blocks : blocks;
        api.say(trade ? `You made a trade. ${say(b)} is still ${item.n}!`
          : fb.strategy === "non_canonical" ? `${say(b)} is ${item.n} too!` : `${say(b)} is ${item.n}.`);
        await wait(2200);
      },
    };
    board(start());
    return ctl;
  }

  K.run({
    goal: "Build numbers with tens and ones.",
    title: "Build-a-Number",
    closure: "All done! You built great numbers today.",
    stages: { place_build: { name: "Build it" }, place_read: { name: "Read it" }, place_trade: { name: "Trade it" } },
    praise: (item) => `Yes! ${item.n}.`,
    mount: workshop,
  });
})();
