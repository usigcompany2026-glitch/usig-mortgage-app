# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

USIG AI is a lead-qualification form for a mortgage/CRE brokerage (Brenda Le). The **deployed product is a static HTML/CSS/vanilla-JS site** (`index.html` + `app.js` + `styles.css`), hosted on Netlify. There is no build step, no bundler, and no npm dependency graph for the web app — it's plain script tags.

The repo also contains a **separate, unrelated React Native/Expo scaffold** (`App.js` — capital A, `app.json`, `package.json` with Expo deps) from an earlier attempt at a mobile app. It is not wired into the deployed site and duplicates the same form UI in React Native components instead of DOM. Don't assume changes to one affect the other — they are two independent implementations of the same form:

| Concern | Web (deployed) | Expo/RN (dormant) |
|---|---|---|
| Entry | `index.html` → `app.js` | `App.js` |
| Styling | `styles.css` (CSS custom properties) | `StyleSheet.create` inline in `App.js` |
| Run | open `index.html` / Netlify | `expo start` |

`USIG-MORTGAGE-APP-REACT-NATIVE (1).zip` is an archived snapshot of the RN scaffold plus a correctly-pathed `netlify/functions/submit-lead.js` and a `DEPLOY.md` — useful as a reference if the root files' relationship to Netlify functions is unclear (see gotcha below), but not something to edit in place.

## Architecture (web app — where real work happens)

**`index.html`** — the single page. Three `data-step` sections form a wizard:
1. Step 1 — loan type radio (`cre` vs `residential`)
2. Step 2 — two parallel field sets gated by `data-loan-type="cre"` / `="residential"` on the `<section>`; only the one matching the step-1 choice is shown
3. Step 3 — review + consent checkbox + submit

Each step-2 variant also embeds an "escape hatch" CTA button (inline `<style>` block + inline `<script>` at the bottom of `index.html`, not in `app.js`):
- CRE → `usigLaunchCRE()` reads specific field IDs (`fieldMap` object), builds a query string, and opens `cre-analyst.netlify.app` (an external underwriting tool) in a new tab.
- Residential → `usigLaunchSphere()` opens a hardcoded Sphere LOS URL (`SPHERE_POS_URL`) in a new tab.

These are separate from the main form submission — the user can trigger them without submitting the form, and the form stays open.

**`app.js`** — all step navigation, validation, and submission logic, driven by module-level `let` state (`currentStep`, `formData`) rather than a framework:
- `showStep(step)` / `nextStep()` / `prevStep()` — wizard navigation; step 2 visibility depends on `formData.loanType`.
- `validateStep(step)` — per-step required-field and checkbox-group validation using native HTML5 attributes + manual DOM queries (no schema/validation library).
- `scoreAndClassifyLead()` — **lead scoring lives entirely client-side.** Computes a 0–100 score from loan-type-specific signals (loan amount vs. `CONFIG.creMinimum`/`residentialMinimum`, DSCR, credit score, DTI, timeline, etc.) and sets `formData.leadQuality` to `'warm'` (score ≥ 60) or `'cold'`. Below-minimum loan amounts short-circuit to cold regardless of other signals.
- `buildGHLPayload()` / `buildTags()` / `buildCustomFields()` — shape the submission into a GoHighLevel (GHL) contact/opportunity payload, including routing tags like `immediate-follow-up` vs `90-day-follow-up` and `ai-text-nurture-{cre|residential}`.
- On submit, POSTs the payload as JSON to `CONFIG.webhookUrl` (`/.netlify/functions/submit-lead`).

**Serverless backend**: `submit-lead.js` (root) is the fuller version — creates/updates a GHL contact, creates a GHL opportunity, triggers a GHL automation workflow, and (for warm leads) sends a Twilio SMS to `BRENDA_PHONE`. `netlify-submit-lead.js` (root) is an older/simpler variant (contact create + unconditional SMS only). Both are Netlify Function handlers (`exports.handler`) expecting `GHL_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `BRENDA_PHONE` as environment variables — none are checked into the repo (as expected).

**⚠️ Functions-path gotcha**: `netlify.toml` sets `functions = "netlify/functions"`, but there is no `netlify/functions/` directory in this repo — `submit-lead.js` and `netlify-submit-lead.js` sit at the repo root. If the deployed webhook (`/.netlify/functions/submit-lead`) isn't resolving, this mismatch is the first thing to check; the zip's `usig-app/netlify/functions/submit-lead.js` shows the intended layout. When fixing, move/copy the function that should be live into `netlify/functions/submit-lead.js` rather than editing `netlify.toml` to point elsewhere, unless asked otherwise.

**Styling** (`styles.css`): CSS custom properties define the brand system — navy `--navy: #001f3f`, gold `--gold: #D4AF37`, plus spacing (`--spacing-*`) and radius/shadow tokens. New UI should reuse these variables rather than hardcoding colors — note the inline `<style>` block inside `index.html` for the CTA buttons duplicates navy/gold as literal hex instead of `var(--navy)`/`var(--gold)`; match existing patterns nearby rather than introducing a third convention.

## Running / testing locally

No build tooling exists for the web app — there's nothing to compile or bundle.
- Serve statically, e.g. `npx serve .` or open `index.html` directly, then exercise the 3-step form in a browser.
- Netlify Dev (`netlify dev`, if the Netlify CLI is installed) is the only way to exercise the `/.netlify/functions/*` endpoints locally, and requires the env vars listed above.
- There are no automated tests, linters, or CI configured in this repo — verify changes manually in a browser (`/verify` skill or similar) rather than expecting a test command to exist.

For the dormant Expo/RN app: `npm install` then `npm run web` / `npm run ios` / `npm run android` (scripts defined in `package.json`), but confirm with the user before investing effort here — it's not part of the live product.

## Deployment

Netlify auto-builds from `netlify.toml`: build command is a no-op (`echo 'Build complete'`), publish directory is `.` (repo root), with a catch-all redirect to `index.html`. `DEPLOY_SCRIPT.sh` is a one-time, interactive setup script (GitHub repo creation + Netlify import walkthrough) written for the original project setup — it is not a repeatable deploy command and references a `usig-app` subdirectory that doesn't exist at repo root; treat it as historical documentation, not something to run as-is.

## Key conventions when editing the form

- CRE and residential are genuinely different questionnaires (1003-style for residential, DSCR/cap-rate/NOI-style for CRE) — when adding a field, add it to the correct step-2 `<section>` only, and thread it through `scoreAndClassifyLead()`, `buildOpportunityDescription()`, and `buildCustomFields()` in `app.js` if it should affect scoring or show up in GHL.
- Field `name` attributes are shared across CRE/residential where the semantics match (e.g. both use `name="loanAmount"`, `name="location"`) so `app.js` selectors like `document.querySelector('input[name="loanAmount"]')` work regardless of which step-2 variant is active — keep new fields consistent with this naming rather than inventing loan-type-prefixed names.
- `CONFIG` at the top of `app.js` (loan minimums, webhook URL, GHL location ID) is the single place to change thresholds — don't hardcode `1000000`/`100000` elsewhere.
