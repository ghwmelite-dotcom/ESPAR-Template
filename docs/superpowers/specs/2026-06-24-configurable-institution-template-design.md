# Configurable Institution Template — Design Spec

**Date:** 2026-06-24
**Status:** Approved (verbal) → implementing
**Source app:** `C:\dev\E-SPAR` (OASL e-SPAR training — must stay untouched, still live)
**This project:** `C:\dev\ESPAR-Template` (the mirror)

## Goal

A self-contained, single-file mirror of the E-SPAR training where every
institution-specific phrase is driven by a single `CONFIG` block near the top of
`public/index.html`. The e-SPAR mechanics (7 competencies, scoring, the appraisal
cycle, quizzes, AI rewrite) are identical across the whole Civil Service and stay
fixed. Only institution **identity**, **mandate**, the **welcome line**, and the
**worked example** change per institution.

Ships **generic-neutral** by default: a placeholder "Public Service Institution"
and a generic "Client Services Officer" worked example (processing client
applications within a service standard). The OASL regional **rollout schedules
are removed**.

## Configuration model

- **CONFIG-driven (via `data-cfg`):** identity, mandate, framework line, welcome.
  These are prominent, repeat, and are the "re-brand" knobs.
- **Hand-editable static (the WORKED EXAMPLE zone):** the deep worked-example
  sentences appear in *different wordings* per section (planning / mid-year /
  self-assessment / end-year) and must stay internally consistent, so they are a
  coherent generic persona in clearly-commented HTML — not CONFIG keys. The
  README tells adopters to edit that zone directly for institution-specific
  examples.

## Render mechanism

A `<script>` in `<head>` defines `CONFIG` and `applyConfig()`. On
`DOMContentLoaded`, `applyConfig()` sets `document.title`, the meta description,
and walks every `[data-cfg]` element setting `textContent` (or `innerHTML` when
the element also has `data-cfg-html`). Chosen over global innerHTML token-replace
because it preserves the DOM and event listeners and is debuggable.

### CONFIG object (exact)

```html
<script>
/* ============================================================
   ▼▼▼  INSTITUTION CONFIG — EDIT THIS BLOCK TO RE-BRAND  ▼▼▼
   The ONLY block to change to adapt this training to another
   institution. Everything below CONFIG is generic.
   (Detailed worked-example wording lives further down in the
   page, in the section marked "WORKED EXAMPLE" — edit it there.)
   ============================================================ */
const CONFIG = {
  abbr:            "PSI",
  title:           "Public Service · Staff Performance Appraisal & E-SPAR — Interactive Training",
  metaDesc:        "Interactive online training on the Staff Performance Appraisal System and e-SPAR for officers of the Public Service. Organised by OHCS.",
  brandSubtitle:   "Public Service Institution",
  heroSub:         "officers of your institution",
  purposeLink:     "your institution's",
  serviceObjective:"To assist Government in the <b>formulation and implementation of policies</b> for the development of the country. In your institution, this means delivering your mandate efficiently and accountably in service of the public.",
  frameworkLine:   "Provides the cross-service framework within which your institution operates its appraisal cycle.",
  institutionTier: "Your Institution's Directorate / Division / Unit Action Plans",
  welcome:         "<span style=\"color:var(--gold)\">📅</span> A 2-day online training on the Staff Performance Appraisal System &amp; e-SPAR — work through it at your own pace.",
  footer:          "© 2026 Public Service · e-SPAR Interactive Training <span class=\"dot\">·</span> Crafted by the <span class=\"team\">OHCS <span class=\"e\">e-SPAR</span> Team</span>"
};
/* ▲▲▲  END INSTITUTION CONFIG  ▲▲▲ */
function applyConfig(){
  document.title = CONFIG.title;
  var md = document.querySelector('meta[name="description"]');
  if(md) md.setAttribute('content', CONFIG.metaDesc);
  document.querySelectorAll('[data-cfg]').forEach(function(el){
    var k = el.getAttribute('data-cfg');
    if(CONFIG[k] == null) return;
    if(el.hasAttribute('data-cfg-html')) el.innerHTML = CONFIG[k];
    else el.textContent = CONFIG[k];
  });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyConfig);
else applyConfig();
</script>
```

### `data-cfg` markers (exact edits)

| Location | New markup |
|---|---|
| `<title>` / meta desc | set by `applyConfig()` (no markup change needed, but values come from CONFIG) |
| brand (≈490) | `<div class="brand"><span data-cfg="abbr">PSI</span> · E-SPAR Training<small data-cfg="brandSubtitle">Public Service Institution</small></div>` |
| hero sub (≈514) | `...course for <b data-cfg="heroSub">officers of your institution</b> — understand how...` |
| hero date (≈515) | `<p id="trainingDate" style="..." data-cfg="welcome" data-cfg-html><span style="color:var(--gold)">📅</span> A 2-day online training...</p>` |
| objectives "Learn the purpose" (≈531) | `...links your daily job to <span data-cfg="purposeLink">your institution's</span> national mandate.` |
| service objective (≈547) | `<p data-cfg="serviceObjective" data-cfg-html>To assist Government...</p>` |
| institutional tier (≈553) | `<p data-cfg="institutionTier">Your Institution's Directorate / Division / Unit Action Plans</p>` |
| framework line (≈637) | `<p style="..." data-cfg="frameworkLine">Provides the cross-service framework within which your institution operates its appraisal cycle.</p>` |
| footer (≈1786) | `<p class="ff" data-cfg="footer" data-cfg-html>© 2026 Public Service...</p>` |

## Schedule removal

1. **Hero banner script** (≈1790–1844, the `/* live training-schedule banner */`
   IIFE with the `SCHEDULE` array): **delete entirely.** `#trainingDate` is now
   static via `data-cfg="welcome"`.
2. **Hands-On tailored banner** (markup ≈1042–1049): replace region/dates with
   generic static —
   `<p class="pb-t">Before you start</p>`,
   `<div class="pb-r" id="pracRegion">Open the training portal</div>`,
   `<div class="pb-d" id="pracDates">Work through the phases below at your own pace</div>`.
3. **Hands-On `SESS` detection** (≈2019–2044, the `var SESS=[...]` block and the
   `if(sess&&rEl&&dEl){...}` that overwrites `pracRegion`/`pracDates`): **delete
   that sub-block only.** Keep the confetti and everything else in that IIFE.
4. **Keep** the appraisal-CYCLE month highlighter (`initCycle`, ≈2489) — it marks
   the current phase of the appraisal YEAR (planning/mid-year/end-year), which is
   generic, not institution-specific.

## Worked-example genericization (the WORKED EXAMPLE zone)

Persona: an unnamed **Client Services Officer**. Three focus areas:
1. **Service Delivery & Client Care**
2. **Quality Assurance & Accountability**
3. **Records & Data Management**

Apply this glossary consistently to every occurrence (≈ lines 547, 1073–1227,
1361, 1372–1458, 1505–1506, 1538–1608, 1649–1686, 2194, 2289, 2504–2510). Keep
all dates, numbers, reporting cadences, and scores unchanged — only swap the
domain vocabulary, keeping each target's wording consistent where it reappears.

| OASL term | Generic replacement |
|---|---|
| OASL / Office of the Administrator of Stool Lands | your institution / Public Service Institution |
| Stool Land Revenue Mobilisation (focus area) | Service Delivery & Client Care |
| Revenue Disbursement & Accountability (focus area) | Quality Assurance & Accountability |
| Stool Land Records & Data Management (focus area) | Records & Data Management |
| collect / lodge / mobilise stool-land revenue (ground rent, dues, royalties) | process client applications within the 10-working-day service standard |
| ground-rent arrears (reduce by ≥20%) | backlog of pending applications (reduce by ≥20%) |
| disburse using the constitutional formula (10% OASL; 25% stool, 20% traditional authority, 55% District Assembly) | apply the institution's service standards to all cases |
| disbursement / disburse | case handling / handle cases |
| reconcile disbursements against collections | review processed cases against the service standard |
| open/maintain an account for every stool | open/maintain a case file for every client |
| ground-rent demand notices | annual service charter |
| field revenue inspections | service-quality spot checks |
| ratepayers / traditional authorities / District Assemblies / beneficiaries | clients / stakeholders / stakeholder groups |
| sensitisation on stool-land payments & the disbursement formula | public-education sessions on the institution's services and standards |
| forum to account to stools & traditional authorities | forum to account to clients & stakeholders |
| Files accurate revenue returns | Files accurate service returns |
| GIS / land-data course for stool-land demarcation | customer-service excellence course |
| AI-rewrite SAMPLES & input placeholders (revenue/disbursement examples) | service-delivery / case-handling examples |

Wrap the genericized example region's opening with `<!-- ▼ WORKED EXAMPLE — edit
freely for your institution -->` and a matching close comment so adopters find it.

## Verification gate (hard)

After implementation, this must return **zero** matches over
`public/index.html`:

```
grep -niE 'oasl|stool|ground.?rent|ratepayer|disburse|arrears|royalt|traditional autho|district assembl|demand notice|revenue|mobilis' public/index.html
```

(`sensitis`/`beneficiar`/`lodge` also genericized; the grep above is the
authoritative clean check.)

## Other files

- `wrangler.toml`: project name → `espar-training-template`.
- `README.md`: rewrite to document the CONFIG block, the WORKED EXAMPLE zone, and
  the edit-then-redeploy flow.
- `functions/api/rewrite.js`, `_headers`, `favicon.png`: copied unchanged
  (institution-agnostic).

## Deployment

Build only. Commit / push / deploy happen **only** on the user's explicit
instruction (per project working style).
