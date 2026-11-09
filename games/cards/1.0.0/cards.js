// Lumos picture cards 1.0.0, on game kit 1.6.0 (load kit.js first, cards.css after kit.css). The browser half of the
// picture-card games (src/lib/cards/engine.ts): five kinds of item, each drawn twice, a picture twin you tap and a
// buttons twin you use with a keyboard, both writing the same answer, so they score identically through the server's
// one checker. Every target is a single tap (WCAG 2.5.7): a card is picked up by a tap and put down by another, never
// dragged.
//   pick (tap one), multi (tap each that fits), order (tap them first to last), sort (pick a card, tap its basket),
//   build (tap the palette to add a step, tap a step to take it out).
// A game supplies how each card looks and, optionally, a scene above the cards that reacts (the colour in the bowl, the
// ball rolling). The server decides every answer; this file only shows it. A released version is never edited.
(() => {
  "use strict";
  const K = window.LumosKit, { h, svg, wait } = K;
  const C = { text: (g, x, y, words, size = 40, fill = "#1b1f3b") => { const t = svg("text", { x, y, "font-size": size, fill, class: "glyph" }); t.textContent = words; g.append(t); return t; } };

  // Landed card pictures (docs/gemini-art-prompts.md, the GA card sheets), by game: a card's picture is in its game's
  // own folder, or in the one sheet the workbook says it shares. A card with none keeps its drawing.
  const ART = {
    "animal-tracks": "bear bird mouse",
    "dissolve-it": "drink-powder oil rice salt sand sugar",
    "five-senses": "ears eyes hands nose tongue",
    "habitat-match": "arctic-fox cactus camel deer desert duck fish forest frog lizard owl penguin polar-bear pond snow squirrel",
    "instrument-families": "drum flute guitar harp keyboard piano recorder tambourine trumpet violin xylophone",
    "just-gardening": "air blanket candy lots-of-water music soil sunlight water",
    "kitchen-chemistry": "baking-soda-and-vinegar ice-cubes melting-ice-cream melting-snowman salt-and-water sugar-in-tea tray-in-freezer wet-paper",
    "life-cycle-order": "butterfly butterfly-egg caterpillar chick chrysalis egg flower frog frog-eggs froglet hen seed sprout tadpole young-hen young-plant",
    "magnet-match": "copper-wire crayon gold-ring iron-bolt iron-nail plastic-button rubber-band safety-pin shiny-sticker steel-screw",
    "materials-sort": "chair envelope fork glass-jar scarf shiny-gift-wrap sock t-shirt tin-can window",
    "push-pull-sort": "kick-a-ball open-a-drawer pick-an-apple press-a-doorbell pull-a-door-handle pull-a-wagon pull-up-socks push-a-cart push-a-door push-a-swing shut-a-drawer tug-a-rope",
    "seasons-and-sky": "baby-birds falling-leaves flower-buds pumpkins sandcastle snowman",
    "sink-or-float": "apple beach-ball coin key leaf log marble metal-spoon paper-clip pebble pencil rock rubber-duck spoon wooden-block wooden-spoon",
    "solid-or-liquid": "honey ice-cube juice milk snowball syrup water",
    "story-order": "bread chick-peeks chick-walks eat egg egg-cracks flower plant-seed rain roll-snowball snow snowman-hat spread-jam sprout stack-snowballs top-on",
    "texture-sort": "balloon brick feather glittery-sticker photo-of-tree-bark pillow pinecone sandpaper shiny-pebble tree-bark wool-sock",
    "water-cycle": "chimney-smoke cloud-forms collects cotton-wool rain-falls rises sun-warms tap tiny-drops",
    "weather-watch": "cloudy jacket mittens rainy snowy sun-hat sunny sweater umbrella windy",
    "who-eats-what": "bee berries-and-fish carrots fish flies grass hummingbird leaves nectar nuts snail worm worms",
  };
  const SHARES = { "solid-or-liquid": "sink-or-float", "magnet-match": "sink-or-float", "texture-sort": "sink-or-float",
    "dissolve-it": "sink-or-float", "materials-sort": "sink-or-float", "seasons-and-sky": "weather-watch",
    "who-eats-what": "life-cycle-order", "animal-tracks": "habitat-match" };
  const NAMED = { // a card whose file is not its name in hyphens, less a leading "a"
    "two slices of bread": "bread", "a chick peeks out": "chick-peeks", "the chick walks away": "chick-walks",
    "smoke from a chimney": "chimney-smoke", "water collects in the lake": "collects", "Pip eats the sandwich": "eat",
    "an egg in the nest": "egg", "the egg cracks": "egg-cracks", "a flower blooms": "flower",
    "glass marble": "marble", "a glass marble": "marble", "lots and lots of water": "lots-of-water",
    "ice cream on a hot day": "melting-ice-cream", "a snowman in the spring sun": "melting-snowman", "Pip plants a seed": "plant-seed",
    "pull a door handle toward you": "pull-a-door-handle", "pull up your socks": "pull-up-socks",
    "push a shopping cart": "push-a-cart", "push a door open": "push-a-door", "rain falls on the seed": "rain",
    "water rises into the air": "rises", "Pip rolls a big snowball": "roll-snowball", "snow falls": "snow",
    "the snowman gets a hat": "snowman-hat", "Pip spreads the jam": "spread-jam", "a sprout pops up": "sprout",
    "Pip stacks the snowballs": "stack-snowballs", "sugar stirred into tea": "sugar-in-tea",
    "the sun warms the water": "sun-warms", "tiny drops of water": "tiny-drops", "Pip puts the top on": "top-on",
    "the tray goes in the freezer": "tray-in-freezer", "paper getting wet": "wet-paper",
  };
  const game = (location.pathname.match(/\/games\/([^/]+)\/[^/]+\/[^/]*$/) || [])[1];
  /** A card's landed picture (a file), or null. A "(material)" after a name is the answer's, not the picture's. */
  const pic = (name) => {
    const n = String(name).replace(/ \(.*\)$/, ""), k = NAMED[n] || n.replace(/^an? /, "").replace(/ /g, "-").toLowerCase();
    const f = [game, SHARES[game]].find((x) => ART[x] && ART[x].split(" ").includes(k));
    return f ? `../../art/${f}/${k}.webp` : null;
  };

  /** A card's picture in a 100 × 100 box: landed art (pic, or `art`, a file), else drawn shapes (`draw(g)`), and its word. */
  function face(L, words, cls, attrs) {
    const s = svg("svg", { viewBox: "0 0 100 100", class: `pcard ${cls || ""}`, ...attrs });
    s.append(svg("rect", { class: "bg", x: 3, y: 3, width: 94, height: 94, rx: 16 }));
    const box = words && L.name ? 70 : 84;
    const art = pic(L.name) || L.art;
    if (art) s.append(svg("image", { href: art, x: 50 - box / 2, y: 6, width: box, height: box, preserveAspectRatio: "xMidYMid meet" }));
    else if (L.draw) { const g = svg("g", { transform: words && L.name ? "translate(15 5) scale(.7)" : "translate(8 8) scale(.84)" }); L.draw(g); s.append(g); }
    if (words && L.name) { const t = svg("text", { x: 50, y: 90, class: "word" }); t.textContent = L.word || L.name; s.append(t); }
    return s;
  }
  /** A small copy of a card's picture for a button (decorative, and wordless: the button's words are its name). */
  const thumb = (L) => { const s = face(L, false, "thumb", { "aria-hidden": "true" }); s.querySelectorAll("text").forEach((t) => t.remove()); return s; };

  function mount(G) {
    return (item, area, api) => {
      const n = item.cards.length, kind = item.kind, words = G.words !== false;
      const look = (i) => G.look(item.cards[i], item, i);
      const bin = (b) => (G.bin ? G.bin(item.bins[b], item, b) : { name: item.bins[b] });
      const slots = Number((item.data && item.data.slots) || item.want.length);
      const blank = () => ({ pick: -1, set: [], order: [], bins: Array(n).fill(-1), taps: [], held: kind === "sort" ? 0 : -1, out: [] });
      let st = blank();
      const scene = G.scene ? G.scene(item, api) : null;

      const say = (i) => { const L = look(i); if (L.sound) L.sound(); else api.say(L.name); };
      function tap(i) { // a card: the same act in both twins
        if (document.body.classList.contains("busy") || st.out.includes(i)) return;
        if (kind === "pick") st.pick = st.pick === i ? -1 : i;
        else if (kind === "multi") st.set = st.set.includes(i) ? st.set.filter((x) => x !== i) : [...st.set, i];
        else if (kind === "order") st.order = st.order.includes(i) ? st.order.filter((x) => x !== i) : [...st.order, i];
        else if (kind === "sort") { if (st.bins[i] >= 0) st.bins[i] = -1; st.held = st.held === i ? -1 : i; }
        else if (kind === "build") { if (st.taps.length >= slots) return api.say("The steps are full. Tap a step to take it out."); st.taps = [...st.taps, i]; }
        say(i); changed();
      }
      function drop(b, i = st.held) { // a basket
        if (document.body.classList.contains("busy") || i < 0) return;
        st.bins[i] = b; st.held = st.bins.indexOf(-1); // on to the next card still to sort
        api.say(`${look(i).name}: ${bin(b).name}`); changed();
      }
      function unstep(k) { // a step of a build, or a place in an order
        if (document.body.classList.contains("busy")) return;
        if (kind === "build") st.taps = st.taps.filter((_, j) => j !== k); else st.order = st.order.filter((_, j) => j !== k);
        changed();
      }
      const changed = () => { draw(); api.changed(); };

      // ---------------------------------------------------------------- the picture twin
      const pool = h("div", { class: "visualonly cards" });
      pool.addEventListener("click", (e) => { const c = e.target.closest("[data-i]"); if (c) tap(Number(c.dataset.i)); });
      const row = h("div", { class: "visualonly slots" });
      row.addEventListener("click", (e) => { const c = e.target.closest("[data-s]"); if (c) unstep(Number(c.dataset.s)); });
      const baskets = h("div", { class: "visualonly bins" });
      baskets.addEventListener("click", (e) => {
        const c = e.target.closest("[data-i]"); if (c) return tap(Number(c.dataset.i)); // a card already in a basket: lift it out
        const b = e.target.closest("[data-b]"); if (b) drop(Number(b.dataset.b));
      });
      // ---------------------------------------------------------------- the buttons twin
      const list = h("div", { class: `dom twin ${kind}`, role: "group", "aria-label": item.q });
      const steps = h("ol", { class: "dom steps", "aria-label": kind === "build" ? "The steps" : "In order" });

      const place = (i) => (kind === "order" && st.order.includes(i) ? `, number ${st.order.indexOf(i) + 1}` : "");
      function draw() {
        const sorting = kind === "sort", building = kind === "build";
        pool.replaceChildren(...item.cards.map((_, i) => (sorting && st.bins[i] >= 0) ? null : face(look(i), words,
          [st.pick === i || st.set.includes(i) || st.order.includes(i) ? "on" : "", st.held === i ? "held" : "", st.out.includes(i) ? "out" : ""].join(" "),
          { "data-i": i, "aria-hidden": "true" })).filter(Boolean));
        if (kind === "order" || building) {
          const got = building ? st.taps : st.order;
          row.replaceChildren(...Array.from({ length: building ? slots : n }, (_, k) => got[k] === undefined
            ? face({ draw: (g) => C.text(g, 50, 50, `${k + 1}`, 44, "#8a8fa8") }, false, "empty", { "aria-hidden": "true" })
            : face(look(got[k]), words, "placed", { "data-s": k, "aria-hidden": "true" })));
        }
        if (sorting) baskets.replaceChildren(...item.bins.map((_, b) => {
          const B = bin(b), el = h("div", { class: "bin", "data-b": b, "aria-hidden": "true" },
            h("div", { class: "binhead" }, B.art || B.draw ? thumb(B) : null, h("span", {}, B.name)));
          el.append(h("div", { class: "inbin" }, ...item.cards.flatMap((_, i) => (st.bins[i] === b ? [face(look(i), false, "small", { "data-i": i })] : []))));
          return el;
        }));
        // The buttons twin: the same cards and acts.
        if (sorting) list.replaceChildren(...item.cards.map((_, i) => h("div", { class: "sortrow", role: "group", "aria-label": look(i).name },
          h("span", { class: "rowname" }, thumb(look(i)), look(i).name),
          ...item.bins.map((_, b) => h("button", { type: "button", class: "secondary", "data-c": i, "data-b": b, "aria-pressed": String(st.bins[i] === b),
            onclick: () => drop(b, i) }, bin(b).name)))));
        else list.replaceChildren(...item.cards.map((_, i) => h("button", { type: "button", class: "secondary pickbtn", "data-i": i,
          "aria-pressed": building ? false : String(st.pick === i || st.set.includes(i) || st.order.includes(i)), disabled: st.out.includes(i),
          "aria-label": `${look(i).name}${place(i)}`, onclick: () => tap(i) }, thumb(look(i)), h("span", {}, look(i).name))));
        if (kind === "order" || building) steps.replaceChildren(...(building ? st.taps : st.order).map((i, k) =>
          h("li", {}, h("button", { type: "button", class: "secondary", "data-s": k, "aria-label": `${building ? "Step" : "Number"} ${k + 1}: ${look(i).name}. Take it out`,
            onclick: () => unstep(k) }, `${k + 1}. ${look(i).name}`))));
        if (scene && scene.update) scene.update(current());
        api.refresh();
      }
      /** The answer so far, in the server's shape. */
      const current = () => (kind === "pick" ? { pick: st.pick } : kind === "multi" ? { pieces: st.set.slice().sort((a, b) => a - b) }
        : kind === "order" ? { order: st.order.slice() } : kind === "sort" ? { bins: st.bins.slice() } : { taps: st.taps.slice() });
      const fromAnswer = (res) => ({ ...blank(), pick: res.pick ?? -1, set: res.pieces || [], order: res.order || [], bins: res.bins || Array(n).fill(-1), taps: res.taps || [], held: -1 });
      const solution = () => (kind === "pick" ? { pick: item.want[0] } : kind === "multi" ? { pieces: item.want } : kind === "order" ? { order: item.want }
        : kind === "sort" ? { bins: item.want } : { taps: item.want });

      if (scene) area.append(scene.el);
      // A game with something to listen to: one button, the same in both views, as often as the child likes.
      if (G.hear) area.append(h("button", { type: "button", class: "secondary hear", "data-act": "hear", onclick: () => G.hear(item) }, "Hear it again"));
      const fig = h("div", { class: "manip wide cardboard" }, pool, row, baskets, list, steps); // the question is the prompt above
      if (kind !== "order" && kind !== "build") { row.remove(); steps.remove(); }
      if (kind !== "sort") baskets.remove();
      area.append(fig);
      const flash = async (places, cls, ms) => {
        const els = places.flatMap((i) => [...area.querySelectorAll(`[data-i="${i}"]`)]);
        els.forEach((e) => e.classList.add(cls)); await wait(ms); els.forEach((e) => e.classList.remove(cls));
      };
      /** The places the child got wrong (from the answer the server issued: it only marks, it never decides). */
      const wrong = () => kind === "pick" ? (st.pick === item.want[0] ? [] : [st.pick])
        : kind === "multi" ? item.cards.map((_, i) => i).filter((i) => st.set.includes(i) !== item.want.includes(i))
        : kind === "sort" ? st.bins.flatMap((b, i) => (b !== item.want[i] ? [i] : []))
        : kind === "order" ? st.order.flatMap((i, k) => (i !== item.want[k] ? [i] : [])) : [];

      draw();
      return {
        begin(retry) { api.prompt(retry ? `Try again. ${item.q}` : item.q, ""); if (G.hear && !retry) G.hear(item); },
        ready: () => (kind === "pick" ? st.pick >= 0 : kind === "multi" ? st.set.length > 0 : kind === "order" ? st.order.length === n
          : kind === "sort" ? st.bins.every((b) => b >= 0) : st.taps.length > 0),
        response: current,
        state: () => JSON.parse(JSON.stringify(st)),
        restore(s) { st = { ...blank(), ...JSON.parse(JSON.stringify(s)) }; draw(); },
        async model() { // the demonstrator: the answer, one card at a time
          const sol = fromAnswer(solution());
          if (kind === "pick") { st.pick = sol.pick; draw(); }
          else for (let k = 1; k <= (kind === "sort" ? n : sol.set.length + sol.order.length + sol.taps.length); k++) {
            st = { ...blank(), held: -1, set: sol.set.slice(0, k), order: sol.order.slice(0, k), taps: sol.taps.slice(0, k),
              bins: sol.bins.map((b, i) => (i < k ? b : -1)) };
            draw(); await wait(650);
          }
          if (scene && scene.model) await scene.model(solution()); else await wait(1400);
        },
        async help(level, fb) {
          api.say(fb.feedback || "Let's look again.");
          const bad = wrong();
          if (scene && scene.help) await scene.help(level, fb, current()); // the scene shows what happened first
          await flash(bad, "nope", 1600);
          if (level >= 2) { // a gentler try: the wrong cards go back, and one wrong choice leaves the table
            if (kind === "sort") st.bins = st.bins.map((b, i) => (bad.includes(i) ? -1 : b));
            if (kind === "order") { const k = st.order.findIndex((i, j) => i !== item.want[j]); st.order = st.order.slice(0, k < 0 ? n : k); }
            if (kind === "pick" || kind === "multi") {
              const spare = item.cards.map((_, i) => i).filter((i) => !item.want.includes(i) && !st.out.includes(i));
              if (spare.length > 1) st.out = [...st.out, spare[0]];
              st.set = st.set.filter((i) => !st.out.includes(i)); if (st.out.includes(st.pick)) st.pick = -1;
            }
            if (kind === "sort") st.held = st.bins.indexOf(-1);
          }
          draw();
          api.prompt(`Try again. ${item.q}`, "");
        },
        async worked(sol) { st = fromAnswer(sol); draw(); api.say("Here is one that works. Watch."); if (scene && scene.success) await scene.success(sol); else await wait(1800); },
        async success() { area.querySelectorAll(".pcard.on, .pcard.placed, .bin .pcard").forEach((e) => e.classList.add("yay")); if (scene && scene.success) await scene.success(current()); else await wait(900); },
      };
    };
  }

  window.LumosCards = {
    face, pic,
    /** Run a picture-card game: the kit's loop, with these cards. */
    run(G) {
      K.run({ title: G.title, goal: G.goal, closure: G.closure, checkLabel: G.checkLabel,
        stages: new Proxy({}, { get: (_, s) => ({ name: (G.stages && G.stages[s]) || G.title }) }),
        praise: G.praise || (() => "Yes! That's it."), mount: mount(G) });
    },
    /** A drawn shape for draw(): a path with the house outline. */
    shape: (g, d, fill, extra = {}) => { const p = svg("path", { d, fill, class: "ink", ...extra }); g.append(p); return p; },
    circle: (g, cx, cy, r, fill) => { const c = svg("circle", { cx, cy, r, fill, class: "ink" }); g.append(c); return c; },
    text: C.text,
  };
})();
