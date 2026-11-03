// Spinner Lab 1.0.0 (Grades 1–3) on kit 1.5.0: chance, in likelihood words (impossible, unlikely, equally likely,
// likely, certain; never luck or winning words). How likely is it to land on a colour? Or: spin once, predict which
// colour comes up most in ten spins, spin ten times, then read the tally. The spins come from the server with the
// item; this file only shows them. Picture view: the spinner and a tally. Buttons view: the spinner in words and the
// ten spins as a table. The server decides every answer. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const FILL = { blue: "#5b8def", yellow: "#ffd23f", red: "#ef6b6b", green: "#5cbf6a" };
  const WORDS = ["impossible", "unlikely", "equally likely", "likely", "certain"];
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  const C = 140, R = 125;
  const at = (t, r = R) => [C + r * Math.sin(2 * Math.PI * t), C - r * Math.cos(2 * Math.PI * t)];

  /** The spinner's parts (in eighths, in kind order) and the pointer turned to `turn` (whole turns). */
  function spinner(pic, kinds, sizes, { turn = 0, pulse = -1 } = {}) {
    const kids = []; let t0 = 0;
    sizes.forEach((v, i) => {
      if (!v) return;
      const a = t0 / 8, b = (t0 + v) / 8; t0 += v;
      kids.push(v === 8 ? svg("circle", { class: `part${pulse === i ? " pulse" : ""}`, cx: C, cy: C, r: R, fill: FILL[kinds[i]] })
        : svg("path", { class: `part${pulse === i ? " pulse" : ""}`, fill: FILL[kinds[i]], d: `M${C} ${C}L${at(a).join(" ")}A${R} ${R} 0 ${b - a > 0.5 ? 1 : 0} 1 ${at(b).join(" ")}Z` }));
      const [x, y] = at((a + b) / 2, v === 8 ? 70 : 80), label = svg("text", { x, y }); label.textContent = kinds[i]; kids.push(label);
    });
    const ptr = svg("g", { class: "pointer", style: `transform: rotate(${turn * 360}deg); transform-origin: ${C}px ${C}px` });
    ptr.append(svg("path", { d: `M${C - 9} ${C}L${C} ${C - 100}L${C + 9} ${C}Z` }), svg("circle", { cx: C, cy: C, r: 12, fill: "var(--ink)" }));
    pic.replaceChildren(...kids, ptr);
  }
  /** Where the pointer stops for a spin landing on kind k (a different spot in its part each time, after whole turns). */
  const landing = (sizes, k, nth) => { const start = sizes.slice(0, k).reduce((s, v) => s + v, 0); return 3 * (nth + 1) + (start + sizes[k] * (0.3 + 0.4 * ((nth * 37) % 10) / 10)) / 8; };
  const inWords = (kinds, sizes) => `The spinner has 8 equal parts: ${kinds.map((c, i) => (sizes[i] ? `${sizes[i]} ${c}` : null)).filter(Boolean).join(", ")}.`
    + kinds.filter((_, i) => !sizes[i]).map((c) => ` No ${c}.`).join("");

  // ---------------------------------------------------------------- How likely?
  function words(item, area, api) {
    const { kinds, sizes } = item, c = kinds[item.n];
    let picked = null, pulse = -1;
    const pic = svg("svg", { class: "visual spinner", viewBox: "0 0 280 280", "aria-hidden": "true" });
    const ask = `Landing on ${c} is...`;
    const btns = WORDS.map((w, i) => h("button", { type: "button", class: "secondary", "data-word": i, onclick: () => choose(i) }, w));
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Our spinner"), pic, h("p", { class: "dom spintext" }, inWords(kinds, sizes))),
      h("div", { class: "side" }, h("p", { class: "ask" }, ask), h("div", { class: "picks", role: "group", "aria-label": ask }, ...btns)));
    function draw() { spinner(pic, kinds, sizes, { pulse }); btns.forEach((b, i) => b.setAttribute("aria-pressed", String(picked === i))); api.refresh(); }
    function choose(i) { picked = i; api.say(WORDS[i]); draw(); api.changed(); }
    const ctl = {
      begin(retry) { if (!retry) api.prompt(`How likely is the spinner to land on ${c}?`, "🎯"); },
      ready: () => picked !== null,
      response: () => ({ pick: picked }),
      state: () => ({ picked }),
      restore(s) { picked = s.picked ?? null; pulse = -1; draw(); },
      async model() { api.say("Watch me. I look at how much of the spinner is each colour. No part at all: impossible. The whole spinner: certain."); await wait(4600); },
      async help(level, fb) {
        api.say(fb.feedback || "Look at how much of the spinner is that colour."); await wait(3000);
        if (level >= 2) { pulse = item.n; draw(); api.say(sizes[item.n] ? `${c}: ${sizes[item.n]} of the 8 parts.` : `There is no ${c} on this spinner.`); await wait(2600); pulse = -1; draw(); }
        api.prompt(`Try again. ${ask}`, "🎯");
      },
      async worked(sol) { pulse = item.n; picked = sol.pick; draw(); api.say(`${c} is ${sizes[item.n]} of 8 parts, so it is ${WORDS[sol.pick]}.`); await wait(3200); pulse = -1; draw(); },
      async success() { api.say(`Yes, ${WORDS[picked]}.`); await wait(1800); },
    };
    draw();
    return ctl;
  }

  // ---------------------------------------------------------------- Spin once, predict, spin ten times, read the tally
  function predict(item, area, api) {
    const { kinds, sizes, spins } = item, c = kinds[item.ask[0]];
    let once = false, ten = 0, picked = null, again = false, turn = 0, pulse = -1, busy = false;
    const pic = svg("svg", { class: "visual spinner", viewBox: "0 0 280 280", "aria-hidden": "true" });
    const tally = svg("svg", { class: "tally", viewBox: `0 0 300 ${kinds.length * 40 + 6}`, "aria-hidden": "true" });
    const table = h("table", { class: "dom spins" });
    const said = h("p", { class: "spintext", "aria-live": "polite" });
    const onceBtn = h("button", { type: "button", "data-act": "once", onclick: spinOnce }, "Spin once");
    const tenBtn = h("button", { type: "button", "data-act": "ten", onclick: spinTen }, "Spin 10 times");
    const btns = kinds.map((k, i) => h("button", { type: "button", class: "secondary", "data-pick": i, onclick: () => choose(i) }, cap(k)));
    const ask = "Which colour will it land on most in 10 spins?", read = `How many times did it land on ${c}?`;
    const box = h("div", { class: "picker" });
    const count = K.stepper(box, { label: `Landed on ${c}`, min: 0, max: 10, onChange: () => { draw(); api.changed(); } });
    const later = [h("p", { class: "ask" }, ask), h("div", { class: "picks", role: "group", "aria-label": ask }, ...btns), tenBtn];
    const last = [tally, table, h("p", { class: "ask" }, read), box];
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Our spinner"), pic, h("p", { class: "dom spintext" }, inWords(kinds, sizes))),
      h("div", { class: "side" }, onceBtn, said, ...later, ...last));
    function draw() {
      spinner(pic, kinds, sizes, { turn, pulse });
      const shown = spins.slice(0, ten);
      tally.replaceChildren(...kinds.flatMap((k, i) => {
        const y = 6 + i * 40, n = shown.filter((v) => v === i).length, row = svg("g", { class: `tallyrow${pulse === i ? " pulse" : ""}` }), t = svg("text", { x: 40, y: y + 18 });
        t.textContent = k; row.append(t);
        for (let m = 0; m < n; m++) { const g = Math.floor(m / 5), x = 100 + g * 50 + (m % 5) * 10;
          row.append(m % 5 === 4 ? svg("line", { class: "tallymark", x1: x - 44, y1: y + 30, x2: x - 2, y2: y + 4 }) : svg("line", { class: "tallymark", x1: x, y1: y + 2, x2: x, y2: y + 32 })); }
        return [row];
      }));
      table.replaceChildren(h("caption", {}, "Our 10 spins"), ...shown.map((v, i) => h("tr", {}, h("th", { scope: "row" }, `Spin ${i + 1}`), h("td", {}, kinds[v]))));
      onceBtn.disabled = once || busy;
      later.forEach((el) => (el.hidden = !once)); last.forEach((el) => (el.hidden = ten < 10));
      btns.forEach((b, i) => { b.setAttribute("aria-pressed", String(picked === i)); b.disabled = ten > 0 && !again; });
      tenBtn.disabled = picked === null || ten > 0 || busy;
      api.refresh();
    }
    async function spinOnce() { if (once || busy) return; busy = true; turn = landing(sizes, item.n, 0); draw(); await wait(1000); busy = false; once = true; said.textContent = `It landed on ${kinds[item.n]}.`; api.say(said.textContent); draw(); api.changed(); }
    function choose(i) { if (ten && !again) return; picked = i; api.say(kinds[i]); draw(); api.changed(); }
    async function spinTen() {
      if (picked === null || ten || busy) return; busy = true;
      for (let k = 0; k < 10; k++) { turn = landing(sizes, spins[k], k + 1); ten = k + 1; draw(); await wait(320); }
      busy = false; api.say("Ten spins. Read the tally."); draw(); api.changed();
    }
    async function countRow(i, ms) { pulse = i; draw(); const n = spins.filter((v) => v === i).length; for (let m = 1; m <= n; m++) { api.say(String(m)); await wait(ms); } pulse = -1; draw(); }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Spin once. Then predict, and spin 10 times.", "🎯"); },
      ready: () => ten === 10 && picked !== null,
      response: () => ({ pick: picked, read: count.value }),
      state: () => ({ once, ten, picked, again, read: count.value, turn }),
      restore(s) { once = !!s.once; ten = s.ten || 0; picked = s.picked ?? null; again = !!s.again; count.set(s.read || 0); turn = s.turn || 0; pulse = -1; busy = false; draw(); },
      async model() {
        api.say("Watch me. One spin can land anywhere. Over many spins, the biggest part comes up most."); await wait(3800);
        const big = sizes.indexOf(Math.max(...sizes)); pulse = big; draw(); api.say(`${cap(kinds[big])} is the biggest part. Now you.`); await wait(2600); pulse = -1; draw();
      },
      async help(level, fb) {
        api.say(fb.feedback || "Look at the spinner and the tally again."); await wait(3000);
        if (fb.misconception !== "misread") { again = true; picked = null; draw(); } // those ten spins happened: predict again from the spinner
        if (level >= 2 && fb.misconception === "misread") await countRow(item.ask[0], 600);
        else if (level >= 2) { const big = sizes.indexOf(Math.max(...sizes)); pulse = big; draw(); api.say(`${cap(kinds[big])}: ${sizes[big]} of the 8 parts.`); await wait(2600); pulse = -1; draw(); }
        api.prompt(`Try again. ${ten === 10 ? read : ask}`, "🎯");
      },
      async worked(sol) {
        if (!once) await spinOnce();
        picked = sol.pick; draw();
        if (!ten) await spinTen();
        await countRow(item.ask[0], 500); count.set(sol.read); draw();
        api.say(`${cap(kinds[sol.pick])} is the most likely: it is the biggest part. ${cap(c)} came up ${sol.read} times.`); await wait(3200);
      },
      async success() { api.say(`Yes: ${count.value} times on ${c}.`); await wait(1800); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Spinner Lab",
    goal: "How likely is it?",
    closure: "All done! You tested lots of spinners today.",
    stages: { spin_words: { name: "How likely?" }, spin_predict: { name: "Predict, then spin 10 times" } },
    praise: () => "Yes! That's how likely it is.",
    mount: (item, area, api) => (item.stage === "spin_words" ? words : predict)(item, area, api),
  });
})();
