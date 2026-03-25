# Drift Playtest Agent Handoff

## Purpose
This build is a playtest, not a launch-ready product.

The goal is to validate two things quickly:
- The core interaction is fun: sorting words oldest to newest.
- The reveal content is clear and rewarding after each submission.

## Playtest Scope
In scope:
- 5 rounds per session.
- 4 words per round.
- Player sorts words oldest to newest.
- Submit once per round.
- Reveal canonical order with year + one-line explanation.
- Show running score and final session score.
- Move to next round until session complete.

Out of scope:
- Accounts and identity persistence.
- Streaks and share flows.
- Daily scheduling/publishing systems.
- Analytics dashboards.
- Monetization UI and billing UX polish.

## Game Loop Contract
Input (single round):
- `theme`
- `prompt`
- `items` (4 labels shown to player)
- `correct_order` (oldest -> newest keys)
- `reveal` (ordered reveal copy with year + description)

Interaction:
- Player drags/reorders the 4 items.
- On submit, lock the answer and prevent retries for that round.
- No editing order after submit.

Output:
- Per-position correctness.
- Round reveal in canonical order.
- Running score.
- Session summary after round 5.

## Content Model
Use this JSON round contract:

```json
{
  "id": "round-1",
  "theme": "Words from the wardrobe",
  "prompt": "Sort these words from the wardrobe",
  "items": [
    { "key": "breeches", "label": "BREECHES" },
    { "key": "pantaloons", "label": "PANTALOONS" },
    { "key": "pants", "label": "PANTS" },
    { "key": "fancy_pants", "label": "FANCY PANTS" }
  ],
  "correct_order": ["breeches", "pantaloons", "pants", "fancy_pants"],
  "reveal": [
    {
      "key": "breeches",
      "year": "Old English (~800s)",
      "description": "Among the oldest clothing words in English."
    },
    {
      "key": "pantaloons",
      "year": "1660s",
      "description": "Named after Pantalone in Italian commedia dell'arte."
    },
    {
      "key": "pants",
      "year": "1835",
      "description": "Shortened from pantaloons."
    },
    {
      "key": "fancy_pants",
      "year": "1870",
      "description": "Started as fabric wording, then became playful insult slang."
    }
  ]
}
```

Guidance for reveal writing:
- Keep lines short and conversational.
- Stay warm and curious, never scolding.
- Prioritize "interesting surprise" over quiz-like correction tone.

## Frontend State Machine
State sequence:
- `loading`
- `in_round`
- `submitted`
- `revealed`
- `next_round`
- `session_complete`

Transition rules:
- `in_round -> submitted`: allowed exactly once per round.
- `submitted -> revealed`: automatic after scoring.
- `revealed -> next_round`: only when player confirms continue.
- `next_round -> in_round`: only if rounds remain.
- `revealed -> session_complete`: only on round 5.

Hard guardrails:
- Disable dragging/reordering in `submitted`, `revealed`, and `session_complete`.
- Reject duplicate submit events for the same round id.

## Scoring Rules
- Round score: count of correctly positioned items (0-4).
- Session score: sum of 5 round scores (0-20).
- UI should show:
  - Current round score.
  - Running total after each reveal.
  - Final session total on completion.

## Implementation Hints for External Agent
Use a clear split:
- `content/drift-rounds.json`: static round fixtures.
- `game/engine`: pure validation/scoring functions.
- `ui/components`: drag list, reveal panel, score panel, session summary.

Implementation guidance:
- Keep answer evaluation deterministic and side-effect free.
- Keep content loading decoupled from scoring logic.
- Add a deterministic seed/test mode so playtest sessions can be replayed exactly.

## Acceptance Checklist
- A player can complete all 5 rounds in one uninterrupted session.
- Every reveal shows canonical oldest->newest order with year + one-line description.
- Score output matches fixture-based expected results.
- Basic usability on desktop and mobile viewport widths.

## Known Tradeoffs
- No anti-cheat controls.
- No durable persistence across app restarts.
- No account continuity between devices.
- Deliberately optimized for framework and mechanic validation, not production launch.
