// Car Route 1.1.0 (art step, docs/art-inventory.md): the 1.0.0 game with its own scene (B4-W2, at the same path) and
// the car as its picture (B4-A3, seen from above; its facing-down frame turned to face up, so code turns it at each
// junction as before). The roads stay drawn: the road pieces (B4-T3) have no T-junction yet. Same items, responses and checker.
// Car Route 1.0.0 (Coding, K–3) on kit 1.5.0: plan the whole route, then drive. At each junction on the way the child
// picks the turn the car will take, from the car's own seat (left and right are the car's); then Drive, and the car
// follows the plan. Where the plan runs out or goes wrong, the car stops there; the child fixes the plan and drives again.
// Grade 2 has dead ends; Grade 3 a star to pass on the way. Picture view: the town and the junction from the car's seat.
// Buttons view: the plan as a list, a junction per row. Both send the same plan. The server decides every drive; this
// file only shows it. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const XY = [[0, -1], [1, 0], [0, 1], [-1, 0]], TURN = { l: 3, s: 0, r: 1 };
  const WORD = { l: "Turn left", s: "Go straight", r: "Turn right" }, SHORT = { l: "left", s: "straight", r: "right" };
  const ARROW = { l: "M-84 0l28-28v14h32v28h-32v14z", s: "M0 -84l28 28h-14v32h-28v-32h-14z", r: "M84 0l-28-28v14h-32v28h32v14z" }; // on the road each way goes
  const S = 60; // a square of the town, in picture units

  function route(item, area, api) {
    const n = item.cols, road = new Set(item.roads), p = item.path, end = p[p.length - 1];
    const beside = (c, d) => { const x = (c % n) + XY[d][0], y = Math.floor(c / n) + XY[d][1]; return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x; };
    const headingOf = (a, b) => [0, 1, 2, 3].find((d) => beside(a, d) === b);
    const exitsAt = (c, hd) => ["l", "s", "r"].filter((t) => road.has(beside(c, (hd + TURN[t]) % 4)));
    // The junctions on the route, in order (src/lib/items.ts junctions: the same rule).
    const js = p.slice(1, -1).flatMap((c, k) => { const hd = headingOf(p[k], c), exits = exitsAt(c, hd); return exits.length > 1 ? [{ at: c, hd, exits }] : []; });
    /** The squares the car drives through for a plan, and its heading on each (src/lib/items.ts drive: the same rule). */
    function drive(plan) {
      let at = p[0], hd = headingOf(p[0], p[1]), k = 0, on = true;
      const out = [[at, hd]];
      for (let i = 0; i < n * n * 4 && !(i && at === end); i++) {
        const ex = exitsAt(at, hd), t = ex.length === 1 ? ex[0] : on && js[k] && js[k].at === at && plan[k] ? plan[k++] : null;
        if (!t || !ex.includes(t)) break;
        hd = (hd + TURN[t]) % 4; at = beside(at, hd); on = on && p[i + 1] === at; out.push([at, hd]);
      }
      return out;
    }
    let plan = js.map(() => ""), sel = 0, seat = false, deg = 0;
    const cx = (c) => (c % n) * S + S / 2, cy = (c) => Math.floor(c / n) * S + S / 2;

    // ---------------------------------------------------------------- the town
    const map = svg("svg", { class: "map", viewBox: `-4 -4 ${n * S + 8} ${n * S + 8}`, "aria-hidden": "true" }), world = svg("g", { class: "world" });
    world.append(svg("rect", { class: "grass", x: 0, y: 0, width: n * S, height: n * S, rx: 18 }));
    const seg = (a, b, cls, w) => svg("line", { class: cls, x1: cx(a), y1: cy(a), x2: b === null ? cx(a) : cx(b), y2: b === null ? cy(a) : cy(b), "stroke-width": w });
    for (const [cls, w] of [["roadline", 40], ["roadtop", 32]]) for (const c of road) {
      world.append(seg(c, null, cls, w)); // a round cap: corners and ends stay round
      for (const d of [1, 2]) if (road.has(beside(c, d))) world.append(seg(c, beside(c, d), cls, w));
      // A road's end at the edge of town runs off it; one inside the town is a dead end (a barrier across it).
      const ways = [0, 1, 2, 3].filter((d) => road.has(beside(c, d)));
      if (ways.length === 1 && c !== p[0] && c !== end) {
        const d = (ways[0] + 2) % 4, off = beside(c, d) < 0;
        if (off) world.append(svg("line", { class: cls, x1: cx(c), y1: cy(c), x2: cx(c) + XY[d][0] * S * 0.6, y2: cy(c) + XY[d][1] * S * 0.6, "stroke-width": w }));
        else if (cls === "roadtop") world.append(svg("rect", { class: "barrier", x: cx(c) - 18 + XY[d][0] * 14, y: cy(c) - 18 + XY[d][1] * 14, width: XY[d][0] ? 8 : 36, height: XY[d][0] ? 36 : 8 }));
      }
    }
    // The start (a garage), the destination (a home or a park), the star to pass (Grade 3).
    const land = (c, kids) => { const g = svg("g", { transform: `translate(${cx(c)} ${cy(c)})` }); g.append(...kids); return g; };
    world.append(land(p[0], [svg("path", { class: "land", fill: "#d9d4f5", d: "M-24 22v-28l24-18 24 18v28z" })]),
      land(end, item.story ? [svg("rect", { class: "land", fill: "#8a5a2b", x: -5, y: 4, width: 10, height: 20 }), svg("circle", { class: "land", fill: "#5cbf6a", cy: -6, r: 22 })]
        : [svg("path", { class: "land", fill: "#ffe27a", d: "M-22 24v-24h44v24z" }), svg("path", { class: "land", fill: "#ef6b6b", d: "M-28 2l28-26 28 26z" })]));
    const star = item.star === undefined ? null : svg("path", { class: "starmark", fill: "#ffd23f", transform: `translate(${cx(item.star)} ${cy(item.star)})`, d: "M0-22 6-7 22-6 9 4 13 20 0 11-13 20-9 4-22-6-6-7z" });
    if (star) world.append(star);
    const badges = js.map((j, k) => { const g = svg("g", { class: "badge" }), t = svg("text", { x: cx(j.at), y: cy(j.at), "font-size": 22 }); t.textContent = String(k + 1); g.append(svg("circle", { cx: cx(j.at), cy: cy(j.at), r: 17 }), t); world.append(g); return g; });
    const car = svg("g", { class: "car" });
    const pic = svg("svg", { x: -26, y: -26, width: 52, height: 52, viewBox: "512 0 256 256" }), up = svg("g", { transform: "rotate(180 640 128)" });
    up.append(svg("image", { href: "../../art/car-route/car.webp", width: 1024, height: 256 })); pic.append(up); car.append(pic);
    world.append(car); map.append(world);
    function place(c, hd, quick) {
      const turn = (((hd * 90 - deg) % 360) + 540) % 360 - 180; deg += turn; // the short way round
      car.style.transition = quick ? "none" : ""; car.style.transform = `translate(${cx(c)}px, ${cy(c)}px) rotate(${deg}deg)`;
    }

    // ---------------------------------------------------------------- the junction from the car's seat (picture view)
    const seatPic = svg("svg", { class: "visual seat", viewBox: "-110 -110 220 220", "aria-hidden": "true" });
    seatPic.addEventListener("click", (e) => { const g = e.target.closest("[data-turn]"); if (g) choose(sel, g.dataset.turn); });
    const seatBtn = h("button", { type: "button", class: "secondary", "data-act": "seat", "aria-pressed": "false", onclick: () => { seat = !seat; draw(); } }, "Sit in the car");
    const chips = h("div", { class: "chips" });
    const ask = h("p", { class: "ask" });
    // ---------------------------------------------------------------- the plan as a list (buttons view)
    const list = h("ol", { class: "dom plan", "aria-label": "The plan" }, ...js.map((j, k) => h("li", {}, h("span", { class: "jname" }, `Junction ${k + 1}`),
      ...j.exits.map((t) => h("button", { type: "button", class: "secondary", "data-j": k, "data-turn": t, onclick: () => choose(k, t) }, WORD[t])))));
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Our town"), map),
      h("div", { class: "side" }, ask, seatPic, h("div", { class: "visualonly chips" }, chips, seatBtn), list));

    function draw() {
      const j = js[sel];
      ask.textContent = `Junction ${sel + 1}: which way for the car?`;
      const stub = (t) => ({ l: "M0 0H-110", s: "M0 0V-110", r: "M0 0H110" })[t];
      seatPic.replaceChildren(svg("rect", { class: "grass", x: -110, y: -110, width: 220, height: 220, rx: 22 }),
        ...[["roadline", 50], ["roadtop", 42]].flatMap(([cls, w]) => [svg("path", { class: cls, d: "M0 110V0", "stroke-width": w }),
          ...j.exits.map((t) => svg("path", { class: cls, d: stub(t), "stroke-width": w }))]),
        ...j.exits.map((t) => { const g = svg("g", { class: `exit${plan[sel] === t ? " on" : ""}`, "data-turn": t }); g.append(svg("path", { class: "arrow", d: ARROW[t] })); return g; }));
      const me = svg("g", { class: "car", transform: "translate(0 72)" }); me.append(...car.cloneNode(true).childNodes); seatPic.append(me);
      chips.replaceChildren(...js.map((_, k) => { // a junction's number and its planned way, drawn
        const b = h("button", { type: "button", class: `secondary${plan[k] ? " set" : ""}`, "aria-current": String(k === sel), "aria-label": `Junction ${k + 1}: ${plan[k] ? SHORT[plan[k]] : "not planned"}`,
          onclick: () => { sel = k; draw(); } }, `${k + 1}`);
        const icon = svg("svg", { viewBox: { l: "-88 -32 68 64", s: "-32 -88 64 68", r: "20 -32 68 64", "": "-34 -34 68 68" }[plan[k]], class: "way", "aria-hidden": "true" });
        if (plan[k]) icon.append(svg("path", { d: ARROW[plan[k]] })); else { const q = svg("text", { "font-size": 64 }); q.textContent = "?"; icon.append(q); }
        b.append(icon); return b;
      }));
      list.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(plan[b.dataset.j] === b.dataset.turn)));
      badges.forEach((b, k) => { b.classList.toggle("set", !!plan[k]); b.classList.toggle("here", k === sel); });
      seatBtn.setAttribute("aria-pressed", String(seat));
      world.style.transform = seat ? `rotate(${-j.hd * 90}deg)` : ""; // the free hint: the town turned so the car faces up at this junction
      if (seat) place(j.at, j.hd, true); else place(p[0], headingOf(p[0], p[1]), true);
      api.refresh();
    }
    function choose(k, t) {
      if (document.body.classList.contains("busy") || !js[k].exits.includes(t)) return;
      plan[k] = plan[k] === t ? "" : t; // tap again to take a turn out of the plan
      if (plan[k] && k === sel && sel < js.length - 1) sel += 1; // on to the next junction
      api.say(plan[k] ? SHORT[t] : "nothing planned"); draw(); api.changed();
    }
    async function go(steps) { seat = false; draw(); await wait(300); for (const [c, hd] of steps.slice(1)) { place(c, hd); await wait(320); } }
    const pulse = (el, ms) => { el.classList.add("pulse"); return wait(ms).then(() => el.classList.remove("pulse")); };
    /** The junction where the car left the route (a wrong turn), or -1. */
    const offAt = () => { const s = drive(plan), i = s.findIndex(([c], k) => c !== p[k]); return i > 0 ? js.findIndex((j) => j.at === s[i - 1][0]) : -1; };
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Plan the turns at each junction. Then drive!", "🚗"); },
      ready: () => plan.some(Boolean),
      response: () => ({ moves: plan.slice() }),
      state: () => ({ plan: plan.slice() }),
      restore(s) { plan = js.map((_, k) => (s.plan && s.plan[k]) || ""); seat = false; draw(); },
      async model() {
        api.say("Watch me. At a junction I sit in the car: is the road I need on its left, straight on, or on its right?"); sel = 0; seat = true; draw(); await wait(4600);
        seat = false; draw();
      },
      async help(level, fb) {
        await go(drive(plan));
        api.say(fb.feedback || "Look where the car stopped."); await wait(3000);
        if (fb.misconception === "missed_stop" && star) await pulse(star, 2600);
        else if (fb.misconception === "screen_left_right") { sel = Math.max(0, offAt()); seat = true; draw(); await wait(3200); seat = false; } // that junction, from the seat
        else { const stop = js.findIndex((j) => j.at === drive(plan).slice(-1)[0][0]); if (stop >= 0) { sel = stop; draw(); await pulse(badges[stop], 2400); } }
        if (level >= 2 && fb.misconception !== "missed_stop") { seat = true; draw(); api.say("From the car's seat, left is the car's left."); await wait(2600); seat = false; }
        draw(); api.prompt("Try again. Fix the plan, then drive.", "🚗");
      },
      async worked(sol) { plan = sol.moves.slice(); draw(); api.say("Here is a plan that gets there. Watch the car."); await go(drive(plan)); await wait(600); },
      async success() { await go(drive(plan)); api.say("We made it!"); await wait(1200); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Car Route",
    goal: "Plan the turns, then drive.",
    closure: "All done! You planned lots of routes today.",
    checkLabel: "Drive",
    stages: { route_turns: { name: "Plan the turns" }, route_dead_ends: { name: "Miss the dead ends" }, route_stop: { name: "Stop at the star" } },
    praise: () => "Yes! The plan works.",
    mount: route,
  });
})();
