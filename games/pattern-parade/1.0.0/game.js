// Pattern Parade 1.0.0 (K–3): find the CORE first (tap the end of the part that repeats), then keep it going, fill
// the missing middle, or rebuild it a new way (shapes → sounds → actions); Grades 2–3 also grow towers by the same
// amount each step, the added cubes made visible and named. Core-first: the tiles to add stay locked until a core is
// marked, and the server never counts an answer whose core is wrong; a wrong extension replays only the core, looped
// and highlighted. Every tile is coded three ways: colour, shape (or picture) and a pitch, never colour alone.
// Tile sets are generic and neutral (the teacher picks one when launching). The server decides every answer.
(() => {
  "use strict";
  const K = window.LumosKit, { h, wait } = K;
  const SETS = {
    shapes: [{ name: "red circle", shape: "circle", colour: "#c62828", hz: 262 }, { name: "blue triangle", shape: "triangle", colour: "#1565c0", hz: 330 },
      { name: "yellow square", shape: "square", colour: "#f9a825", hz: 392 }, { name: "green diamond", shape: "diamond", colour: "#2e7d32", hz: 523 }],
    animals: [{ name: "turtle", emoji: "🐢", colour: "#c8e6c9", hz: 262 }, { name: "rabbit", emoji: "🐇", colour: "#bbdefb", hz: 330 },
      { name: "owl", emoji: "🦉", colour: "#ffe0b2", hz: 392 }, { name: "fish", emoji: "🐟", colour: "#e1bee7", hz: 523 }],
    nature: [{ name: "leaf", emoji: "🍃", colour: "#c8e6c9", hz: 262 }, { name: "flower", emoji: "🌼", colour: "#fff3b0", hz: 330 },
      { name: "shell", emoji: "🐚", colour: "#ffccbc", hz: 392 }, { name: "acorn", emoji: "🌰", colour: "#d7ccc8", hz: 523 }],
  };
  // The same three, in the same order, as the server's teacher-facing names (src/lib/items.ts TRANSLATE).
  const INTO = {
    sounds: [{ name: "drum", emoji: "🥁", colour: "#ffcdd2", hz: 131 }, { name: "bell", emoji: "🔔", colour: "#fff3b0", hz: 880 },
      { name: "trumpet", emoji: "🎺", colour: "#bbdefb", hz: 440 }],
    actions: [{ name: "clap", emoji: "👏", colour: "#e1bee7", hz: 294 }, { name: "stomp", emoji: "🦶", colour: "#d7ccc8", hz: 196 },
      { name: "reach up", emoji: "🙌", colour: "#c8e6c9", hz: 587 }],
  };
  const seqOf = (core, n) => Array.from({ length: n }, (_, i) => core[i % core.length]);

  function patterns(item, area, api) {
    let core = 0, tiles = [], strip, target, palette, hear;
    let spec = item; // the item, or the demonstrator's neighbouring pattern
    const set = () => SETS[spec.set] || SETS.shapes;
    const slots = () => (spec.stage === "pattern_extend" ? spec.extend : spec.stage === "pattern_missing" ? spec.gap[1] : spec.stage === "pattern_translate" ? spec.shown : 0);
    const gapAt = (i) => spec.stage === "pattern_missing" && i >= spec.gap[0] && i < spec.gap[0] + spec.gap[1];
    /** The tiles this item asks for (to show the first one as a hint on the ladder's second rung). */
    const want = () => (spec.stage === "pattern_extend" ? seqOf(spec.core, spec.shown + spec.extend).slice(spec.shown)
      : spec.stage === "pattern_missing" ? seqOf(spec.core, spec.shown).slice(spec.gap[0], spec.gap[0] + spec.gap[1]) : seqOf(spec.core, spec.shown));

    function board(s) {
      spec = s;
      area.replaceChildren();
      strip = K.tileStrip(area, { label: "The pattern", onTap: markCore });
      if (spec.stage === "pattern_translate") target = K.tileStrip(area, { label: `Your pattern with ${spec.into}` });
      const row = h("div", { class: "row" });
      area.append(row);
      hear = h("button", { type: "button", class: "secondary", onclick: () => chant(seqOf(spec.core, spec.shown).map((k, i) => (gapAt(i) ? null : k))) }, "🎵 Hear the pattern");
      row.append(hear);
      if (spec.stage !== "pattern_core") {
        const opts = spec.stage === "pattern_translate" ? INTO[spec.into] : set();
        palette = h("div", { class: "palette", role: "group", "aria-label": "Tiles to add" },
          ...opts.map((t, k) => h("button", { type: "button", "data-k": k, "aria-label": `Add ${t.name}`, onclick: () => add(k) }, K.tileArt(t), t.name)));
        row.append(palette);
      }
      draw();
    }
    /** The pattern as tiles: the shown sequence (gaps empty), then any places to fill; the core marked. */
    function draw() {
      const seq = seqOf(spec.core, spec.shown), s = set();
      const into = spec.stage === "pattern_translate" ? INTO[spec.into] : null;
      const shown = seq.map((k, i) => (gapAt(i) ? null : s[k]));
      if (spec.stage === "pattern_missing") tiles.forEach((k, j) => { shown[spec.gap[0] + j] = s[k]; });
      const extra = spec.stage === "pattern_extend" ? Array.from({ length: spec.extend }, (_, j) => (j < tiles.length ? s[tiles[j]] : null)) : [];
      strip.set([...shown, ...extra]);
      strip.unmark();
      if (core) strip.mark(Array.from({ length: core }, (_, i) => i), "core");
      if (target) target.set(Array.from({ length: spec.shown }, (_, j) => (j < tiles.length ? into[tiles[j]] : null)));
      // Core first: nothing can be added until the repeating unit is marked.
      palette?.querySelectorAll("button").forEach((b) => { b.disabled = !core || tiles.length >= slots(); });
      api.refresh();
    }
    async function chant(ks, from = 0) {
      const s = spec.stage === "pattern_translate" && ks === tiles ? INTO[spec.into] : set();
      for (const [i, k] of ks.entries()) {
        if (k == null) continue;
        (ks === tiles && target ? target : strip).mark([from + i], "mark");
        K.tone(s[k].hz); api.say(s[k].name);
        await wait(650);
        (ks === tiles && target ? target : strip).unmark();
        if (core) strip.mark(Array.from({ length: core }, (_, j) => j), "core");
      }
    }
    function markCore(i) {
      if (i >= spec.shown || gapAt(i)) return;
      core = i + 1;
      draw();
      const s = set();
      K.tone(s[seqOf(spec.core, spec.shown)[i]].hz);
      api.say(`The core: ${seqOf(spec.core, core).map((k) => s[k].name).join(", ")}.`);
      api.changed();
    }
    function add(k) {
      if (!core) { api.say("First find the core: the part that repeats."); return; }
      if (tiles.length >= slots()) return;
      tiles.push(k);
      const t = (spec.stage === "pattern_translate" ? INTO[spec.into] : set())[k];
      K.tone(t.hz); api.say(t.name);
      draw();
      api.changed();
    }
    /** A miss on an extension: ONLY the core, looped and highlighted (twice), never the whole answer. */
    async function loopCore() {
      const s = set();
      strip.unmark(); strip.mark(spec.core.map((_, i) => i), "core");
      for (let loop = 0; loop < 2; loop++) for (const [i, k] of spec.core.entries()) {
        strip.mark([i], "mark"); K.tone(s[k].hz); api.say(s[k].name); await wait(650);
        strip.unmark(); strip.mark(spec.core.map((_, j) => j), "core");
      }
    }

    const ask = {
      pattern_core: "Find the core: tap the last tile of the part that repeats.",
      pattern_extend: `First find the core. Then keep the pattern going: add ${item.extend}.`,
      pattern_missing: "First find the core. Then fill the missing middle.",
      pattern_translate: `First find the core. Then make the same pattern with ${item.into}.`,
    };
    /** The ladder's scaffolds (rung 1, then rung 2's partial model); the "Try again" prompt follows. */
    async function hint(level, fb) {
      if (item.stage === "pattern_core" || fb.misconception === "no_core") {
        // Not found yet: say the whole pattern together (its sound shows the repeats); then where it starts again.
        if (fb.misconception === "no_core") { core = 0; tiles = []; draw(); } // core first, then the tiles again
        api.say(fb.feedback || "Say it with me."); await wait(2200);
        await chant(seqOf(item.core, item.shown).map((k, i) => (gapAt(i) ? null : k)));
        if (level >= 2) { // partial model: every place the first tile comes back
          const seq = seqOf(item.core, item.shown);
          strip.mark(seq.flatMap((k, i) => (i && i % item.core.length === 0 ? [i] : [])), "pulse");
          api.say("Look: here is where it starts again.");
        }
        return;
      }
      api.say(fb.feedback || "Listen to the core again."); await wait(2400);
      await loopCore();
      tiles = level >= 2 ? [want()[0]] : []; draw(); // the tiles again (rung 2: the first one put in for you)
      if (level >= 2) api.say("Here is the next one. Now keep going.");
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt(ask[item.stage], "🔁"); },
      ready: () => core > 0 && tiles.length === slots(),
      response: () => (item.stage === "pattern_core" ? { core } : { core, tiles: tiles.slice() }),
      state: () => ({ core, tiles: tiles.slice() }),
      restore(st) { core = st.core || 0; tiles = (st.tiles || []).slice(0, slots()); draw(); },
      async model() {
        // A neighbouring pattern (a different core), the same task: listen, find the core, then do the task.
        const c = item.core.length === 2 ? [0, 1, 2] : [0, 1];
        const demo = { ...item, core: c, shown: item.stage === "pattern_extend" ? c.length * 2 : item.stage === "pattern_translate" ? c.length * 2 : c.length * 3,
          ...(item.stage === "pattern_missing" ? { gap: [c.length, 1] } : {}) };
        board(demo);
        api.say("Watch me. First I listen."); await wait(1800);
        await chant(seqOf(c, demo.shown).map((k, i) => (gapAt(i) ? null : k)));
        core = c.length; draw();
        api.say(`The part that repeats is ${c.map((k) => set()[k].name).join(", ")}. That's the core.`); await wait(3800);
        if (slots()) {
          for (const k of want()) { tiles.push(k); draw(); K.tone(800); await wait(700); }
          api.say("I keep the core going. Now it's your turn."); await wait(2600);
        }
        core = 0; tiles = [];
        board(item);
      },
      async help(level, fb) { await hint(level, fb); api.prompt(`Try again. ${ask[item.stage]}`, "🔁"); },
      async worked(sol) {
        core = sol.core; tiles = []; draw();
        await loopCore();
        for (const k of sol.tiles || []) { tiles.push(k); draw(); const t = (item.stage === "pattern_translate" ? INTO[item.into] : set())[k]; K.tone(t.hz); api.say(t.name); await wait(800); }
        await wait(1500);
      },
      async success() {
        if (tiles.length) await chant(tiles, item.stage === "pattern_extend" ? item.shown : item.stage === "pattern_missing" ? item.gap[0] : 0);
        await wait(600);
      },
    };
    board(item);
    return ctl;
  }

  /** Growing towers (Grades 2–3): each tower grows (or shrinks) by the same amount; the change is coloured and named. */
  function towers(item, area, api) {
    let tower = 0, rule = 0, spec = item, pic, said, cubes, ruleStep;
    const step = () => spec.towers[1] - spec.towers[0];
    const named = (d) => (d > 0 ? `add ${d} each time` : d < 0 ? `take away ${-d} each time` : "the same each time");
    let showRule = item.mode === "guided";

    function board(s) {
      spec = s;
      area.replaceChildren();
      pic = K.svg("svg", { viewBox: "0 0 620 360", class: "visual towers", "aria-hidden": "true" });
      pic.addEventListener("click", (e) => { if (e.target.closest("[data-next]")) setTower(tower + 1); });
      said = h("p", { class: "dom towertext", "aria-live": "polite" });
      area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Towers"), pic, said));
      const side = h("div", { class: "planker" });
      area.append(side);
      cubes = K.stepper(side, { label: "Cubes in the next tower", min: 0, max: 40, value: 0, onChange: (v) => setTower(v, true) });
      if (spec.rule) ruleStep = K.stepper(side, { label: "The rule", min: -9, max: 9, value: 0, words: named, onChange: (v) => { rule = v; api.changed(); } });
      draw();
    }
    function draw() {
      const all = [...spec.towers, tower], kids = [];
      all.forEach((n, t) => {
        const x = 20 + t * 150, prev = t ? all[t - 1] : n, mine = t === spec.towers.length;
        if (mine) kids.push(K.svg("rect", { class: "nextspot", x: x - 6, y: 10, width: 112, height: 340, rx: 10, "data-next": 1 }));
        for (let c = 0; c < n; c++) kids.push(K.svg("rect", { class: `brick${!mine && t && c >= prev ? " added" : ""}`, x, y: 336 - (c + 1) * 13, width: 100, height: 11, ...(mine ? { "data-next": 1 } : {}) }));
        const label = K.svg("text", { x: x + 50, y: 30, "text-anchor": "middle" });
        label.textContent = mine ? "?" : t && showRule ? `${n - prev > 0 ? "+" : "−"}${Math.abs(n - prev)}` : "";
        kids.push(label);
      });
      pic.replaceChildren(...kids);
      said.textContent = `Towers: ${spec.towers.join(", ")} cubes${showRule ? ` (${named(step())})` : ""}. Your next tower: ${tower} cubes.`;
      cubes.set(tower);
      api.refresh();
    }
    function setTower(v, fromStepper) {
      tower = Math.max(0, Math.min(40, v));
      draw();
      if (!fromStepper) api.say(String(tower));
      api.changed();
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`How many cubes in the next tower? Build it.${item.rule ? " Then set the rule." : ""}`, "📈"); },
      ready: () => tower > 0,
      response: () => ({ tower, ...(item.rule ? { rule } : {}) }),
      state: () => ({ tower, rule }),
      restore(s) { tower = s.tower || 0; rule = s.rule || 0; ruleStep?.set(rule); draw(); },
      async model() {
        const d = step() > 0 ? step() + 1 : step() - 1, t0 = spec.towers[0];
        board({ ...item, towers: [t0, t0 + d, t0 + 2 * d] });
        showRule = true; draw();
        api.say(`Watch me. Each tower changes by the same amount: ${named(d)}.`); await wait(3500);
        tower = t0 + 3 * d; draw();
        api.say(`So the next tower has ${tower}. Now it's your turn.`); await wait(3000);
        tower = 0; showRule = item.mode === "guided";
        board(item);
      },
      async help(level, fb) {
        showRule = true; draw(); // the added amount made visible and named
        api.say(`${fb.feedback || "Look at how much each tower changes."} ${named(step())}.`);
        if (level >= 2) { // partial model: the next tower starts as the last one
          tower = spec.towers[spec.towers.length - 1]; draw();
          api.say(`Start with ${tower}. Now ${step() > 0 ? "add" : "take away"} ${Math.abs(step())}.`);
        }
        api.prompt(`Try again. How many cubes in the next tower?${item.rule ? " Then set the rule." : ""}`, "📈");
      },
      async worked(sol) {
        showRule = true; tower = spec.towers[spec.towers.length - 1]; draw(); await wait(1200);
        tower = sol.tower; if (item.rule) { rule = sol.rule; ruleStep.set(rule); } draw();
        api.say(`${spec.towers[spec.towers.length - 1]}, ${named(step())}: ${sol.tower}.`); await wait(2500);
      },
      async success() { showRule = true; draw(); api.say(`Yes! ${named(step())}.`); await wait(1800); },
    };
    board(item);
    return ctl;
  }

  K.run({
    title: "Pattern Parade", icon: "🔁",
    closure: "All done! You found great patterns today.",
    stages: {
      pattern_core: { name: "Find the core", icon: "🔎" }, pattern_extend: { name: "Keep it going", icon: "➡" },
      pattern_missing: { name: "Fill the middle", icon: "🧩" }, pattern_translate: { name: "Same pattern, new way", icon: "🎵" },
      pattern_grow: { name: "Growing towers", icon: "📈" },
    },
    praise: (item) => (item.stage === "pattern_core" ? "Yes! That's the core." : "Yes! The pattern keeps going."),
    mount: (item, area, api) => (item.stage === "pattern_grow" ? towers : patterns)(item, area, api),
  });
})();
