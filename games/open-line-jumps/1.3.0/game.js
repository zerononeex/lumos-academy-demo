// Open Line Jumps 1.3.0: the 1.2.0 game on kit 1.5.0 (its world: scene behind the board, painted tile); same items, responses and checker.
// Open Line Jumps 1.2.0: the 1.1.0 game on the kit 1.4.0 stylesheet (the Lumos look, DESIGN.md v2); same items, responses and checker.
// Open Line Jumps 1.1.0: the 1.0.0 game on kit 1.3.0 (the game-feel layer: instant press feedback, Watch badge, sounds, goal line,
// drawn chrome; see DESIGN.md and docs/GAME_FEEL_REVIEW.md). Same items, same responses, same checker as 1.0.0.
// Open Line Jumps 1.0.0 (Grades 2–3) on kit 1.1.0 + the 1.2.0 layouts: add and subtract to 100, then to 1000, on an
// open number line. The child picks where to start and the size of every jump (tens and ones, or hundreds, tens and
// ones); the kit's jump line draws the arcs and walks them. The marks fade stage by stage: an open line, landmark ticks
// (tens, or hundreds), a partly marked line, then the jumps written as number sentences only. A jump past the answer
// shows its overhang; a miss replays the jumps: where did we land? The server decides every answer and names the
// strategy (counting on, bridging a landmark, compensating …); this file only presents. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const sign = (p) => (p < 0 ? `− ${-p}` : `+ ${p}`);
  const sum = (ps) => ps.reduce((s, p) => s + p, 0);
  const STRATEGY = {
    bridge_ten: "You bridged through a landmark!", compensating: "You went past and came back. That's compensating!",
    tens_then_ones: "Big jumps first, then small ones!", counting_on: "You counted on.", one_jump: "One big jump!",
    doubles: "You used a double!", decomposing: "You broke the number into parts!",
  };

  function jumps(item, area, api) {
    const big = item.max >= 1000, step = big ? 100 : 10, add = item.by > 0, b = Math.abs(item.by), stage = item.stage;
    const landmark = (from, d) => (d > 0 ? Math.ceil((from + 1) / step) * step : Math.floor((from - 1) / step) * step);
    let start = null, parts = [], fact = { from: item.from, by: item.by }, line = null, ghost = [];
    const holder = h("div", { class: "holder" }), record = h("ol", { class: `record${stage === "line_symbolic" ? "" : " dom"}`, "aria-label": "Your jumps" });
    const card = h("p", { class: "card" });
    const starts = h("div", { class: "starts", role: "group", "aria-label": "Start at" });
    const planker = h("div", { class: "planker" });
    const sizes = big ? [K.stepper(planker, { label: "Hundreds", min: 0, max: 9, value: 1 })] : [];
    sizes.push(K.stepper(planker, { label: "Tens", min: 0, max: 9, value: big ? 0 : 1 }), K.stepper(planker, { label: "Ones", min: 0, max: 9, value: 0 }));
    const size = () => sizes.reduce((s, st) => s * 10 + st.value, 0);
    planker.append(h("div", { class: "jumpbtns" }, h("button", { type: "button", "data-jump": "1", onclick: () => jump(1) }, "➡ Jump forward"),
      h("button", { type: "button", "data-jump": "-1", class: "secondary", onclick: () => jump(-1) }, "⬅ Jump back")));
    area.append(card, holder, starts, planker, record);
    const end = () => start + sum(parts);
    const landings = () => parts.map((_, i) => start + sum(parts.slice(0, i + 1)));

    /** The answer this start leads to (addition may start from either number; take-away only from the first). */
    const goal = (s) => (s === fact.from ? fact.from + fact.by : add ? s + fact.from : s);
    function board() { // the line for the chosen start, with this stage's marks
      holder.replaceChildren();
      if (start === null || stage === "line_symbolic") { line = null; return; }
      const to = goal(start), ends = [start, to, ...landings()];
      const lo = Math.max(0, Math.floor((Math.min(...ends) - step / 10) / step) * step), hi = Math.min(item.max, Math.ceil((Math.max(...ends) + step / 10) / step) * step);
      const marks = [];
      for (let v = lo; v <= hi; v += step) marks.push(v);
      const labels = stage === "line_open" ? [start] : stage === "line_landmarks" ? [start, ...marks] : [start, landmark(start, Math.sign(to - start) || 1)];
      line = K.jumpLine(holder, { lo, hi, from: start, to, labels: [...new Set(labels)].filter((v) => v >= lo && v <= hi), label: "The number line" });
      const pic = holder.querySelector("svg"), x = (v) => 40 + ((v - lo) / (hi - lo)) * 920;
      if (stage === "line_landmarks") pic.append(...marks.map((v) => svg("line", { class: "mark", x1: x(v), y1: 140, x2: x(v), y2: 180 })));
      pic.append(svg("g", { class: "landings" }));
      line.window = { lo, hi, x, labels };
    }
    function draw() {
      if (!line) board();
      card.textContent = `${fact.from} ${sign(fact.by)}`;
      starts.replaceChildren(...[fact.from, b].map((v) => h("button", { type: "button", class: "secondary", "data-start": v, "aria-pressed": String(start === v), onclick: () => choose(v) }, `Start at ${v}`)));
      if (line) {
        line.planks(parts); line.ghost(ghost);
        const { x, labels } = line.window, g = holder.querySelector(".landings");
        // Every landing is written on the open line; the partly marked line leaves them for the child.
        g.replaceChildren(...(stage === "line_partial" ? [] : landings().filter((v) => !labels.includes(v))).map((v) => { const t = svg("text", { x: x(v), y: 196, "text-anchor": "middle" }); t.textContent = v; return t; }));
      }
      record.replaceChildren(...(start === null ? [h("li", {}, "Pick where to start.")] : parts.length
        ? parts.map((p, i) => h("li", {}, `${landings()[i] - p} ${sign(p)} = ${landings()[i]}`)) : [h("li", {}, `Start at ${start}. No jumps yet.`)]));
      api.refresh();
    }
    function choose(v) { if (start === v) return; start = v; parts = []; ghost = []; line = null; draw(); api.say(`Start at ${v}.`); api.changed(); }
    function jump(d) {
      if (start === null) return api.say("First pick where to start.");
      const n = size();
      if (!n) return api.say("Make the jump bigger than 0.");
      if (parts.length >= 8) return api.say("That's a lot of jumps. Check, or undo some.");
      if (end() + d * n < 0 || end() + d * n > item.max) return api.say("That jump goes off the line.");
      parts.push(d * n); ghost = [];
      if (line && (end() < line.window.lo || end() > line.window.hi)) line = null; // the line grows to show the landing
      draw(); api.say(`${sign(d * n)}. ${end()}.`); api.changed();
    }

    const ctl = {
      begin(retry) { if (!retry) api.prompt(`${fact.from} ${add ? "plus" : "take away"} ${b}. Pick a start, then jump.`, "🦘"); },
      ready: () => start !== null && parts.length > 0,
      response: () => ({ start, parts: parts.slice() }),
      state: () => ({ start, parts: parts.slice() }),
      restore(s) { start = s.start ?? null; parts = (s.parts || []).slice(0, 8); ghost = []; line = null; draw(); },
      async model() { // a neighbouring fact (never this answer): to the landmark first, then the rest
        const d = Math.sign(item.by), by = b > 2 ? item.by - d : item.by + d;
        fact = { from: item.from, by }; start = item.from; parts = []; line = null; draw();
        const mark = landmark(item.from, d), first = mark - item.from;
        api.say(`Watch me. ${item.from} ${d > 0 ? "plus" : "take away"} ${Math.abs(by)}. I start at ${item.from}.`); await wait(3000);
        if (Math.abs(first) < Math.abs(by)) { parts = [first]; draw(); api.say(`First I jump to ${mark}: ${sign(first)}.`); await wait(3000); }
        parts.push(by - sum(parts)); draw(); api.say(`Then the rest: ${sign(parts[parts.length - 1])}.`); await wait(2800);
        if (line) await line.walk(api.say);
        api.say(`We landed on ${item.from + by}. Now it's your turn.`); await wait(3000);
        fact = { from: item.from, by: item.by }; start = null; parts = []; line = null; draw();
      },
      async help(level, fb) {
        // Replay the jumps first: where did we land?
        api.say("Where did we land?"); await wait(1200);
        if (line) await line.walk(api.say); else for (const v of landings()) { api.say(String(v)); await wait(900); }
        api.say(fb.feedback || "Look at where the jumps landed."); await wait(2800);
        if (fb.misconception === "wrong_start") { start = null; parts = []; line = null; }
        else if (fb.misconception === "overshoot") { // the overhang stays in view, then that jump is undone for the child
          const last = parts.length - 1, over = (end() - goal(start)) * Math.sign(fact.by);
          if (over > 0 && last >= 0) { parts.pop(); draw(); api.say(`That jump went ${over} too far, so it comes off. Try a smaller one.`); await wait(2600); }
        } else if (fb.misconception !== "short" || level >= 2) parts = [];
        if (line) line.reset();
        if (level >= 2) { // partial model: the first jump, to the next landmark, drawn dashed
          if (start === null) { start = fact.from; parts = []; line = null; }
          const d = Math.sign(fact.by), mark = landmark(end(), d), first = mark - end();
          if (Math.abs(first) < Math.abs(goal(start) - end())) { ghost = [...parts, first]; api.say(`Try a jump to ${mark} first: ${sign(first)}.`); }
        }
        draw();
        api.prompt(`Try again: ${fact.from} ${add ? "plus" : "take away"} ${b}.`, "🦘");
      },
      async worked(sol) {
        start = sol.start; parts = []; ghost = []; line = null; draw();
        for (const p of sol.parts) { parts.push(p); draw(); api.say(`${end() - p} ${sign(p)} = ${end()}.`); await wait(2600); }
        if (line) await line.walk(api.say);
        api.say(`${fact.from} ${sign(fact.by)} = ${fact.from + fact.by}.`); await wait(2500);
      },
      async success(fb) {
        if (line) await line.walk(api.say);
        const via = landings().slice(0, -1).find((v) => v % step === 0) ?? landings().slice(0, -1).find((v) => v % 10 === 0);
        const path = `${parts.length} jump${parts.length > 1 ? "s" : ""}${via !== undefined ? ` — you bridged through ${via}` : ""}.`;
        api.say(`${path} ${via === undefined ? STRATEGY[fb.strategy] || "" : ""}`);
        api.feedback(`Yes! ${fact.from} ${sign(fact.by)} = ${fact.from + fact.by}. ${path}`, "good");
        await wait(3000);
      },
    };
    draw();
    return ctl;
  }

  K.run({
    goal: "Jump along the line to find the answer.",
    title: "Open Line Jumps",
    closure: "All done! You made great jumps today.",
    stages: {
      line_open: { name: "Open line" }, line_landmarks: { name: "Landmarks" },
      line_partial: { name: "Partly marked line" }, line_symbolic: { name: "Write the jumps" },
    },
    praise: (item) => `Yes! ${item.from} ${sign(item.by)} = ${item.from + item.by}.`,
    mount: jumps,
  });
})();
