// Balance Scale 1.7.0 (feedback round 2): the 1.6.0 game on kit 1.7.0, with the generated golden scale (Treasure Island
// sheet 02) as the rig, cut into its moving parts (public/games/art/balance-scale: post, beam, pan-left, pan-right). The
// beam turns about its hub by the same tilt, the pans hang from the beam's rings and stay upright by the same
// counter-translation, and everything on a pan rides it as before (the pans' contents keep their places above the pan's
// rim). The post is drawn in front of the beam, as in the picture. Same items, responses, checker, stages and words.
// Balance Scale 1.6.0 (art step, docs/art-inventory.md section 12): the 1.5.0 game dressed in the Treasure Island art
// (art-intake/treasure-island-weigh-in). The pans hold pictures instead of plain tiles: treasure for the child's tiles,
// brass bells for weights, a balloon, the chest for the box (shut while held, open once let go), each with the same
// number on it; the rig is restyled gold; the captain stands beside the scale and changes pose with the game. Same
// items, responses, checker, sizes, positions and words.
// Balance Scale 1.5.0 (art step, docs/art-inventory.md): the 1.4.0 game; the mystery things on the pans are their
// pictures (B3-T3) instead of drawn shapes, at the same place and size. Same items, responses and checker.
// Balance Scale 1.4.0 (Step 5 Batch 3): the 1.3.0 game plus "Which is heaviest?": three or four mystery things and the
// weighings already done (each one can be weighed again, free, as often as the child likes). Grade 2 picks the heaviest;
// Grade 3 puts all of them in order, lightest first. A level scale is information too (they weigh the same). The help
// says the weighings aloud as a chain. Untimed. Art drop-in: docs/art-inventory.md section 4, B3-T3 (the six things);
// until then, plain drawn shapes.
// Balance Scale 1.3.0: the 1.2.0 game on kit 1.5.0 (its world: scene behind the board, painted tile); same items, responses and checker.
// Balance Scale 1.2.0: the 1.1.0 game on the kit 1.4.0 stylesheet (the Lumos look, DESIGN.md v2); same items, responses and checker.
// Balance Scale 1.1.0 (K–3): the 1.0.0 game on kit 1.3.0 with its presentation rebuilt (docs/GAME_FEEL_REVIEW.md,
// Balance Scale). Equality as balance: a two-pan scale the child loads with value tiles. The tilt IS the feedback: every
// tap drops a tile on the child's pan and the beam swings at once (a short spring), level glows. Tiles are picked from a
// tray of big tiles under the scale (tap a tile: one more on the pan; − takes one off), not from a list of counters.
// Stages: make both sides match (K–1) → match a total (a weight, two weights, or a weight and a balloon that lifts its
// side: take away) → tiles of different values (counting tiles never balances, only value does) → same value on both
// sides (4 + 3 = □ + 2: predict, then the scale is let go) → Grade 3: the box in any place. Same items, same responses,
// same checker as 1.0.0: the server decides every answer; this file only presents. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const SIZE = { 1: 42, 2: 50, 5: 60, 10: 70 }; // a tile's size grows with its value (and every tile shows its number)
  const PIECE = { 1: "coin", 2: "emerald", 5: "pearls", 10: "gold-bar" }; // the child's tiles, by value
  /** One picture from public/games/art/balance-scale, filling the box a plain shape filled before. */
  const art = (name, x, y, width, height) => svg("image", { href: `../../art/balance-scale/${name}.webp`, x, y, width, height });
  const sum = (v) => v.reduce((s, x) => s + x, 0);
  /** One side's value with the box worth `u` (a balloon is negative; a `minus` box is a balloon too). */
  const value = (side, u, minus) => sum(side.map((v) => (v === null ? (minus ? -u : u) : v)));
  const words = (v, minus, box) => (v === null ? `${minus ? "a balloon box lifting" : "the box"} ${box || "?"}` : v < 0 ? `a balloon lifting ${-v}` : String(v));
  /** "4 + 3", "□ − 4", "12 − □" */
  const side = (v, box, minus) => v.map((n, i) => (n === null ? `${i ? (minus ? " − " : " + ") : ""}${box ?? "□"}` : `${i ? (n < 0 ? " − " : " + ") : ""}${Math.abs(n)}`)).join("");

  // 1.7.0: where the parts sit (viewBox units; the sheet scaled by 0.64). HUB: the beam's pivot; ARM, DROP: from the hub
  // to the ring a pan hangs from (along the beam, and below it); RIM: from the ring down to the pan's rim, where its
  // contents stand (1.6.0 stood them 92 below the hook, so they move down by RIM - 92).
  const HUB = [350, 50], ARM = 222.1, DROP = 68.5, RIM = 196;
  function scale(item, area, api) {
    const loads = !item.stage.match(/relational|unknown/), g3 = item.skill.startsWith("g3-");
    let spec = item, counts = [], box = 0, held = !loads, showTotals = item.mode === "guided", pulse = null;
    let pic, fig, beam, pans, props, said, steppers = [], eq, cheer = false;

    const pan = () => spec.palette.flatMap((p, i) => Array(counts[i] || 0).fill(p)).sort((a, b) => b - a);
    const left = () => spec.left, right = () => (loads ? pan() : spec.right);
    const totals = () => [value(left(), box, spec.minus), value(right(), box, spec.minus)];

    function board(s) {
      spec = s;
      area.replaceChildren();
      if (!loads) {
        eq = h("p", { class: "eq" });
        area.append(eq);
      }
      pic = svg("svg", { viewBox: "-30 -22 760 456", class: "visual scale", "aria-hidden": "true" }); // the pans swing out past 0 and 700
      beam = svg("g", { class: "beam" });
      beam.append(art("beam", 90.2, 30.8, 519.7, 87.7));
      pans = [svg("g", { class: "pan" }), svg("g", { class: "pan" })];
      props = svg("g");
      const post = art("post", 219.4, -19.8, 261.1, 436.5);
      post.setAttribute("class", "post");
      pic.append(props, beam, post, ...pans); // the post in front of the beam's middle, as in the picture
      said = h("p", { class: "dom scaletext", "aria-live": "polite" });
      fig = h("figure", { class: "manip wide" }, h("figcaption", {}, loads ? "The scale: your side is the right" : "The scale"), pic, said);
      area.append(fig);
      const controls = h("div", { class: `loads${loads ? " tiletray" : ""}` });
      area.append(controls);
      steppers = loads
        ? spec.palette.map((p, i) => K.stepper(controls, { label: spec.palette.length > 1 ? `Tiles of ${p}` : "Tiles", min: 0, max: 12, value: counts[i] || 0,
          more: h("span", { class: `traytile v${p}` }, String(p)),
          onChange: (v) => { const added = v > (counts[i] || 0) ? p : null; counts[i] = v; draw(added); api.say(String(p)); api.changed(); } }))
        : g3 ? [K.stepper(controls, { label: "Box tens", min: 0, max: 9, value: Math.floor(box / 10), onChange: (v) => setBox(v * 10 + (box % 10)) }),
          K.stepper(controls, { label: "Box ones", min: 0, max: 9, value: box % 10, onChange: (v) => setBox(box - (box % 10) + v) })]
          : [K.stepper(controls, { label: "The box", min: 0, max: 20, value: box, onChange: setBox })];
      draw();
    }
    function setBox(v) { box = v; draw(); api.changed(); }

    /** Tiles on one pan, sized by value, rows from the tray upward; balloons above. Local coordinates: hook at 0,0. */
    function drawPan(g, tiles, total, weights, added, which) {
      const kids = []; // 1.7.0: the pan's picture (chains and pan, hung from its ring at 0,0), then its contents on its rim
      const panArt = art(which, -115.8, 0, 231.7, 268.2);
      panArt.setAttribute("class", "panart");
      let x = -112, y = 92, row = 0, b = 0;
      for (const v of tiles) {
        if (v !== null && v < 0 || (v === null && spec.minus)) { // a balloon (or the box as a balloon): it lifts its side
          const bx = -70 + 140 * (b++ % 2), t = svg("text", { x: bx, y: -48, "text-anchor": "middle" });
          t.textContent = `−${v === null ? box || "?" : -v}`;
          const ball = svg("g", { class: `balloon${v === null ? " box" : ""}` });
          ball.append(svg("line", { x1: bx, y1: 36, x2: bx, y2: 92 }), art("balloon", bx - 26, -84, 52, 120), ...(v === null ? [svg("circle", { cx: bx, cy: -56, r: 30 })] : []), t);
          kids.push(ball);
          continue;
        }
        const s = v === null ? 60 : SIZE[v] || 76;
        if (x + s > 112) { x = -112; y -= row + 4; row = 0; }
        const drop = v === added; // one tile of the value just put on drops in
        if (drop) added = null;
        const tile = svg("g", { class: `tile${v === null ? " box" : weights ? " weight" : ""}${drop ? " drop" : ""}` });
        const t = svg("text", { x: x + s / 2, y: y - s / 2 + 8, "text-anchor": "middle" });
        t.textContent = v === null ? (box ? String(box) : "?") : String(v);
        const look = v === null ? `chest-${held ? "closed" : "open"}` : weights ? `weight-${v < 2 ? 1 : v < 5 ? 2 : v < 10 ? 3 : 4}` : PIECE[v];
        tile.append(look ? art(look, x, y - s, s, s) : svg("rect", { x, y: y - s, width: s, height: s }), t); // any other value: a plain tile
        kids.push(tile);
        x += s + 4; row = Math.max(row, s);
      }
      if (total !== null) { const t = svg("text", { class: "total", x: 0, y: 132, "text-anchor": "middle" }); t.textContent = `= ${total}`; kids.push(t); }
      const on = svg("g", { transform: `translate(0 ${RIM - 92})` });
      on.append(...kids);
      g.replaceChildren(panArt, on);
    }

    /** Everything follows the tiles: the pans, the tilt (held level while predicting), the words, the equation. */
    /** `added`: the value of the tile just put on (it drops in). */
    function draw(added = null) { // the tilt: every tile moves the beam (at least 3°), nearly level is nearly flat
      const [L, R] = totals(), diff = R - L, deg = held || !diff ? 0 : Math.sign(diff) * Math.max(3, 12 * Math.abs(diff) / Math.max(L, R)), rad = (deg * Math.PI) / 180;
      beam.style.transformOrigin = `${HUB[0]}px ${HUB[1]}px`;
      beam.style.transform = `rotate(${deg}deg)`;
      [-1, 1].forEach((d, i) => { // each ring, turned with the beam about the hub; the pan hangs straight down from it
        pans[i].style.transform = `translate(${HUB[0] + d * ARM * Math.cos(rad) - DROP * Math.sin(rad)}px, ${HUB[1] + d * ARM * Math.sin(rad) + DROP * Math.cos(rad)}px)`;
      });
      // Totals on guided items only (and never for a side whose box is still a guess, held still).
      const total = (v) => (showTotals && !(held && v.includes(null)) ? value(v, box, spec.minus) : null);
      drawPan(pans[0], left(), total(left()), spec.stage === "balance_target", null, "pan-left");
      drawPan(pans[1], right(), total(right()), false, added, "pan-right");
      pans.forEach((p, i) => p.classList.toggle("pulse", pulse === i));
      pans[1].classList.toggle("mine", loads); // the child's side: its tray glows
      fig.dataset.pose = cheer ? "cheer" : pulse !== null ? "point" : held ? "think" : "wave"; // the captain beside the scale
      pic.classList.toggle("level", !held && diff === 0 && (loads ? pan().length > 0 : box > 0));
      props.replaceChildren(...(held ? [svg("rect", { class: "prop", x: 103, y: 372, width: 50, height: 46 }), svg("rect", { class: "prop", x: 547, y: 372, width: 50, height: 46 })] : []));
      const list = (v) => `${v.map((n) => words(n, spec.minus, box)).join(", ") || "nothing"}${loads ? ` (${v.length} tile${v.length === 1 ? "" : "s"})` : ""}`;
      said.textContent = `Left side: ${list(left())}. Right side: ${list(right())}. ${held ? "The scale is held still until you check."
        : diff === 0 ? "The scale is level." : `The scale tips down on the ${diff > 0 ? "right" : "left"}.`}${total(left()) !== null ? ` Left: ${L}.` : ""}${total(right()) !== null ? ` Right: ${R}.` : ""}`;
      if (eq) eq.replaceChildren(side(spec.left, box || null, spec.minus), h("span", { class: "equals" }, "="), side(spec.right, box || null, spec.minus),
        h("small", {}, "= means the same value"));
      steppers.forEach((st, i) => st.set(loads ? counts[i] || 0 : g3 ? (i ? box % 10 : Math.floor(box / 10)) : box));
      api.refresh();
    }

    async function release(say = true) {
      held = false; draw();
      await wait(900);
      const [L, R] = totals();
      if (say) api.say(L === R ? "Level!" : `It tips. This side is ${Math.abs(R - L)} ${R > L ? "more" : "less"}.`);
      await wait(1500);
    }
    /** Name the unit difference explicitly, and point at the side that needs to change. */
    function difference() {
      const [L, R] = totals(), d = R - L, n = loads ? pan().length : 0;
      pulse = 1; draw();
      if (loads && n === left().length && d) return `Both sides have ${n} tile${n === 1 ? "" : "s"}, but this side is ${Math.abs(d)} ${d > 0 ? "more" : "less"}.`;
      return d < 0 ? `This side needs ${-d} more.` : d > 0 ? `This side has ${d} too many.` : "Level!";
    }

    const ctl = {
      begin(retry) {
        if (retry) return;
        const text = { // one short line: the goal, then where to act
          balance_match: "Make it level. Tap tiles onto your side.",
          balance_target: "Make it level. Tap tiles onto your side.",
          balance_mixed: "Make it level. Look at each tile's number!",
          balance_relational: "Both sides have the same value. What goes in the box?",
          balance_unknown: "What number in the box makes it level?",
        }[item.stage];
        api.prompt(text, "");
      },
      ready: () => (loads ? pan().length > 0 && pan().length <= 12 : box > 0),
      response: () => (loads ? { pan: pan() } : { read: box }),
      state: () => (loads ? { counts: counts.slice() } : { box }),
      restore(s) { counts = (s.counts || []).slice(); box = s.box || 0; held = !loads; pulse = null; draw(); },
      async model() {
        // Same task type, neighbouring numbers (never this item's answer).
        showTotals = true;
        if (loads) {
          const l = item.left.slice(), last = l.length - 1;
          l[last] = l[last] > 1 ? l[last] - 1 : l[last] + 1;
          board({ ...item, left: l });
          api.say(`Watch me. This side is ${value(l, 0)}.`); await wait(2600);
          let rest = value(l, 0);
          for (const [i, p] of [...item.palette.entries()].reverse()) {
            while (rest >= p) { counts[i] = (counts[i] || 0) + 1; rest -= p; draw(); api.say(`A ${p}.`); await wait(1600); }
          }
          api.say(`Level! Both sides are ${value(l, 0)}. Not the same tiles, the same value. Now it's your turn.`); await wait(3500);
        } else {
          const r = item.right.slice(), k = r.findIndex((v) => v !== null && v > 1);
          const s = k >= 0 ? (r[k] -= 1, { ...item, right: r }) : { ...item, left: item.left.map((v) => (v !== null && v > 1 ? v + 1 : v)) };
          board(s);
          const u = boxOf(s);
          api.say(`Watch me. ${side(s.left, null, s.minus)} equals ${side(s.right, null, s.minus)}. Both sides must have the same value.`); await wait(3800);
          box = u; draw();
          api.say(`I think the box is ${u}. Let's let go.`); await wait(2200);
          await release(false);
          api.say(`Level! ${side(s.left, u, s.minus)} is the same value as ${side(s.right, u, s.minus)}. Now it's your turn.`); await wait(3500);
        }
        counts = []; box = 0; held = !loads; showTotals = item.mode === "guided";
        board(item);
      },
      async help(level, fb) {
        if (!loads) await release(false);
        api.say(`${fb.feedback ? `${fb.feedback} ` : ""}${difference()}`);
        await wait(3200);
        pulse = null;
        if (level >= 2) { // partial model: each side's value written under it
          showTotals = true;
          api.say(`This side is ${value(left(), box, spec.minus)} altogether.`);
        }
        held = !loads; draw();
        api.prompt(loads ? "Try again. Make it level." : "Try again. What goes in the box?", "");
      },
      async worked(sol) {
        showTotals = true;
        if (loads) {
          counts = [];
          draw();
          for (const p of sol.pan) { counts[spec.palette.indexOf(p)] = (counts[spec.palette.indexOf(p)] || 0) + 1; draw(); api.say(`A ${p}.`); await wait(1500); }
        } else { box = sol.read; draw(); await wait(1200); await release(false); }
        const [L] = totals();
        api.say(`Level. Both sides are ${L}.`); await wait(2500);
      },
      async success() {
        if (!loads) await release(false);
        cheer = true; fig.dataset.pose = "cheer"; // only the captain changes: the pans and words stay as they are
        const [L] = totals();
        api.say(loads ? `Level! Both sides are ${L}.` : `Level! ${side(spec.left, box, spec.minus)} is the same value as ${side(spec.right, box, spec.minus)}.`);
        api.feedback(loads ? `Yes! Both sides are ${L}.` : `Yes! ${side(spec.left, box, spec.minus)} = ${side(spec.right, box, spec.minus)}`, "good");
        await wait(2500);
      },
    };
    /** The box's value that levels the scale (for the demonstrator's own equation). */
    const boxOf = (s) => {
      const k = (s.left.includes(null) ? 1 : -1) * (s.minus ? -1 : 1);
      return -(value(s.left, 0) - value(s.right, 0)) / k;
    };
    board(item);
    return ctl;
  }

  // ---------------------------------------------------------------- Batch 3: which is heaviest?
  const THING = { pumpkin: "pumpkin", watermelon: "watermelon", "teddy bear": "teddy", "gift box": "gift", cabbage: "cabbage", "jar of honey": "honey" };
  /** One mystery thing (B3-T3 order), drawn at (x, y) about 56 px across. */
  const thing = (kind, x, y) => art(THING[kind], x - 30, y - 30, 60, 60);
  const the = (k) => `the ${k}`;
  /** A weighing in words: [i, j, 1] i is heavier; [i, j, 0] they balance. */
  const told = (kinds, [i, j, rel]) => (rel ? `${the(kinds[i])} is heavier than ${the(kinds[j])}` : `${the(kinds[i])} and ${the(kinds[j])} balance: they weigh the same`);
  /** The weighings in a chain: heaviest-side first, each one picking up where the last one ended where it can. */
  function chain(weighs) {
    const left = weighs.slice(), out = [];
    while (left.length) {
      const end = out.length ? out[out.length - 1][1] : null;
      let k = left.findIndex((w) => w[0] === end || (!w[2] && w[1] === end));
      if (k < 0) k = left.findIndex((w) => !left.some((v) => v[2] && v[1] === w[0])); // start where nothing is heavier
      const [w] = left.splice(Math.max(k, 0), 1);
      out.push(!w[2] && w[1] === end ? [w[1], w[0], 0] : w);
    }
    return out;
  }

  function deduce(item, area, api) {
    const { kinds, weighs } = item, n = kinds.length, rank = !!item.rank;
    let pick = null, order = [], peeks = 0, glow = null;
    const cards = h("div", { class: "weighs", role: "list", "aria-label": "The weighings" });
    const answer = h("div", { class: "picks", role: "group", "aria-label": rank ? "Put them in order, lightest first" : "Which is heaviest?" });
    const line = h("p", { class: "count", "aria-live": "polite" });
    area.append(cards, h("p", { class: "ask" }, rank ? "Put them in order, lightest first." : "Which is heaviest?"), answer, line);
    const clear = rank ? h("button", { type: "button", class: "secondary", "data-act": "clear", onclick: () => { order = []; api.say("Start again."); draw(); api.changed(); } }, "Start the line again") : null;
    if (clear) area.append(clear);
    function again(k) { // weigh it again, free: the beam goes level, then swings back the way the weighing goes
      peeks += 1;
      const beam = cards.children[k].querySelector(".beam"), tilt = beam.style.transform;
      beam.style.transform = "rotate(0deg)"; beam.getBoundingClientRect(); requestAnimationFrame(() => { beam.style.transform = tilt; });
      const text = `${told(kinds, weighs[k])}.`; api.say(text[0].toUpperCase() + text.slice(1));
    }
    function draw() {
      cards.replaceChildren(...weighs.map(([i, j, rel], k) => {
        const pic = svg("svg", { class: `mini${rel ? "" : " level"}${glow === k ? " pulse" : ""}`, viewBox: "0 0 240 130", "aria-hidden": "true" });
        const beam = svg("g", { class: "beam", style: `transform: rotate(${rel ? -12 : 0}deg); transform-origin: 120px 52px` }); // the heavier (left) side down
        beam.append(svg("rect", { x: 20, y: 46, width: 200, height: 10, rx: 5 }), thing(kinds[i], 45, 20), thing(kinds[j], 195, 20));
        pic.append(svg("path", { class: "post", d: "M120 52 L95 125 H145 Z" }), beam);
        return h("div", { class: "weigh", role: "listitem" }, h("div", { role: "img", "aria-label": `${told(kinds, [i, j, rel])}` }, pic),
          h("button", { type: "button", class: "secondary", "data-act": "again", "data-w": k, "aria-label": `Weigh again: ${kinds[i]} and ${kinds[j]}`, onclick: () => again(k) }, "⚖ Weigh again"));
      }));
      answer.replaceChildren(...kinds.map((k, i) => h("button", { type: "button", class: "secondary", [rank ? "data-i" : "data-pick"]: i,
        "aria-pressed": String(rank ? order.includes(i) : pick === i), "aria-label": rank && order.includes(i) ? `${k}, number ${order.indexOf(i) + 1}` : k, onclick: () => tap(i) },
        rank && order.includes(i) ? `${order.indexOf(i) + 1}. ${k}` : k)));
      line.textContent = rank && order.length ? `Lightest first: ${order.map((i) => kinds[i]).join(", ")}` : "";
      api.refresh();
    }
    function tap(i) {
      if (rank) order = order.includes(i) ? order.filter((v) => v !== i) : [...order, i];
      else pick = i;
      api.say(kinds[i]); draw(); api.changed();
    }
    const say = async (text, ms = 2800) => { api.say(text[0].toUpperCase() + text.slice(1)); await wait(ms); };
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`${rank ? "Put the things in order, lightest first" : "Which thing is heaviest"}? Look at the weighings. Weigh any one again for free.`, "⚖️"); },
      ready: () => (rank ? order.length === n : pick !== null),
      response: () => (rank ? { order: order.slice(), peeks } : { pick, peeks }),
      state: () => ({ pick, order, peeks }),
      restore(s) { pick = s.pick ?? null; order = (s.order || []).slice(); peeks = s.peeks || 0; draw(); },
      async model() { // how to read one weighing, on this item's first one (never the whole answer)
        await say("Watch me. One weighing at a time.", 2200);
        glow = 0; draw(); await say(`${told(kinds, weighs[0])}.`, 3000);
        await say(weighs[0][2] ? "The heavier side goes down." : "Level means the same weight. That tells me something too.", 2800);
        glow = null; draw(); await say("I put the weighings together. Now it's your turn.", 2200);
      },
      async help(level, fb) {
        await say(fb.feedback || "Put the weighings together, one after another.", 2800);
        for (const w of chain(weighs)) { glow = weighs.findIndex((v) => (v[0] === w[0] && v[1] === w[1]) || (v[0] === w[1] && v[1] === w[0])); draw(); await say(`${told(kinds, w)}.`, 2800); }
        glow = null;
        if (level >= 2 && rank) { // partial model: the lightest put first
          const lightest = kinds.findIndex((_, i) => !weighs.some(([a, b, rel]) => rel && a === i) && weighs.some(([a, b, rel]) => rel && b === i));
          order = lightest >= 0 ? [lightest] : []; if (lightest >= 0) await say(`Nothing is lighter than ${the(kinds[lightest])}. It goes first.`, 2600);
        } else { pick = null; order = []; }
        draw();
        api.prompt(`Try again. ${rank ? "Put them in order, lightest first." : "Which is heaviest?"}`, "⚖️");
      },
      async worked(sol) {
        for (const w of chain(weighs)) await say(`${told(kinds, w)}.`, 2400);
        if (rank) { order = sol.order.slice(); draw(); await say(`Lightest first: ${sol.order.map((i) => kinds[i]).join(", ")}.`, 3000); }
        else { pick = sol.pick; draw(); await say(`So ${the(kinds[sol.pick])} is the heaviest.`, 2600); }
      },
      async success() { await say(rank ? `Yes! Lightest first: ${order.map((i) => kinds[i]).join(", ")}.` : `Yes! ${the(kinds[pick])} is the heaviest.`, 2400); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Treasure Island Weigh-In", goal: "Make both sides weigh the same.",
    closure: "All done! You made the scale level.",
    stages: {
      balance_match: { name: "Make it balance" }, balance_target: { name: "Match the total" },
      balance_mixed: { name: "Tiles of different values" }, balance_relational: { name: "Same value on both sides" },
      balance_unknown: { name: "The box" }, balance_deduce: { name: "Which is heaviest?" },
    },
    praise: (item) => (item.stage === "balance_deduce" ? "Yes! You put the weighings together." : "Yes! Level."),
    mount: (item, area, api) => (item.stage === "balance_deduce" ? deduce : scale)(item, area, api),
  });
})();
