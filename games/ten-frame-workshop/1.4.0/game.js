// Ten-Frame Workshop 1.4.0: the 1.3.0 game on kit 1.5.0 (its world: scene behind the board, painted tile); same items, responses and checker.
// Ten-Frame Workshop 1.3.0: the 1.2.0 game on the kit 1.4.0 stylesheet (the Lumos look, DESIGN.md v2); same items, responses and checker.
// Ten-Frame Workshop 1.2.0: the 1.1.0 game on kit 1.3.0 (the game-feel layer: instant press feedback, Watch badge, sounds, goal line,
// drawn chrome; see DESIGN.md and docs/GAME_FEEL_REVIEW.md). Same items, same responses, same checker as 1.1.0.
// Ten-Frame Workshop (K–1): Quick Look, Build It, Two Ways, How Many More? on the kit's ten-frame.
// Everything a child is asked comes from the server's items; the server decides every answer. This file only presents:
// the build, the demonstrator, and the scaffold visuals the server's ladder asks for. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, wait } = K;
  const FIVE = [...Array(20).keys()];
  /** The first n spaces row by row (the frame's own structure), after any counters already there. */
  const fiveWise = (n, given = []) => [...new Set([...given, ...FIVE])].slice(0, n).sort((a, b) => a - b);
  const plural = (n) => `${n} ${n === 1 ? "counter" : "counters"}`;

  /** Count counters aloud, marking one at a time (never two at once: the counted-twice scaffold). */
  async function countAloud(api, frame, cells, from = 0) {
    for (const [k, i] of cells.entries()) {
      frame.unmark(); frame.mark([i], "mark");
      api.say(String(from + k + 1));
      await wait(800);
    }
    frame.unmark();
  }
  /** Place counters one at a time, saying the count (the demonstrator and the worked solution). */
  async function build(api, frame, cells, from = 0) {
    for (const [k, i] of cells.entries()) {
      frame.set([...frame.cells, i]);
      api.say(String(from + k + 1));
      await wait(800);
    }
  }
  const modelN = (item) => (item.n > 2 ? item.n - 1 : item.n + 1); // the demonstrator models a neighbour, not the answer

  function oneFrame(item, area, api) {
    const quick = item.stage === "quick_look", more = item.stage === "how_many_more";
    let phase = quick ? "look" : "build", target = null;
    const look = quick ? K.tenFrame(area, { frames: item.frames, readOnly: true, label: "Look" }) : null;
    if (look) look.set(item.show);
    const mine = K.tenFrame(area, { frames: item.frames, locked: item.given, label: "Your ten-frame",
      onTap: (i) => { if (phase !== "build") return; mine.toggle(i); count(); api.changed(); } });
    const tally = h("p", { class: "count", "aria-live": "polite" });
    const gotIt = h("button", { type: "button", class: "big", hidden: !quick }, "✋ I have it");
    area.append(tally, gotIt);
    const added = () => mine.cells.length - (item.given || []).length;
    // Running count on guided items only: Prove items never show an answer-revealing total.
    const count = () => { tally.textContent = item.mode === "guided" && phase === "build" ? (more ? `You added ${added()}.` : `You have ${plural(mine.cells.length)}.`) : ""; };
    function setPhase(p) {
      phase = p;
      look?.hide(p === "build" && !target);
      mine.hide(p === "look");
      gotIt.hidden = p !== "look";
      if (p === "look") { api.prompt("Look carefully. Tap “I have it” when it is in your head.", "👀"); gotIt.focus(); }
      count(); api.refresh();
    }
    gotIt.onclick = () => { setPhase("build"); api.prompt("Now build what you saw.", "🔨"); api.changed(); };
    const ask = () => more ? api.prompt(`Here ${item.given.length === 1 ? "is" : "are"} ${item.given.length}. Add counters to make ${item.n}.`, "➕")
      : api.prompt(`Build ${item.n}.`, "🔨");
    const ctl = {
      begin(retry) { if (quick) return setPhase(retry ? "build" : "look"); if (!retry) ask(); count(); },
      ready: () => phase === "build" && mine.cells.length > 0,
      response: () => ({ cells: mine.cells }),
      state: () => ({ cells: mine.cells, phase }),
      restore(s) { mine.set(s.cells || []); if (quick) setPhase(s.phase || "look"); count(); },
      get again() { return quick && phase === "build" ? () => setPhase("look") : null; },
      async model() {
        const n = modelN(item);
        if (more) { // on a demonstration frame with a different start, so the model is not this item's answer
          const g = fiveWise(modelN({ n: item.given.length })), demo = K.tenFrame(area, { frames: 1, locked: g, readOnly: true, label: "Watch me" });
          mine.hide(true);
          api.say(`Here are ${g.length}. I count on to ${item.n}.`); await wait(2600);
          await build(api, demo, FIVE.slice(0, 10).filter((c) => !g.includes(c)), g.length);
          api.say(`${g.length} and ${item.n - g.length} make ${item.n}. Now it's your turn.`); await wait(3000);
          demo.remove(); mine.hide(false);
          return;
        }
        if (quick) { look.set(fiveWise(n)); api.say(`I look at the frame. I see ${Math.min(n, 5)} on top${n > 5 ? `, and ${n - 5} more` : ""}. That's ${n}.`); await wait(3500); setPhase("build"); }
        await build(api, mine, fiveWise(n));
        api.say(`That's ${n}. Now it's your turn.`);
        await wait(1500);
        if (quick) look.set(item.show);
      },
      async help(level, fb) {
        mine.unmark();
        if (quick) setPhase("build");
        const want = quick ? item.show : fiveWise(item.n, item.given);
        if (level >= 2) { // partial model: the first part of a correct build, drawn as outlines to finish
          mine.mark(want.slice(0, Math.max(1, Math.min(5, item.n - 1))).filter((c) => !mine.cells.includes(c)), "ghost");
          api.say(fb.feedback || "Here is the start of it. Can you finish?");
          return;
        }
        if (fb.misconception === "counted_twice") {
          api.say("Let's count, one counter at a time."); await wait(1800);
          await countAloud(api, mine, mine.cells);
          api.say(`We need ${item.n}.`);
          return;
        }
        // Side by side: the target and your build, with the space still waiting for a counter pulsing (no buzzer).
        if (!target) { target = K.tenFrame(area, { frames: item.frames, readOnly: true, label: `${item.n} looks like this` }); area.insertBefore(area.lastElementChild, area.firstChild); }
        target.set(want);
        const gap = want.find((c) => !mine.cells.includes(c)) ?? FIVE.find((c) => !mine.cells.includes(c));
        if (gap != null) mine.mark([gap], "pulse");
        api.say(fb.feedback || "Let's put them side by side.");
      },
      async worked(sol) {
        mine.unmark();
        if (quick) setPhase("build");
        mine.set(item.given || []);
        await build(api, mine, sol.cells.filter((c) => !(item.given || []).includes(c)), (item.given || []).length);
        api.say(more ? `${item.given.length} and ${item.n - item.given.length} make ${item.n}.` : `That's ${item.n}: ${Math.min(5, item.n)} on top${item.n > 5 ? ` and ${item.n - 5} more` : ""}.`);
        await wait(2500);
      },
      async success() {
        if (quick && look) { look.hide(false); }
        await wait(300);
      },
    };
    return ctl;
  }

  function twoWays(item, area, api) {
    const tapper = (f) => (i) => { f.toggle(i); api.changed(); };
    const a = K.tenFrame(area, { frames: 1, label: "First way", onTap: (i) => tapper(a)(i) });
    const b = K.tenFrame(area, { frames: 1, label: "Second way", onTap: (i) => tapper(b)(i) });
    return {
      begin(retry) { if (!retry) api.prompt(`Build ${item.n} one way. Then build ${item.n} a different way.`, "🔀"); },
      ready: () => a.cells.length > 0 && b.cells.length > 0,
      response: () => ({ cells: a.cells, cells2: b.cells }),
      state: () => ({ cells: a.cells, cells2: b.cells }),
      restore(s) { a.set(s.cells || []); b.set(s.cells2 || []); },
      async model() {
        const n = modelN(item);
        api.say(`Here is ${n} one way.`); await wait(1500); await build(api, a, fiveWise(n));
        api.say(`And ${n} another way.`); await wait(1500); await build(api, b, [0, 5, 1, 6, 2, 7, 3, 8, 4, 9].slice(0, n));
        api.say(`Both are ${n}. Moving counters does not change how many.`); await wait(3000);
      },
      async help(level, fb) {
        a.unmark(); b.unmark();
        const off = [a, b].find((f) => f.cells.length !== item.n);
        if (level >= 2) { (off || b).mark(fiveWise(Math.min(5, item.n - 1)), "ghost"); api.say(fb.feedback || "Here is the start of one way."); return; }
        if (off && fb.misconception === "counted_twice") { api.say("Let's count, one counter at a time."); await wait(1800); await countAloud(api, off, off.cells); api.say(`We need ${item.n}.`); return; }
        if (off) { const gap = fiveWise(item.n).find((c) => !off.cells.includes(c)); if (gap != null) off.mark([gap], "pulse"); }
        else b.mark(b.cells, "pulse");
        api.say(fb.feedback || "Let's look again.");
      },
      async worked(sol) {
        a.set([]); b.set([]);
        await build(api, a, sol.cells); await build(api, b, sol.cells2);
        api.say(`Both are ${item.n}. Moving counters does not change how many.`); await wait(2500);
      },
      async success() {
        // Rearrangement does not change quantity, shown explicitly.
        a.mark(a.cells, "mark"); b.mark(b.cells, "mark");
        api.say(`Both are ${item.n}. Moving counters does not change how many.`);
        await wait(2500);
      },
    };
  }

  K.run({
    goal: "Fill the frame to show the number.",
    title: "Ten-Frame Workshop",
    closure: "All done! You did great thinking with the ten-frame today.",
    stages: {
      quick_look: { name: "Quick Look" }, build_it: { name: "Build It" },
      two_ways: { name: "Two Ways" }, how_many_more: { name: "How Many More?" },
    },
    praise: (item) => `Yes! ${item.n}.`,
    mount: (item, area, api) => (item.stage === "two_ways" ? twoWays : oneFrame)(item, area, api),
  });
})();
