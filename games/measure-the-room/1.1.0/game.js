// Measure the Room 1.1.0: the 1.0.0 game on kit 1.3.0 (the game-feel layer: instant press feedback, Watch badge, sounds, goal line,
// drawn chrome; see DESIGN.md and docs/GAME_FEEL_REVIEW.md). Same items, same responses, same checker as 1.0.0.
// Measure the Room 1.0.0 (K–3) on kit 1.1.0 + the 1.2.0 layouts: compare and order things by length (lining up the
// starts is the move that makes it fair); measure by laying units end to end, cubes or paper clips, then metre sticks,
// with every gap and overlap shown, because a measurement counts only when the units touch, start to end; read a
// centimetre ruler that does not always start at 0; walk the perimeter of a regular shape. Pointer: tap the track to put
// a unit down; buttons: move the next unit along, then put it down. The server decides every answer; this file only
// presents. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const THINGS = [["pencil", "✏️", "#e8b23a"], ["ribbon", "🎀", "#d9577e"], ["book", "📘", "#3b7dd8"], ["crayon", "🖍️", "#e8892b"], ["spoon", "🥄", "#9aa3ad"], ["shoe", "👟", "#7fb27b"]];
  const BIG = [["rug", "🟫", "#b5651d"], ["board", "🪵", "#c9a26b"], ["table", "🪑", "#8d6e63"]]; // measured in metre sticks
  const UNITS = { cube: ["cube", "cubes"], clip: ["paper clip", "paper clips"], stick: ["metre stick", "metre sticks"] };
  const ORD = ["shortest", "middle", "longest"];
  const bar = (x, y, w, colour, name, cls = "thing") => {
    const g = svg("g", { class: cls }), t = svg("text", { x: x + 12, y: y + 27 });
    t.textContent = name;
    g.append(svg("rect", { x, y, width: w, height: 40, rx: 10, fill: colour }), t);
    return g;
  };

  // ---------------------------------------------------------------- Which is longer? Shortest to longest
  function compare(item, area, api) {
    const U = 40, X0 = 60, things = item.things.map((k) => THINGS[k]);
    let order = [], aligned = false, pulse = null;
    const pic = svg("svg", { viewBox: `0 0 ${X0 + 17 * U} 230`, class: "visual room", "aria-hidden": "true" });
    const said = h("p", { class: "dom roomtext", "aria-live": "polite" });
    const pick = h("div", { class: "picks", role: "group", "aria-label": "Tap them from shortest to longest" },
      ...things.map(([name, icon], i) => h("button", { type: "button", "data-i": i, class: "secondary", onclick: () => tap(i) }, `${icon} ${name}`)));
    const line = h("button", { type: "button", "data-act": "line", onclick: lineUp }, "📏 Line them up");
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Things in the room"), pic, said), h("div", { class: "side" }, line, pick));
    function draw() {
      pic.replaceChildren(svg("line", { class: "startline", x1: X0, y1: 4, x2: X0, y2: 226 }),
        ...things.map(([name, icon, colour], i) => {
          const g = bar(X0 + (aligned ? 0 : item.offsets[i] * U), 10 + i * 72, item.lengths[i] * U, colour, `${icon} ${name}`, `thing${pulse === i ? " pulse" : ""}`);
          return g;
        }));
      line.disabled = aligned;
      for (const b of pick.children) { // each button says its place in the order once it has one
        const i = Number(b.dataset.i), k = order.indexOf(i);
        b.setAttribute("aria-pressed", String(k >= 0));
        b.textContent = `${k >= 0 ? `${k + 1}. ` : ""}${things[i][1]} ${things[i][0]}`;
      }
      said.textContent = `${things.map(([name], i) => `The ${name} starts ${aligned || !item.offsets[i] ? "at the line" : `${item.offsets[i]} squares after the line`}`).join(". ")}.`;
      api.refresh();
    }
    function tap(i) {
      if (order.includes(i)) order = order.slice(0, order.indexOf(i)); // tap again to take it (and the ones after) back
      else if (order.length < 3) order.push(i);
      api.say(order.includes(i) ? `${ORD[order.indexOf(i)]}: ${things[i][0]}` : `${things[i][0]}: back`); draw(); api.changed();
    }
    function lineUp() { if (aligned) return; aligned = true; api.say("Lined up. Now every start is at the line."); draw(); api.changed(); }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Tap them from shortest to longest.", "📏"); },
      ready: () => order.length === 3,
      response: () => ({ order: order.slice(), aligned }),
      state: () => ({ order: order.slice(), aligned }),
      restore(s) { order = (s.order || []).slice(); aligned = !!s.aligned; pulse = null; draw(); },
      async model() {
        api.say("Watch me. The ends can trick you, so first I line up the starts."); await wait(3000);
        aligned = true; draw(); await wait(1800);
        const by = [0, 1, 2].sort((a, b) => item.lengths[b] - item.lengths[a]); // longest first: never this answer's order
        for (const i of by) { pulse = i; draw(); api.say(`The ${things[i][0]}.`); await wait(1300); }
        api.say("That was longest to shortest. Your turn: shortest to longest."); await wait(3000);
        aligned = false; pulse = null; draw();
      },
      async help(level, fb) {
        api.say(fb.feedback || "Let's look again."); await wait(2400);
        if (!aligned) { aligned = true; draw(); api.say("Lined up, the ends tell the truth."); await wait(2400); }
        order = [];
        if (level >= 2) { const s = [0, 1, 2].sort((a, b) => item.lengths[a] - item.lengths[b])[0]; pulse = s; order = [s]; draw(); api.say(`The ${things[s][0]} is the shortest. Which is next?`); await wait(2600); }
        pulse = null; draw();
        api.prompt("Try again: shortest to longest.", "📏");
      },
      async worked(sol) { aligned = true; order = []; draw(); for (const i of sol.order) { order.push(i); pulse = i; draw(); api.say(things[i][0]); await wait(1300); } pulse = null; draw(); },
      async success() { api.say(`Shortest to longest: ${order.map((i) => things[i][0]).join(", ")}.`); await wait(2400); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Lay units end to end
  function units(item, area, api) {
    const n = item.n, kind = item.unit, [one, many] = UNITS[kind], thing = (kind === "stick" ? BIG : THINGS)[item.things[0]];
    const span = n + 3, U = Math.min(80, 880 / span), X0 = 40, Q = U / 4, Y = 40, H = { cube: U - 2, clip: 22, stick: 18 }[kind];
    let laid = [], at = 0, pulse = false;
    const pic = svg("svg", { viewBox: `0 0 ${X0 * 2 + span * U} 190`, class: "visual room track", "aria-hidden": "true" });
    pic.addEventListener("click", (e) => { // a tap on the track puts a unit down there, to the nearest quarter
      const p = pic.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const x = p.matrixTransform(pic.getScreenCTM().inverse()).x;
      put(Math.max(0, Math.min((span - 1) * 4, Math.round((x - X0 - U / 2) / Q))));
    });
    const said = h("p", { class: "dom roomtext", "aria-live": "polite" });
    const nudge = h("div", { class: "nudge", role: "group", "aria-label": `The next ${one}` },
      h("button", { type: "button", "data-act": "back", class: "secondary", "aria-label": `Move the ${one} back a little`, onclick: () => move(-1) }, "◀"),
      h("button", { type: "button", "data-act": "put", onclick: () => put(at) }, `⬇ Put a ${one} down`),
      h("button", { type: "button", "data-act": "on", class: "secondary", "aria-label": `Move the ${one} on a little`, onclick: () => move(1) }, "▶"));
    area.append(h("figure", { class: "manip wide" }, h("figcaption", {}, `How many ${many} long is the ${thing[0]}?`), pic, said), nudge);
    const sorted = () => [...laid].sort((a, b) => a - b);
    function unit(q, cls) {
      const x = X0 + q * Q;
      return svg("rect", { class: `unit ${kind} ${cls}`, x: x + (kind === "clip" ? 3 : 1), y: Y + 54, width: U - (kind === "clip" ? 6 : 2), height: H, rx: kind === "clip" ? 11 : 0 });
    }
    function draw() {
      const kids = [svg("line", { class: "startline", x1: X0, y1: 8, x2: X0, y2: 182 }), bar(X0, Y - 34, n * U, thing[2], `${thing[1]} ${thing[0]}`)];
      kids.push(svg("line", { class: "endline", x1: X0 + n * U, y1: 8, x2: X0 + n * U, y2: 182 }));
      const s = sorted();
      s.forEach((q, i) => { // the gap before each unit, and any overlap with the one before
        const prev = i ? s[i - 1] + 4 : 0;
        if (q > prev) kids.push(svg("rect", { class: `gapmark${pulse ? " pulse" : ""}`, x: X0 + prev * Q, y: Y + 50, width: (q - prev) * Q, height: H + 8 }));
      });
      kids.push(...s.map((q, i) => unit(q, i % 2 ? "b" : "a")));
      s.forEach((q, i) => { if (i && q < s[i - 1] + 4) kids.push(svg("rect", { class: `overlap${pulse ? " pulse" : ""}`, x: X0 + q * Q, y: Y + 50, width: (s[i - 1] + 4 - q) * Q, height: H + 8 })); });
      kids.push(unit(at, "next"));
      pic.replaceChildren(...kids);
      const gaps = s.filter((q, i) => q > (i ? s[i - 1] + 4 : 0)).length, overlaps = s.filter((q, i) => i && q < s[i - 1] + 4).length;
      said.textContent = `${laid.length ? `${laid.length} ${laid.length === 1 ? one : many} down` : `No ${many} yet`}. ${gaps ? `Gaps: ${gaps}. ` : ""}${overlaps ? `Overlaps: ${overlaps}. ` : ""}`
        + `The next ${one} is at ${at / 4} ${at === 4 ? one : many} from the start${laid.includes(at) ? ", on top of one" : ""}.`;
      api.refresh();
    }
    function move(d) { at = Math.max(0, Math.min((span - 1) * 4, at + d)); draw(); }
    function put(q) {
      if (laid.length >= n + 4) return api.say(`That's a lot of ${many}. Check, or undo some.`);
      laid.push(q); at = Math.min((span - 1) * 4, q); api.say(`${laid.length}.`); draw(); api.changed();
    }
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`Measure the ${thing[0]} with ${many}. Lay them end to end.`, "📐"); },
      ready: () => laid.length > 0,
      response: () => ({ units: sorted() }),
      state: () => ({ laid: laid.slice(), at }),
      restore(s) { laid = (s.laid || []).slice(); at = s.at || 0; pulse = false; draw(); },
      async model() { // end to end on a shorter length, counting as each goes down
        api.say(`Watch me. Each ${one} touches the last one: no gaps, no overlaps.`); await wait(2800);
        for (let i = 0; i < Math.min(2, n - 1); i++) { laid.push(i * 4); at = i * 4; draw(); api.say(`${i + 1}.`); await wait(1300); }
        api.say("Now you finish it."); await wait(1800);
        laid = []; at = 0; draw();
      },
      async help(level, fb) {
        pulse = true; draw(); api.say(fb.feedback || "Look at the units."); await wait(2800); pulse = false;
        if (fb.misconception === "short" && level < 2) { at = sorted()[laid.length - 1] + 4; } // keep them, and carry on from the end
        else { laid = []; at = 0; }
        if (level >= 2) { // partial model: the first two laid end to end for the child
          laid = [0, 4].slice(0, Math.min(2, n - 1)); at = laid.length * 4;
          api.say(`Like this: each ${one} starts where the last one ends.`); await wait(2600);
        }
        draw();
        api.prompt(`Try again. Lay the ${many} end to end.`, "📐");
      },
      async worked(sol) { laid = []; for (const q of sol.units) { laid.push(q); at = q; draw(); api.say(`${laid.length}.`); await wait(900); } await wait(800); },
      async success() { api.say(`The ${thing[0]} is ${n} ${many} long.`); await wait(2400); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Read the ruler; walk the perimeter
  /** A number read with tens and ones steppers (answers to 99). */
  function reader(parent, onChange) {
    const box = h("div", { class: "picker" }), unit = h("span", { class: "cm" }, "cm");
    const t = K.stepper(box, { label: "Tens", min: 0, max: 9, value: 0, onChange }), o = K.stepper(box, { label: "Ones", min: 0, max: 9, value: 0, onChange });
    box.append(unit); parent.append(box);
    return { get value() { return t.value * 10 + o.value; }, set(v) { t.set(Math.floor(v / 10)); o.set(v % 10); } };
  }
  function ruler(item, area, api) {
    const L = Math.min(20, Math.ceil((item.from + item.n + 1) / 5) * 5), U = 840 / L, X0 = 30, thing = THINGS[item.things[0]]; // the ruler: 0 to L cm
    let read = null, pulse = false;
    const pic = svg("svg", { viewBox: `0 0 ${X0 * 2 + L * U} 170`, class: "visual room", "aria-hidden": "true" });
    const said = h("p", { class: "dom roomtext" }, `The ${thing[0]} starts at ${item.from} and ends at ${item.from + item.n} on the ruler.`);
    area.append(h("figure", { class: "manip wide" }, h("figcaption", {}, `How long is the ${thing[0]}?`), pic, said));
    const box = h("div", { class: "side" }), num = reader(box, () => { read = num.value; draw(); api.changed(); });
    area.append(box);
    function draw() {
      const kids = [bar(X0 + item.from * U, 18, item.n * U, thing[2], `${thing[1]} ${thing[0]}`), svg("rect", { class: "rulerbody", x: X0 - 14, y: 70, width: L * U + 28, height: 82, rx: 8 })];
      for (let v = 0; v <= L; v++) {
        const x = X0 + v * U, t = svg("text", { x, y: 140, "text-anchor": "middle" });
        t.textContent = v;
        kids.push(svg("line", { class: "cmtick", x1: x, y1: 70, x2: x, y2: v % 5 ? 92 : 104 }), t);
      }
      if (pulse) for (let v = item.from; v < item.from + item.n; v++) kids.push(svg("rect", { class: "space pulse", x: X0 + v * U + 2, y: 72, width: U - 4, height: 16 }));
      pic.replaceChildren(...kids);
      api.refresh();
    }
    return {
      begin(retry) { if (!retry) api.prompt(`How many centimetres long is the ${thing[0]}?`, "📏"); },
      ready: () => read !== null,
      response: () => ({ read }),
      state: () => ({ read }),
      restore(s) { read = s.read ?? null; num.set(read ?? 0); pulse = false; draw(); },
      async model() {
        api.say("Watch me. I count the centimetre spaces from where it starts to where it ends, not the marks."); await wait(3600);
        pulse = true; draw(); await wait(2400); pulse = false; draw();
        api.say("Now you count."); await wait(1500);
      },
      async help(level, fb) {
        api.say(fb.feedback || "Count the spaces."); await wait(2600);
        if (level >= 2) { pulse = true; draw(); api.say(`It starts at ${item.from}. Count each space it covers.`); await wait(3000); pulse = false; }
        draw(); api.prompt("Try again. How many centimetres?", "📏");
      },
      async worked(sol) { pulse = true; draw(); for (let k = 1; k <= item.n; k++) { api.say(String(k)); await wait(500); } num.set(sol.read); read = sol.read; pulse = false; draw(); api.say(`${sol.read} centimetres.`); await wait(1800); },
      async success() { api.say(`Yes! ${read} centimetres.`); await wait(2000); },
    };
  }
  function perimeter(item, area, api) {
    const k = item.sides, n = item.n, R = 110, cx = 160, cy = 140;
    const V = Array.from({ length: k + 1 }, (_, i) => [cx + R * Math.sin((2 * Math.PI * i) / k), cy - R * Math.cos((2 * Math.PI * i) / k)]);
    let read = null, walked = -1;
    const pic = svg("svg", { viewBox: "0 0 320 280", class: "visual room shape", "aria-hidden": "true" });
    const NAME = { 3: "triangle", 4: "square", 5: "pentagon", 6: "hexagon" }[k];
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, `A ${NAME}: every side is ${n} cm`), pic, h("p", { class: "dom roomtext" }, `A ${NAME} with ${k} sides, each ${n} centimetres long.`)));
    const box = h("div", { class: "side" }), num = reader(box, () => { read = num.value; draw(); api.changed(); });
    area.append(box);
    function draw() {
      const kids = [svg("path", { class: "poly", d: `M${V.slice(0, k).map((p) => p.join(" ")).join(" L")} Z` })];
      V.slice(0, k).forEach((p, i) => {
        const [x2, y2] = V[i + 1], mx = (p[0] + x2) / 2, my = (p[1] + y2) / 2, t = svg("text", { x: cx + (mx - cx) * 1.28, y: cy + (my - cy) * 1.28 + 7, "text-anchor": "middle" });
        t.textContent = i <= walked ? `${(i + 1) * n}` : `${n} cm`;
        if (i <= walked) kids.push(svg("line", { class: "walked", x1: p[0], y1: p[1], x2, y2 }));
        kids.push(t);
      });
      if (walked >= 0) { const [x, y] = V[Math.min(walked + 1, k)]; kids.push(svg("circle", { class: "walker", cx: x, cy: y, r: 11 })); }
      pic.replaceChildren(...kids);
      api.refresh();
    }
    async function walk(say) { for (walked = 0; walked < k; walked++) { draw(); say && api.say(`${(walked + 1) * n}`); await wait(900); } walked = k - 1; draw(); }
    return {
      begin(retry) { if (!retry) api.prompt(`How far is it all the way around the ${NAME}?`, "🚶"); },
      ready: () => read !== null,
      response: () => ({ read }),
      state: () => ({ read }),
      restore(s) { read = s.read ?? null; num.set(read ?? 0); walked = -1; draw(); },
      async model() {
        api.say("Watch me walk around a shape. Every side counts, all the way back to the start."); await wait(3200);
        await walk(true); api.say("Now you find the distance around."); await wait(1600); walked = -1; draw();
      },
      async help(level, fb) {
        api.say(fb.feedback || "Walk all the way around."); await wait(2600);
        if (level >= 2) await walk(true);
        walked = -1; draw(); api.prompt("Try again. How far all the way around?", "🚶");
      },
      async worked(sol) { await walk(true); num.set(sol.read); read = sol.read; api.say(`${k} sides of ${n} cm: ${sol.read} cm.`); await wait(2200); },
      async success() { await walk(false); api.say(`Yes! ${read} centimetres all the way around.`); await wait(2000); },
    };
  }

  K.run({
    goal: "Find out how long things are.",
    title: "Measure the Room",
    closure: "All done! You measured lots of things today.",
    stages: {
      measure_compare: { name: "Shortest to longest" }, measure_units: { name: "Units end to end" },
      measure_ruler: { name: "Read the ruler" }, measure_perimeter: { name: "All the way around" },
    },
    praise: () => "Yes! Well measured.",
    mount: (item, area, api) => ({ measure_compare: compare, measure_units: units, measure_ruler: ruler, measure_perimeter: perimeter })[item.stage](item, area, api),
  });
})();
