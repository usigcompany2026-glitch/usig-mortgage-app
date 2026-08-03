# USIG Short-Form Video Library

Scripts, hooks, and storyboards for the 2-day short-form video sprint covering
**USIG.ai** (residential, commercial, and financing analysis) and
**biz.usig.ai** (Business Growth Advisory / AI assistant for small business).

This is the "Claude" stage of the production pipeline:

```
Claude (this folder)  →  Higgsfield (cinematic video generation)  →  CapCut / Canva (captions, branding, finishing)  →  Scheduler
```

Each script is written to be handed directly to Higgsfield as a shot-by-shot
prompt list, and to CapCut/Canva for caption timing and brand kit application.

## Contents

| File | Videos | Focus |
|---|---|---|
| [`day1-usig-analysis.md`](./day1-usig-analysis.md) | 15 | USIG Residential, Commercial, and Financing Analysis |
| [`day2-business-growth.md`](./day2-business-growth.md) | 15 | biz.usig.ai — Business Growth Advisory |
| [`posting-schedule.md`](./posting-schedule.md) | — | 4-week posting cadence across platforms |

**Total: 30 scripts** — within the 20–30 target for the sprint.

## The formula (every script follows this beat sheet)

| Time | Beat | Goal |
|---|---|---|
| 0–3s | **Hook** | Stop the scroll. Question, bold claim, or visual surprise. No logo, no throat-clearing. |
| 3–15s | **Problem** | Name the pain the viewer already feels. Make them nod. |
| 15–45s | **Solution** | Show USIG doing the thing — screen capture, number reveal, before/after. Concrete, not abstract. |
| 45–60s | **CTA** | One soft ask. Never "buy now" — always "see your number," "run a free analysis," "book a 15-min call." |

## Brand voice guardrails

Pulled from the live app (`index.html`): USIG positions itself as
**"Real Estate Financing Intelligence"** with **"Institutional-Grade Analysis
& Qualification."** Keep every script:

- **Confident, data-driven, credible** — lead with a number or a metric, not hype.
- **Investor/operator language**, not consumer-mortgage language. Speak to people who read P&Ls, not first-time homebuyers.
- **Product-anchored** — the solution beat should show or reference an actual USIG output (a report, a score, a DSCR, a comparison table), never a vague "we can help."
- **No fake urgency, no guaranteed-return claims, no "get rich" framing.** This is underwriting software, not a hype account.

## Format & delivery notes for Higgsfield / CapCut

- **Native aspect ratio:** shoot/generate in **9:16** (vertical) as the master. Reels, Shorts, and TikTok are native 9:16.
- **Repurpose crops:**
  - LinkedIn feed & Facebook feed → **1:1** (square) crop, safe-title zone centered.
  - YouTube (if posted long-form or as a Short) → **16:9** for standard, 9:16 for Shorts.
- **Captions:** burn in captions on every video (CapCut auto-caption + manual cleanup). Sound-off viewing is the default — the hook line must also work as on-screen text.
- **Branding:** USIG logo bug bottom-right, low opacity, throughout. End card with logo + CTA text + URL for the last 2–3 seconds.
- **Length:** target 30–60s. Shorter (20–35s) performs better for hook-driven finance content; use the full 60s only when the solution beat needs a real walkthrough (e.g., DSCR explainer, loan comparison).

## How to use a script entry

Each entry gives you:

1. **Hook / Problem / Solution / CTA** — the spoken or on-screen script, timed.
2. **On-screen text** — the caption/lower-third cues, since most viewers watch muted.
3. **Shot list** — a numbered storyboard you can paste into Higgsfield scene-by-scene.
4. **Higgsfield prompt seed** — a starting cinematic-style prompt (subject, setting, camera move, mood) to drop into the generation tool and refine.
5. **Format** — aspect ratio guidance if it deviates from the 9:16 default.
