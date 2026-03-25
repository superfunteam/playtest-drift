# Drift — Playtest Brief

## What is this?

Drift is a daily word game for *That's What They Say*, a weekly language podcast on Michigan Public (NPR). The podcast is hosted by Anne Curzan, a linguist at the University of Michigan, and Rebecca Hector, the station's All Things Considered host. Each episode explores how English words change over time — where they came from, what they used to mean, and why we say what we say.

Drift turns that into a game.

## How it works

Each round gives the player a theme and four words. The player sorts them from oldest to newest based on when each word took on its relevant meaning. After submitting, the correct order is revealed with a year and a one-line explanation for each word.

That's it. Sort four words. See how you did. Learn something.

## Example round

**Theme:** "Sort these words from the wardrobe"

The player sees: `PANTS` · `BREECHES` · `FANCY PANTS` · `PANTALOONS`

The player drags them into what they think is chronological order and hits submit.

**Reveal:**

1. **BREECHES** — Old English (~800s) — Among the oldest clothing words in English.
2. **PANTALOONS** — 1660s — Named after a foolish old man in Italian comic theater.
3. **PANTS** — 1835 — Shortened from pantaloons. Once considered vulgar.
4. **FANCY PANTS** — 1870 — First described a fabric. Later became a playful insult.

## What we're building

A simple, playable prototype — not a production app. The goal is to put the game in front of people and see if the core mechanic is fun. Does sorting words by date feel satisfying? Are the reveals interesting? Does it make you want to play again tomorrow?

The prototype should support:

- Displaying a theme and four draggable/sortable words
- Submitting your answer
- Revealing the correct order with year and description for each word
- A simple score (how many did you place correctly)
- Moving to the next round (five rounds per session in the sample content)

It does not need: accounts, streaks, sharing, daily rotation, a backend, analytics, or polish. This is a playtest.

## Sample content

We have five rounds ready, all sourced from real TWTS episodes:

1. **Words from the wardrobe** — Breeches, Pantaloons, Pants, Fancy Pants
2. **Words that went from quirky to grumpy** — Crotchet, Crank, Cranky, Crotchety
3. **Words for "right exactly there"** — Slap Bang, Lickety Split, Smack Dab, Bang On
4. **Words from the pepper plant** — Pepper (verb), Peppery, Pep, Peppy
5. **Words born from luck** — Hap, Mishap, Perhaps, Happy

Full content with dates and reveal descriptions is in the companion file: `Drift-Example-Content.md`

## Tone

The show's tone is warm, curious, and never condescending. The game should match. When you get the order wrong, the reveal should feel like a fun surprise — "huh, I didn't know that!" — not a quiz you failed. Every round should leave the player a little smarter and a little more curious about words.
