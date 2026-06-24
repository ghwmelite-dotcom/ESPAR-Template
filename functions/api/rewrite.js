// POST /api/rewrite — Workers AI helper (Qwen3-30B). Two modes:
//   mode:"target"     → rewrite a draft target into 2-3 SMART options (default)
//   mode:"competency" → 2 practical actions to strengthen a competency
// Guards: POST-only, input length cap, shared per-IP daily cap via KV.
// AI is additive; the page keeps offline tools as a fallback.

const MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
const MAX_INPUT = 400; // characters
const DAILY_CAP = 40;  // AI calls per IP per day (shared across both modes)

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    let body;
    try { body = await request.json(); } catch (e) { return json({ error: "Invalid request." }, 400); }

    const mode = (body && body.mode === "competency") ? "competency" : "target";
    const draft = (body && typeof body.draft === "string") ? body.draft.trim() : "";
    const focusArea = (body && typeof body.focusArea === "string") ? body.focusArea.trim().slice(0, 120) : "";
    const competency = (body && typeof body.competency === "string") ? body.competency.trim().slice(0, 80) : "";
    const rating = parseInt(body && body.rating, 10);

    // Per-mode input validation
    if (mode === "target") {
      if (!draft) return json({ error: "Please enter a draft target first." }, 400);
      if (draft.length > MAX_INPUT) return json({ error: "That target is too long — keep it under " + MAX_INPUT + " characters." }, 400);
    } else {
      if (!competency) return json({ error: "Pick a competency first." }, 400);
    }

    // Per-IP daily cap (shared across both AI features; skips silently if KV is unavailable)
    if (env.RL) {
      const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
      const day = new Date().toISOString().slice(0, 10);
      const key = "rl:" + ip + ":" + day;
      const used = parseInt((await env.RL.get(key)) || "0", 10) || 0;
      if (used >= DAILY_CAP) {
        return json({ error: "Daily AI limit reached (" + DAILY_CAP + "). The offline tools still work — please try again tomorrow." }, 429);
      }
      // expire ~26h after first write so the per-day key clears itself
      await env.RL.put(key, String(used + 1), { expirationTtl: 60 * 60 * 26 });
    }

    if (!env.AI) return json({ error: "AI is not configured." }, 503);

    let sys, user;
    if (mode === "competency") {
      const rl = rating === 1 ? "Developing" : rating === 2 ? "Solid" : rating === 3 ? "Strong" : "not yet rated";
      sys = [
        "You are a Ghana Civil Service appraisal coach for the OASL e-SPAR system (officers do stool-land revenue collection, disbursement, records and stakeholder work).",
        "An officer has self-rated on one of the seven core competencies.",
        "Give 2 concrete, practical actions the officer can take in their day-to-day stool-land work to strengthen this competency.",
        "Make the actions realistic for a public officer; if the rating is low, keep them simple and foundational.",
        "Each action ONE short sentence of plain professional English, under 28 words, starting with a verb.",
        "Return ONLY valid JSON in the form {\"options\":[\"...\",\"...\"]} with exactly 2 actions. No commentary, no markdown."
      ].join(" ");
      user = "Competency: " + competency + "\nOfficer's self-rating: " + rl;
    } else {
      sys = [
        "You are a Ghana Civil Service appraisal coach for the OASL e-SPAR system.",
        "Rewrite a vague or rough performance TARGET into clear SMART targets.",
        "SMART = Specific, Measurable, Achievable, Realistic, Time-framed.",
        "Each rewrite MUST contain: a clear action; a number or quantity; who it is reported to (e.g. the Supervisor or Director); and a deadline (a month, quarter or date).",
        "Keep each rewrite to ONE sentence of plain professional English, under 40 words.",
        "Use the 2026 appraisal cycle for any dates you add (months fall in 2026; a trailing January is January 2027).",
        "Return ONLY valid JSON in the form {\"options\":[\"...\",\"...\",\"...\"]} with 2 or 3 options. No commentary, no markdown."
      ].join(" ");
      user = (focusArea ? ("Focus area: " + focusArea + "\n") : "") + "Draft target: " + draft;
    }

    let ai;
    try {
      ai = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user }
        ],
        max_tokens: 800,
        temperature: 0.4
      });
    } catch (e) {
      return json({ error: "The AI is busy right now — please use the offline checker." }, 502);
    }

    const resp = ai ? (ai.response != null ? ai.response : ai.result) : null;
    let options = [];
    if (resp && typeof resp === "object") {
      if (Array.isArray(resp)) options = resp;
      else if (Array.isArray(resp.options)) options = resp.options;
      else options = parseOptions(JSON.stringify(resp));
    } else {
      options = parseOptions((resp != null ? resp : "").toString());
    }
    options = options
      .filter(function (s) { return typeof s === "string"; })
      .map(function (s) { return s.trim().replace(/^["']|["']$/g, ""); })
      .filter(Boolean)
      .slice(0, 3);
    if (!options.length) return json({ error: "Could not produce a clean rewrite — please use the offline checker." }, 502);
    return json({ options: options });
  } catch (e) {
    return json({ error: "Something went wrong." }, 500);
  }
}

function parseOptions(raw) {
  if (!raw) return [];
  let txt = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim().replace(/^```(?:json)?/i, "").replace(/```$/,"").trim();
  const tryParse = function (s) {
    try { const o = JSON.parse(s); if (o && Array.isArray(o.options)) return o.options; } catch (e) {}
    return null;
  };
  let opts = tryParse(txt);
  if (!opts) {
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) opts = tryParse(m[0]);
  }
  if (!opts) {
    opts = txt.split(/\n+/).map(function (s) { return s.replace(/^[\s\-\d.)•*]+/, "").trim(); }).filter(function (s) { return s.length > 15; });
  }
  return (opts || [])
    .filter(function (s) { return typeof s === "string"; })
    .map(function (s) { return s.trim().replace(/^["']|["']$/g, ""); })
    .filter(Boolean)
    .slice(0, 3);
}
