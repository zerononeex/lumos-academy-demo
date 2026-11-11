// Push or Pull 1.0.0 (Physics · Pushes and pulls, K–3) on game kit 1.6.0 and picture cards 1.0.0: sort the actions into
// push (moves it away) and pull (brings it closer): a door, a wagon, a drawer, a swing. Grade 3 also names a two-step
// action (open the fridge, then shut it: pull, then push). Each card shows Ember pushing or pulling (the GA-060
// card sheet, cards/1.0.0/cards.js); the baskets' arrows are drawn in the house style.
(() => {
  "use strict";
  const C = window.LumosCards;
  const away = (g) => C.shape(g, "M20 84h44l-8-8m8 8l-8 8", "none", { "stroke-width": 5 });
  const toward = (g) => C.shape(g, "M64 84H20l8-8m-8 8l8 8", "none", { "stroke-width": 5 });
  C.run({
    title: "The Mighty Movers",
    goal: "Is it a push or a pull?",
    closure: "All done! You sorted lots of pushes and pulls today.",
    stages: { "pushpull.sort": "Push or pull?", "pushpull.two": "Two steps" },
    praise: () => "Yes! Away is a push; toward is a pull.",
    look: C.word,
    bin: (id) => ({ name: id, draw: id === "push" ? away : toward }),
  });
})();
