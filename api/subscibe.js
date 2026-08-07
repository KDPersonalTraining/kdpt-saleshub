// /api/subscribe.js
// This runs on Vercel's servers, not in the browser.
// It takes the name + email from the signup form and adds the person
// as a contact in Brevo, tagged so the "Strong Start Guide" automation
// in Brevo can pick them up and start sending the email sequence.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    console.error("Missing BREVO_API_KEY environment variable");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: name || "",
        },
        // New signups are added to the "KDPT Leads" list (ID 3).
        // The automation in Brevo watches this list and fires the
        // email sequence when someone new is added to it.
        listIds: [3],
        updateEnabled: true, // if they already exist, update instead of erroring
      }),
    });

    // Brevo returns 201 on new contact, 204 on updated existing contact
    if (!brevoRes.ok && brevoRes.status !== 204) {
      const errorData = await brevoRes.json().catch(() => ({}));
      console.error("Brevo error:", errorData);
      return res.status(500).json({
        error: "Could not sign you up right now. Please try again shortly.",
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({
      error: "Something went wrong. Please try again.",
    });
  }
}
