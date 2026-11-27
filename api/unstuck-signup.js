// Vercel serverless function: adds an Unstuck sign-up to Brevo.
// Needs two environment variables in Vercel (Settings > Environment Variables):
//   BREVO_API_KEY  - your Brevo API key (never put it in this file)
//   BREVO_LIST_ID  - the Unstuck list ID (8)
// Makes sure the SIGNUP_SOURCE contact attribute exists in Brevo (once per warm instance).
let sourceAttrReady = false;
async function ensureSourceAttr(apiKey) {
  if (sourceAttrReady) return;
  try {
    const r = await fetch("https://api.brevo.com/v3/contacts/attributes/normal/SIGNUP_SOURCE", {
      method: "POST",
      headers: { "api-key": apiKey, "accept": "application/json", "content-type": "application/json" },
      body: JSON.stringify({ type: "text" })
    });
    // 201 = created, 400 = already exists. Either way we can use it.
    if (r.status === 201 || r.status === 400) sourceAttrReady = true;
  } catch { /* never block a sign-up over tracking */ }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: real people never fill this hidden field, bots usually do.
  if (body.company) return res.status(200).json({ ok: true });

  const email = String(body.email || "").trim().toLowerCase();
  const firstName = String(body.firstName || "").trim().slice(0, 50);
  const source = String(body.source || "direct").replace(/[^\w./:-]/g, "").slice(0, 80) || "direct";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
  }
  if (!firstName) {
    return res.status(400).json({ ok: false, error: "Please enter your first name." });
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.brevo_api_key;
  const listId = Number(process.env.BREVO_LIST_ID || 8);
  if (!apiKey) {
    console.error("BREVO_API_KEY is not set");
    return res.status(500).json({ ok: false, error: "Sign-up isn't available right now. Please try again later." });
  }

  await ensureSourceAttr(apiKey);
  const send = (attributes) => fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "api-key": apiKey, "accept": "application/json", "content-type": "application/json" },
    body: JSON.stringify({ email, attributes, listIds: [listId], updateEnabled: true })
  });

  try {
    let r = await send({ FIRSTNAME: firstName, SIGNUP_SOURCE: source });
    // If Brevo rejects the tracking field for any reason, still sign them up without it.
    if (r.status === 400) r = await send({ FIRSTNAME: firstName });
    if (r.status === 201 || r.status === 204) {
      return res.status(200).json({ ok: true });
    }
    const detail = await r.text();
    console.error("Brevo error", r.status, detail);
    return res.status(502).json({ ok: false, error: "Something went wrong on our side. Please try again in a minute." });
  } catch (e) {
    console.error("Brevo request failed", e);
    return res.status(502).json({ ok: false, error: "Something went wrong on our side. Please try again in a minute." });
  }
}
