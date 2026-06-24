# E-SPAR Interactive Training — Configurable Institution Template

A self-contained, single-file interactive training on the **Staff Performance
Appraisal System** and **e-SPAR** for officers of the Ghana Civil Service.

This is the **re-brandable template** version of the OASL e-SPAR training. The
appraisal mechanics (the 7 competencies, scoring, the appraisal cycle, quizzes,
and the AI SMART-target rewrite) are identical across the whole Civil Service and
are fixed. Only the institution **identity**, **mandate**, the **welcome line**,
and the **worked example** change from one institution to the next — and almost
all of that is driven by a single `CONFIG` block.

The whole application is one file: `public/index.html`. There is no build step.

---

## How to re-brand for your institution

There are exactly **two** places to edit:

1. The **`CONFIG` block** — for identity, mandate, framework line and welcome.
2. The **WORKED EXAMPLE zone** — for the deep, persona-driven appraisal example.

### 1 · The `CONFIG` block

Near the top of `public/index.html`, inside `<head>`, there is a clearly-marked
block:

```js
/* ▼▼▼  INSTITUTION CONFIG — EDIT THIS BLOCK TO RE-BRAND  ▼▼▼ */
const CONFIG = { ... };
/* ▲▲▲  END INSTITUTION CONFIG  ▲▲▲ */
```

On page load, `applyConfig()` reads `CONFIG`, sets the document title and meta
description, then walks every element marked `data-cfg="<key>"` and replaces its
text (or its HTML, if the element also has `data-cfg-html`). This preserves the
DOM and all event listeners — nothing else needs to change.

| Field | What it controls |
|---|---|
| `abbr` | The short institution abbreviation in the brand header (e.g. `GCS`). |
| `title` | The browser tab title (`<title>`) and the document title. |
| `metaDesc` | The `<meta name="description">` used by search engines and link previews. |
| `brandSubtitle` | The full institution name shown under the brand in the header. |
| `heroSub` | The audience phrase in the hero subtitle ("A guided course for **…**"). |
| `purposeLink` | The possessive used in "links your daily job to **…** national mandate". |
| `serviceObjective` | The institution's mandate paragraph in the Objectives section (HTML allowed). |
| `frameworkLine` | The line describing how the cross-service framework applies to your institution. |
| `institutionTier` | The institutional level in the planning-tier diagram (Directorate / Division / Unit Action Plans). |
| `welcome` | The hero date/welcome banner line (HTML allowed). |
| `footer` | The site footer line (HTML allowed). |

To re-brand, edit the values in `CONFIG`. Fields whose markup uses
`data-cfg-html` (`serviceObjective`, `welcome`, `footer`) may contain inline
HTML such as `<b>` or `<span>`; the rest are plain text.

### 2 · The WORKED EXAMPLE zone

The training contains one continuous, hand-built worked example following a single
officer through Planning → Mid-year → Self-assessment → End-year. Because the same
targets are re-worded differently in each phase and must stay internally
consistent, this is **not** driven by `CONFIG` — it is plain HTML you edit
directly.

Find it in `public/index.html` between the comments:

```html
<!-- ▼ WORKED EXAMPLE — edit freely for your institution -->
...
<!-- ▲ END WORKED EXAMPLE -->
```

The template ships with a **Schedule Officer in a directorate** persona built
around five focus areas:

1. **Core Mandate Delivery**
2. **Human Resource Management & Staff Development**
3. **Information, Records & Data Management**
4. **Stakeholder Engagement & Public Education**
5. **Corporate Performance, Reporting & Budget**

Replace the target wording, status notes, scores and comments with an example that
fits your institution. Keep each target's wording consistent wherever it reappears
across the four phases. The AI-rewrite sample drafts and the competency behaviour
examples live in the `<script>` section further down and can be edited the same
way.

---

## Local preview

It is a static file — open `public/index.html` in a browser, or serve the folder:

```bash
npx wrangler pages dev public
```

The AI SMART-target rewrite (`functions/api/rewrite.js`) requires the Workers AI
binding and KV namespace defined in `wrangler.toml`; the rest of the training
works offline.

---

## Deploy (Cloudflare Pages)

This template deploys to the Cloudflare Pages project
**`espar-training-template`** via direct upload:

```bash
npx wrangler pages deploy public --project-name espar-training-template
```

> The Pages config does not support `account_id`. Set
> `CLOUDFLARE_ACCOUNT_ID` in your environment to the target account before
> running wrangler (see the note in `wrangler.toml`).

After editing `CONFIG` and the WORKED EXAMPLE zone, re-run the deploy command to
publish your institution's version.

---

## Project layout

```
public/index.html        The entire application (edit CONFIG + WORKED EXAMPLE here)
public/favicon.png       Favicon (institution-agnostic)
public/_headers          HTTP headers (institution-agnostic)
functions/api/rewrite.js Workers AI endpoint for the AI SMART-target rewrite
wrangler.toml            Cloudflare Pages / Workers AI / KV configuration
```
