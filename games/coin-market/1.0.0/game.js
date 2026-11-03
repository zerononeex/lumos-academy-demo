// Coin Market 1.0.0 (Grades 1–3) on kit 1.5.0: Canadian coins (nickel, dime, quarter, loonie, toonie; no penny).
// Which coin is worth more (a dime is smaller than a nickel but worth more); pay a price from the tray; pay it two
// different ways; give the change. No wallet, no shop to keep: the tray is full and the hand empty every round.
// Picture view: tap a coin in the tray to put it in the hand, tap a coin in the hand to put it back. Buttons view:
// "Add a dime" buttons and the hand as a list of "Take back" buttons. Neither view shows a running total (that would
// give the answer away): the hand's coins are named instead. The server decides every answer. Original art.
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const NAME = { 5: "nickel", 10: "dime", 25: "quarter", 100: "loonie", 200: "toonie" };
  const MM = { 5: 21.2, 10: 18.03, 25: 23.88, 100: 26.5, 200: 28 }; // true diameters
  const R = (v) => MM[v] * 1.3; // a dime 47 across
  const money = (c) => (c < 100 ? `${c}¢` : `$${(c / 100).toFixed(2)}`);
  const face = (v) => (v < 100 ? `${v}¢` : `$${v / 100}`);
  const FULL = 40; // the most coins a hand holds (the server takes no more)
  const THINGS = ["an apple", "a pencil", "a ball", "a book", "a kite", "a toy boat"];

  /** One coin at (x, y): silver, the gold eleven-sided loonie, or the two-colour toonie. */
  function coin(v, x, y, attrs = {}, cls = "", k = 1) {
    const r = R(v), g = svg("g", { class: `coin ${cls}`, transform: `translate(${x} ${y}) scale(${k})`, ...attrs });
    if (v === 100) { const pts = Array.from({ length: 11 }, (_, k) => `${r * Math.sin(2 * Math.PI * k / 11)},${-r * Math.cos(2 * Math.PI * k / 11)}`).join(" ");
      g.append(svg("polygon", { class: "gold", points: pts }), svg("polygon", { class: "rim", points: pts })); }
    else if (v === 200) g.append(svg("circle", { class: "silver", r }), svg("circle", { class: "gold", r: r * 0.62 }), svg("circle", { class: "rim", r }));
    else g.append(svg("circle", { class: "silver", r }), svg("circle", { class: "rim", r }));
    const t = svg("text", {}); t.textContent = face(v); g.append(t);
    return g;
  }
  /** Coins in rows inside a box `w` wide; returns the svg children, the height used and the widest row. */
  function rowOf(values, w, extra = (i) => ({})) {
    const out = []; let x = 8, y = 0, rowH = 0, top = 8, wide = 0;
    values.forEach((v, i) => { const d = 2 * R(v) + 8; if (x + d > w) { x = 8; top += rowH; rowH = 0; } out.push(coin(v, x + d / 2, top + d / 2, extra(i))); x += d; wide = Math.max(wide, x); rowH = Math.max(rowH, d); y = top + rowH; });
    return [out, Math.max(y + 8, 2 * R(5) + 16), wide + 8];
  }
  const said = (v) => (v.length ? v.map((c) => NAME[c]).join(", ") : "nothing yet");

  // ---------------------------------------------------------------- Which coin is worth more?
  function know(item, area, api) {
    const ds = [item.a, item.b];
    let picked = null, pulse = null;
    const pic = svg("svg", { class: "visual pair", viewBox: "0 0 360 120", "aria-hidden": "true" });
    pic.addEventListener("click", (e) => { const t = e.target.closest("[data-p]"); if (t) choose(Number(t.dataset.p)); });
    const btns = ds.map((v) => h("button", { type: "button", class: "secondary", "data-pick": v, onclick: () => choose(v) }, `The ${NAME[v]}`));
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Which coin is worth more?"), pic,
      h("p", { class: "dom handtext" }, ds.map((v) => `A ${NAME[v]}, ${face(v)}`).join(". "))), h("div", { class: "dom picks", role: "group", "aria-label": "Which coin is worth more?" }, ...btns));
    function draw() {
      pic.replaceChildren(...ds.map((v, k) => coin(v, 90 + k * 180, 60, { "data-p": v }, `${picked === v ? "picked" : ""}${pulse === v ? " pulse" : ""}`, 1.5)));
      btns.forEach((b, k) => b.setAttribute("aria-pressed", String(picked === ds[k])));
      api.refresh();
    }
    function choose(v) { picked = v; api.say(`the ${NAME[v]}`); draw(); api.changed(); }
    const best = Math.max(...ds);
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`Which coin is worth more: the ${NAME[item.a]} or the ${NAME[item.b]}?`, "🪙"); },
      ready: () => picked !== null,
      response: () => ({ pick: picked }),
      state: () => ({ picked }),
      restore(s) { picked = s.picked ?? null; pulse = null; draw(); },
      async model() { api.say("Watch me. I read the number on each coin. A big coin is not always worth more."); await wait(3600); },
      async help(level, fb) {
        api.say(fb.feedback || "Read the number on each coin."); await wait(3000);
        if (level >= 2) { pulse = best; draw(); api.say(`The ${NAME[best]} is ${face(best)}.`); await wait(2400); pulse = null; draw(); }
        api.prompt("Try again. Which coin is worth more?", "🪙");
      },
      async worked(sol) { picked = sol.pick; pulse = best; draw(); api.say(`The ${NAME[best]}: ${face(best)} is more than ${face(Math.min(...ds))}.`); await wait(3000); pulse = null; draw(); },
      async success() { api.say(`Yes, the ${NAME[picked]} is worth ${face(picked)}.`); await wait(2000); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Pay (once or two ways), or give the change
  function pay(item, area, api) {
    const two = item.stage === "coin_two_ways", change = item.stage === "coin_change", tray = item.palette;
    let hands = two ? [[], []] : [[]], at = 0;
    const thing = THINGS[item.n % THINGS.length];
    const stall = svg("svg", { class: "stall", viewBox: "0 0 220 90", "aria-hidden": "true" });
    const tag = svg("text", { class: "tag", x: 110, y: 58 }); tag.textContent = change ? `${money(item.n)}, paid ${money(item.to)}` : money(item.n);
    stall.append(svg("rect", { x: 4, y: 14, width: 212, height: 66, rx: 14, fill: "#fff1b8", stroke: "var(--ink)", "stroke-width": 3 }), tag);
    const trayPic = svg("svg", { class: "visual tray", "aria-hidden": "true" });
    trayPic.addEventListener("click", (e) => { const t = e.target.closest("[data-p]"); if (t) add(Number(t.dataset.p)); });
    const handPics = hands.map((_, k) => { const p = svg("svg", { class: "visual hand", "aria-hidden": "true" });
      p.addEventListener("click", (e) => { const t = e.target.closest("[data-i]"); if (t) { at = k; take(Number(t.dataset.i)); } else if (two) { at = k; draw(); } }); return p; });
    const addBtns = h("div", { class: "dom picker", role: "group", "aria-label": "The tray" },
      ...tray.map((v) => h("button", { type: "button", class: "secondary", "data-add": v, onclick: () => add(v) }, `Add a ${NAME[v]}, ${face(v)}`)));
    const lists = hands.map((_, k) => h("ul", { class: "dom coinlist", "aria-label": two ? `Way ${k + 1}` : change ? "The change" : "Your hand" }));
    const texts = hands.map(() => h("p", { class: "handtext", "aria-live": "polite" }));
    const ways = two ? hands.map((_, k) => h("button", { type: "button", class: "secondary", "data-way": k, onclick: () => { at = k; api.say(`Way ${k + 1}`); draw(); } }, `Way ${k + 1}`)) : [];
    const ask = change ? `${thing[0].toUpperCase()}${thing.slice(1)} costs ${money(item.n)}. You paid ${money(item.to)}. Give the change.`
      : `${thing[0].toUpperCase()}${thing.slice(1)} costs ${money(item.n)}. Pay ${two ? "two different ways" : "for it"}.`;
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, change ? "The change" : "Pay for it"), stall, trayPic, addBtns),
      h("div", { class: "side" }, ...(two ? [h("div", { class: "picker ways", role: "group", "aria-label": "Which way you are paying" }, ...ways)] : []),
        ...hands.flatMap((_, k) => [handPics[k], lists[k], texts[k]])));
    function draw() {
      const [tc, th, tw] = rowOf(tray, 370, (i) => ({ "data-p": tray[i] }));
      trayPic.setAttribute("viewBox", `0 0 ${tw} ${th}`); trayPic.setAttribute("width", tw); trayPic.replaceChildren(...tc); // true size
      hands.forEach((hand, k) => {
        const [cs, hh] = rowOf(hand, 370, (i) => ({ "data-i": i }));
        handPics[k].setAttribute("viewBox", `0 0 370 ${hh + 4}`);
        handPics[k].replaceChildren(svg("rect", { class: `handbox${two && at === k ? " on" : ""}`, x: 2, y: 2, width: 366, height: hh }), ...cs);
        lists[k].replaceChildren(...hand.map((c, i) => h("li", {}, h("button", { type: "button", "data-i": i, onclick: () => { at = k; take(i); } }, `Take back the ${NAME[c]}`))));
        texts[k].textContent = `${two ? `Way ${k + 1}: ` : change ? "Change: " : "In your hand: "}${said(hand)}`;
      });
      ways.forEach((b, k) => b.setAttribute("aria-pressed", String(at === k)));
      api.refresh();
    }
    function add(v) { if (hands[at].length >= FULL) { api.say("Your hand is full. Try bigger coins."); return; } hands[at] = [...hands[at], v]; api.say(`a ${NAME[v]}`); draw(); api.changed(); }
    function take(i) { const v = hands[at][i]; hands[at] = hands[at].filter((_, j) => j !== i); api.say(`took back the ${NAME[v]}`); draw(); api.changed(); }
    async function countOut(hand, ms) { let t = 0; at = hands.indexOf(hand); for (const c of hand) { t += c; api.say(money(t)); await wait(ms); } }
    async function give(k, coins, ms) { hands[k] = []; at = k; draw(); for (const c of coins) { hands[k] = [...hands[k], c]; draw(); await wait(ms); } }
    const ctl = {
      begin(retry) { if (!retry) api.prompt(ask, "🪙"); },
      ready: () => hands.every((v) => v.length > 0),
      response: () => (two ? { pan: hands[0].slice(), pan2: hands[1].slice() } : { pan: hands[0].slice() }),
      state: () => ({ hands: hands.map((v) => v.slice()), at }),
      restore(s) { hands = s.hands ? s.hands.map((v) => v.slice()) : hands.map(() => []); at = s.at ?? 0; draw(); },
      async model() {
        api.say("Watch me. I start with the biggest coin that fits, and count on."); await wait(3000);
        const coins = tray.includes(25) ? [25, 10] : [10, 10, 5], amount = coins.reduce((t, c) => t + c, 0);
        await give(0, coins, 700);
        await countOut(hands[0], 900); api.say(`${money(amount)}. Now you.`); await wait(1800);
        hands = hands.map(() => []); at = 0; draw();
      },
      async help(level, fb) {
        api.say(fb.feedback || "Count the coins by what each one is worth."); await wait(3200);
        if (level >= 2) { for (const hand of hands) if (hand.length) { await countOut(hand, 800); } api.say(change ? `Count on from ${money(item.n)} to ${money(item.to)}.` : `We need ${money(item.n)}.`); await wait(2400); }
        api.prompt(`Try again. ${ask}`, "🪙");
      },
      async worked(sol) {
        await give(0, sol.pan, 600); if (two) await give(1, sol.pan2, 600);
        for (const hand of hands) await countOut(hand, 700);
        api.say(change ? `${money(item.to - item.n)} change: ${money(item.n)} and ${money(item.to - item.n)} make ${money(item.to)}.` : `${money(item.n)}.`); await wait(2800);
      },
      async success() { api.say(change ? `Yes, ${money(item.to - item.n)} back.` : two ? "Yes: two different ways to pay." : `Yes, that pays ${money(item.n)}.`); await wait(2000); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Coin Market",
    goal: "Pay with Canadian coins.",
    closure: "All done! You counted lots of coins today.",
    stages: { coin_know: { name: "Which coin is worth more?" }, coin_pay: { name: "Pay for it" }, coin_two_ways: { name: "Pay two ways" }, coin_change: { name: "Give the change" } },
    praise: () => "Yes! That's the right amount.",
    mount: (item, area, api) => (item.stage === "coin_know" ? know : pay)(item, area, api),
  });
})();
