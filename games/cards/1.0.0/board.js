// Lumos coding board 1.0.0 (with picture cards 1.0.0, loaded after cards.js): the board the coding games' programs run
// on, and their blocks. The server decides every answer (src/lib/cards/coding.ts runs the same rules); this only shows
// the star walking the child's program. Landed art: the staged-coding tiles and star sprites (public/games/art/
// staged-coding, SC-T1/T2, SC-A-sparkle, SC-B-classic): flat from above for K–1, isometric for Grades 2–3.
(() => {
  "use strict";
  const C = window.LumosCards, { svg, h, wait } = window.LumosKit;
  const ART = "../../art/staged-coding/";
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  /** The blocks a program really runs (P1 opened up; "repeat n times" makes the next block n times over). */
  function expand(prog, p1 = []) {
    const out = []; let times = 1;
    for (const b of prog) {
      const m = /^repeat (\d) times$/.exec(b);
      if (m) { times *= Number(m[1]); continue; }
      for (let k = 0; k < times; k++) out.push(...(b === "P1" ? p1 : [b]));
      times = 1;
    }
    return out;
  }
  /** Each step's place and facing (a bump into a rock or the edge stays put), and when a tile is lit. */
  function walk(d, prog) {
    let at = d.start, face = d.face; const steps = [];
    for (const s of expand(prog, d.p1)) {
      if (s === "turn left") face = (face + 3) % 4; else if (s === "turn right") face = (face + 1) % 4;
      else if (s === "forward") { const x = (at % d.w) + DX[face], y = Math.floor(at / d.w) + DY[face], n = y * d.w + x;
        if (x >= 0 && y >= 0 && x < d.w && y < d.h && !d.rocks.includes(n)) at = n; }
      steps.push({ at, face, light: s === "light" && d.targets.includes(at) });
    }
    return steps;
  }

  /** The board as a scene: run(prog) walks the star from the start. */
  C.board = (item, iso) => {
    const d = item.data, T = iso ? 128 : 100, s = svg("svg", { "aria-hidden": "true", class: "board" });
    const at = (c) => { const x = c % d.w, y = Math.floor(c / d.w); return iso ? [(x - y) * T / 2 + (d.h - 1) * T / 2, (x + y) * T / 4] : [x * T, y * T]; };
    s.setAttribute("viewBox", iso ? `0 0 ${(d.w + d.h) * T / 2} ${(d.w + d.h) * T / 4 + T * 0.75}` : `0 0 ${d.w * T} ${d.h * T}`);
    const tile = (c, k) => svg("image", { href: `${ART}${iso ? "iso" : "flat"}/0${k}.webp`, x: at(c)[0], y: at(c)[1], width: T, height: T });
    const lit = new Set(), tiles = new Map();
    const star = svg("svg", { width: T, height: T, viewBox: "0 0 256 256" }), sheet = svg("image", { href: `${ART}star-${iso ? "iso-classic" : "flat-classic"}.webp`, width: 1024, height: 1024 });
    star.append(sheet);
    const place = (c, face, frame = 0) => { const [x, y] = at(c); star.setAttribute("x", x); star.setAttribute("y", y - (iso ? T * 0.3 : 0)); sheet.setAttribute("x", -256 * frame); sheet.setAttribute("y", -256 * face); };
    const reset = () => {
      s.replaceChildren(); lit.clear();
      const cells = [...Array(d.w * d.h).keys()].sort((a, b) => (a % d.w + Math.floor(a / d.w)) - (b % d.w + Math.floor(b / d.w))); // back to front
      for (const c of cells) {
        const t = tile(c, d.rocks.includes(c) ? 5 : c === d.goal ? 4 : d.targets.includes(c) ? 2 : 1);
        tiles.set(c, t); s.append(t);
      }
      s.append(star); place(d.start, d.face);
    };
    const run = async (prog) => {
      reset();
      for (const [k, st] of walk(d, prog).entries()) {
        place(st.at, st.face, k % 4);
        if (st.light && !lit.has(st.at)) { lit.add(st.at); tiles.get(st.at).setAttribute("href", `${ART}${iso ? "iso" : "flat"}/03.webp`); }
        await wait(360);
      }
      await wait(500);
    };
    reset();
    return { el: h("div", { class: "scene" }, s), run };
  };

  const ARROW = { forward: "M50 14l26 30H60v40H40V44H24z", "turn left": "M70 86V46q0-14-14-14H40v14L14 26 40 6v14h16q26 0 26 26v40z",
    "turn right": "M30 86V46q0-14 14-14h16v14l26-20L60 6v14H44Q18 20 18 46v40z" };
  /** A block card: its arrow, a bulb, P1, or a loop with its count; a numbered step of a shown program draws its block. */
  C.block = (id) => {
    const b = id.replace(/^step \d+: /, "");
    const draw = ARROW[b] ? (g) => C.shape(g, ARROW[b], "#3c9cff")
      : b === "light" ? (g) => { C.circle(g, 50, 42, 24, "#ffd23f"); C.shape(g, "M40 66h20v14H40z", "#c9ccd6"); }
      : b === "P1" ? (g) => { C.shape(g, "M14 22h72v56H14z", "#b37bff"); C.text(g, 50, 52, "P1", 34, "#fff"); }
      : /^repeat/.test(b) ? (g) => { C.shape(g, "M50 16a34 34 0 1 1-30 18", "none", { "stroke-width": 8, stroke: "#3fae49" }); C.shape(g, "M10 26l12 16 14-14z", "#3fae49"); C.text(g, 50, 56, `×${b.split(" ")[1]}`, 28); }
      : null;
    return draw ? { name: id, word: b === id ? b : id.split(":")[0], draw } : C.word(id);
  };
  /** A coding game's scene: the board, and the star walking the program the answer makes (on Run, on a miss, and
   *  in the worked example). Grades 2–3 boards (5 × 5 and up) are isometric. */
  C.programScene = (item, progOf) => {
    const b = C.board(item, item.data.w * item.data.h >= 25), go = (res) => b.run(progOf(res));
    return { el: b.el, success: go, help: (_l, _f, res) => go(res), model: go };
  };
})();
