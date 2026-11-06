// Balloon Burst 1.1.0 (art step, docs/art-inventory.md): the 1.0.0 game; each balloon is its picture (B4-T1, large,
// in six colours) with its number on it, and a pop is the sparkle sheet (B4-A1) played once where the balloon was.
// Same items, responses and checker.
// Balloon Burst 1.0.0 (K–3) on kit 1.5.0: balloons float up carrying numbers; pop them smallest to largest. Untimed:
// the balloons drift and wait. A balloon pops only when it is the next one; a wrong pick does not pop (it wobbles and
// stays) and the server answers with feedback keyed to why, while the balloons line up over a number path. Popping is a
// soft sparkle, never a bang, and nothing depends on sound. Grade 3: some balloons hang upside down (the printed numeral
// counts; every number is underlined). Picture view: the balloons. Buttons view: the same balloons as a list. Both send
// the same taps. The server decides every answer. Original art (plain shapes).
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLOURS = ["red", "orange", "yellow", "green", "blue", "purple"];
  const NICE = [10, 20, 50, 100, 200, 500, 1000];

  function balloons(item, area, api) {
    const v = item.balloons, n = v.length, up = new Set(item.upside || []);
    const order = v.map((_, i) => i).sort((a, b) => v[a] - v[b]);
    let popped = [], wrong = null, pulse = -1;
    const next = () => order.find((i) => !popped.includes(i));
    const name = (i) => `Balloon ${v[i]}${up.has(i) ? ", hanging upside down" : ""}`;

    const W = 600, at = (i) => [60 + (i * (W - 120)) / Math.max(1, n - 1), i % 2 ? 150 : 110];
    const sky = svg("svg", { class: "visual sky", viewBox: `0 0 ${W} 300`, "aria-hidden": "true" });
    const groups = v.map((num, i) => {
      const [x, y] = at(i), g = svg("g", { class: "balloon", "data-i": i, transform: `translate(${x} ${y})` });
      const bob = svg("g", { class: "bob", style: `--d: ${i * 0.25}s` }), turn = svg("g", up.has(i) ? { transform: "rotate(180)" } : {});
      const t = svg("text", { y: -4, "font-size": 30 }), w = String(num).length * 9 + 6;
      t.textContent = String(num);
      turn.append(svg("image", { href: `../../art/balloon-burst/${COLOURS[i % COLOURS.length]}-large.webp`, x: -66, y: -60, width: 132, height: 132 }),
        svg("ellipse", { class: "skin", rx: 46, ry: 52 }), t, svg("line", { class: "numline", x1: -w, x2: w, y1: 18, y2: 18 }));
      bob.append(turn); g.append(bob); sky.append(g);
      return g;
    });
    sky.addEventListener("click", (e) => { const g = e.target.closest("[data-i]"); if (g) tap(Number(g.dataset.i)); });
    const list = h("ol", { class: "dom balloonlist", "aria-label": "Balloons" });
    const btns = v.map((_, i) => { const b = h("button", { type: "button", "data-i": i, onclick: () => tap(i) }); list.append(h("li", {}, b)); return b; });
    const line = svg("svg", { class: "lineup", viewBox: "0 0 620 156", "aria-hidden": "true" });
    const said = h("p", { class: "say", "aria-live": "polite" });
    const lineup = h("figure", { class: "manip", hidden: true }, h("figcaption", {}, "On the number path"), line);
    area.append(h("figure", { class: "manip" }, h("figcaption", {}, "Pop the smallest number first"), sky, list), lineup, said);

    function draw() {
      groups.forEach((g, i) => { g.classList.toggle("gone", popped.includes(i)); g.classList.toggle("wobble", wrong === i); g.classList.toggle("pulse", pulse === i); });
      btns.forEach((b, i) => {
        const gone = popped.includes(i);
        b.disabled = gone; b.textContent = `${v[i]}${gone ? " popped" : up.has(i) ? " (upside down)" : ""}`;
        b.setAttribute("aria-label", gone ? `Balloon ${v[i]}, popped` : name(i)); b.classList.toggle("pulse", pulse === i);
      });
      api.refresh();
    }
    /** A soft sparkle where a balloon was: the sparkle sheet's six frames, once (one still frame if motion is reduced). */
    function sparkle(i) {
      const [x, y] = at(i), b = svg("svg", { class: "burst", x: x - 70, y: y - 70, width: 140, height: 140, viewBox: "0 0 256 256" });
      b.append(svg("image", { href: "../../art/balloon-burst/pop.webp", width: 768, height: 512 }));
      const show = (k) => b.setAttribute("viewBox", `${(k % 3) * 256} ${Math.floor(k / 3) * 256} 256 256`);
      if (reduced) show(2); else for (let k = 0; k < 6; k++) setTimeout(() => show(k), k * 66);
      sky.append(b); setTimeout(() => b.remove(), 700);
    }
    function tap(i) {
      if (document.body.classList.contains("busy") || popped.includes(i) || popped.length === n) return; // the kit is showing something
      wrong = null; // after "take your time", the next tap starts again from the balloons still up
      if (i === next()) { popped.push(i); sparkle(i); api.say(String(v[i])); } else wrong = i; // not the next one: it wobbles and stays
      draw(); api.changed();
      if (wrong !== null || popped.length === n) wait(700).then(() => ctl.ready() && document.getElementById("check").click()); // the server answers
    }
    /** The balloons left, at their places on a number path: the one picked, and the smallest (the one to pop next). */
    function showLine(picked) {
      const left = order.filter((i) => !popped.includes(i)), top = NICE.find((t) => t >= v[left[left.length - 1]]) || 1000, x = (u) => 30 + (560 * u) / top;
      const tick = (u) => { const t = svg("text", { x: x(u), y: 144, "font-size": 20 }); t.textContent = String(u); return [svg("line", { class: "axis", x1: x(u), x2: x(u), y1: 112, y2: 128 }), t]; };
      line.replaceChildren(svg("line", { class: "axis", x1: 30, x2: 590, y1: 120, y2: 120 }), ...tick(0), ...tick(top),
        ...left.map((i, k) => {
          const g = svg("g", { class: i === left[0] ? "first" : i === picked ? "picked" : "" }), y = k % 2 ? 28 : 72, t = svg("text", { x: x(v[i]), y, "font-size": 20 });
          t.textContent = String(v[i]);
          g.append(svg("line", { class: "stick", x1: x(v[i]), x2: x(v[i]), y1: y + 26, y2: 120 }), svg("circle", { cx: x(v[i]), cy: y, r: 26 }), t);
          return g;
        }));
      said.textContent = `On the number path, ${v[left[0]]} comes before ${v[picked]}.`;
      lineup.hidden = false;
    }
    async function popInOrder(ms) { for (let i = next(); i !== undefined; i = next()) { popped.push(i); sparkle(i); api.say(String(v[i])); draw(); await wait(ms); } }
    const ctl = {
      begin(retry) { if (!retry) api.prompt("Pop the balloons from the smallest number to the largest.", "🎈"); },
      ready: () => popped.length === n || wrong !== null,
      response: () => ({ taps: wrong === null ? popped.slice() : [...popped, wrong] }),
      state: () => ({ popped: popped.slice(), wrong }),
      restore(s) { popped = (s.popped || []).slice(); wrong = s.wrong ?? null; pulse = -1; lineup.hidden = true; said.textContent = ""; draw(); },
      async model() { api.say("Watch me. I find the smallest number and pop it. Then the smallest one left."); await wait(3200); await popInOrder(1100); },
      async help(level, fb) {
        if (wrong !== null) showLine(wrong);
        api.say(fb.feedback || "Look for the smallest number left."); await wait(3400);
        if (level >= 2) { pulse = next(); draw(); api.say(`${v[pulse]} is the smallest number left.`); await wait(2400); pulse = -1; }
        wrong = null; lineup.hidden = true; said.textContent = ""; draw();
        api.prompt("Try again. Pop the smallest number left.", "🎈");
      },
      async worked() { wrong = null; draw(); api.say("Smallest first, then the next smallest."); await wait(1600); await popInOrder(1000); },
      async success() { api.say("Pop! Smallest to largest."); await wait(1600); },
    };
    draw();
    return ctl;
  }

  K.run({
    title: "Balloon Burst",
    goal: "Pop the numbers from smallest to largest.",
    closure: "All done! You put lots of numbers in order today.",
    stages: { balloon_next: { name: "What comes next?" }, balloon_mixed: { name: "Smallest to largest" }, balloon_big: { name: "Big numbers in order" },
      balloon_turned: { name: "Upside-down balloons" } },
    praise: () => "Yes! Smallest to largest.",
    mount: balloons,
  });
})();
