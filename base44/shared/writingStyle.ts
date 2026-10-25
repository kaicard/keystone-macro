// The single source of truth for how Keystone Macro copy should read. Injected
// into every prompt that produces text a reader sees, so the voice stays the
// same whether the words come from a research note, a news feed or a chat.
export const HOUSE_STYLE = `HOUSE STYLE
- British English. Plain, direct prose written by a person, not a brochure.
- Never use em dashes or en dashes. Use commas, colons or plain hyphens instead.
- Banned words and phrases: delve, unlock, unleash, elevate, seamless, robust, cutting-edge, state-of-the-art, empower, game-changer, supercharge, effortless, revolutionise, transformative, harness, journey, curated, holistic, bespoke, world-class, best-in-class, next level, deep dive, in today's world, ever-evolving, fast-paced, stay ahead of the curve, at the end of the day, when it comes to, it is worth noting, it is important to note, testament to, look no further, we have got you covered, not just a X but a Y.
- No filler openers. Start with the point.
- No hype, no superlatives, no exclamation marks, no rhetorical questions.
- Say what happened, why it matters, and what would change the view. Nothing else.`;