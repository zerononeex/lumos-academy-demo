// Gentle Toppling 1.0.0 (Physics · Building, K–3) on game kit 1.6.0 and picture cards 1.0.0: a soft ball rolls into a
// block tower. The ball pushes over the block it hits and every block above it; the blocks below stay. Predict how many
// fall, choose where the ball should hit, and (Grades 2–3) order hits from fewest falling to most; then watch the ball
// roll. A wrong aim rolls too, so the child sees what their choice does before trying again. LANDED ART: the wooden
// blocks (public/games/art/toppling, B5-T8, drawn side-on so the code can tip them). The ball is drawn.
(() => {
  "use strict";
  const C = window.LumosCards, K = window.LumosKit, { svg, h, wait } = K;
  const ART = ["02", "04", "01", "02", "04", "02", "01", "04"]; // cube, column, plank... bottom up
  const num = (id) => Number(id.match(/\d+/)[0]);
  /** A tower of n blocks in a 100 × 100 card, block `mark` glowing and the ball beside it. */
  function mini(g, n, mark) {
    const bh = Math.min(16, 84 / n);
    for (let k = 1; k <= n; k++) C.shape(g, `M46 ${92 - k * bh}h30v${bh - 1}H46z`, k === mark ? "#ffd23f" : "#f4c48b");
    C.circle(g, 26, 92 - mark * bh + bh / 2, 9, "#ff6b8b");
  }
  function tumble(g, k) { for (let i = 0; i < k; i++) C.shape(g, "M0 0h20v20H0z", "#f4c48b", { transform: `translate(${14 + (i % 3) * 26} ${20 + Math.floor(i / 3) * 26}) rotate(${(i % 2 ? 1 : -1) * 18} 10 10)` }); }
  C.run({
    title: "Gentle Toppling",
    goal: "Where the ball hits, and what falls.",
    closure: "All done! You worked out lots of towers today.",
    checkLabel: "Roll the ball",
    stages: { "topple.predict": "How many fall?", "topple.aim": "Where should it hit?", "topple.order": "Fewest to most" },
    praise: () => "Yes! The hit block and everything above it falls.",
    look: (id, item) => (id.startsWith("hit") ? { name: `${id} from the bottom`, word: id.replace("hit ", ""), draw: (g) => mini(g, item.data.n, num(id)) }
      : { name: id, draw: (g) => tumble(g, num(id)) }),
    scene(item) {
      const n = item.data.n, bh = Math.min(30, 200 / n), base = 210;
      const s = svg("svg", { viewBox: "0 0 360 220", "aria-hidden": "true", class: "topple" });
      s.append(svg("path", { d: "M10 212h340", stroke: "#1b1f3b", "stroke-width": 5, "stroke-linecap": "round" }));
      const tower = [];
      for (let k = 1; k <= n; k++) {
        const b = svg("g", { class: "block" });
        b.append(svg("image", { href: `../../art/toppling/${ART[k - 1]}.webp`, x: 190, y: base - k * bh - bh * 0.15, width: bh * 1.3, height: bh * 1.3, preserveAspectRatio: "none" }));
        const t = svg("text", { x: 190 + bh * 1.6, y: base - k * bh + bh * 0.6, "font-size": 16, "font-weight": 800, fill: "#1b1f3b" }); t.textContent = k;
        s.append(b, t); tower.push(b);
      }
      const ball = svg("circle", { cx: 40, cy: base - 14, r: 14, fill: "#ff6b8b", stroke: "#1b1f3b", "stroke-width": 4, class: "ball" });
      s.append(ball);
      const at = (hit) => base - (hit - 0.5) * bh;
      const show = (hit) => { ball.style.transform = hit ? `translate(0px, ${at(hit) - (base - 14)}px)` : ""; };
      const roll = async (hit) => {
        show(hit); await wait(400);
        ball.style.transform = `translate(${190 - 40 - 14}px, ${at(hit) - (base - 14)}px)`; await wait(500);
        tower.forEach((b, k) => { if (k + 1 >= hit) b.style.transform = `translate(${50 + (k + 1 - hit) * bh * 1.4}px, ${k * bh}px) rotate(${80 + (k % 3) * 5}deg)`; });
        await wait(1300);
        tower.forEach((b) => { b.style.transform = ""; }); show(0); await wait(400);
      };
      const hitOf = (res) => (item.stage === "topple.aim" ? (res.pick >= 0 ? num(item.cards[res.pick]) : 0) : item.data.hit || 0);
      if (item.data.hit && item.stage === "topple.predict") show(item.data.hit);
      return {
        el: h("div", { class: "scene" }, s),
        update: (res) => item.stage === "topple.aim" && show(hitOf(res)),
        success: async (res) => { const hit = hitOf(res) || (item.stage === "topple.order" ? num(item.cards[res.order[0]]) : 0); if (hit) await roll(hit); },
        help: async (_l, _fb, res) => { if (item.stage === "topple.aim" && hitOf(res)) await roll(hitOf(res)); },
      };
    },
  });
})();
