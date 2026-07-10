import { useState } from "react";

// KDPT Email Signup — brand colours: black (#0B0B0B) + mint (#3DDC97)
// Drop this component anywhere in your site (a page, a section, a modal).
// It posts to /api/subscribe, which forwards the contact to Brevo.

export default function EmailSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div style={styles.card}>
        <div style={styles.badge}>YOU'RE IN</div>
        <h3 style={styles.successHeadline}>Check your inbox</h3>
        <p style={styles.successBody}>
          Your free guide is on its way. Add hello@kdpersonaltraining.com to your contacts so it doesn't land in spam.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <p style={styles.eyebrow}>FREE GUIDE</p>
      <h3 style={styles.headline}>30 High Protein Meals in 15 Minutes or Less</h3>
      <p style={styles.subcopy}>
        Simple, high-protein meals you can actually stick to. Straight to your inbox, free.
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="First name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          autoComplete="given-name"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            ...styles.button,
            opacity: status === "loading" ? 0.6 : 1,
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Sending..." : "Send Me The Guide"}
        </button>

        {status === "error" && <p style={styles.errorText}>{errorMsg}</p>}
      </form>

      <p style={styles.disclaimer}>No spam. Unsubscribe any time.</p>
    </div>
  );
}

const styles = {
  card: {
    background: "#0B0B0B",
    borderRadius: "16px",
    padding: "32px 28px",
    maxWidth: "440px",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "'Poppins', sans-serif",
    border: "1px solid #1F1F1F",
  },
  eyebrow: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#3DDC97",
    margin: "0 0 10px 0",
  },
  headline: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "24px",
    fontWeight: 800,
    color: "#FFFFFF",
    margin: "0 0 10px 0",
    lineHeight: 1.25,
  },
  subcopy: {
    fontSize: "14px",
    color: "#B7B7B7",
    lineHeight: 1.5,
    margin: "0 0 22px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    background: "#161616",
    border: "1px solid #2A2A2A",
    borderRadius: "10px",
    padding: "13px 14px",
    fontSize: "14px",
    color: "#FFFFFF",
    outline: "none",
    fontFamily: "'Poppins', sans-serif",
  },
  button: {
    marginTop: "6px",
    background: "#3DDC97",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: "#0B0B0B",
    fontFamily: "'Montserrat', sans-serif",
  },
  disclaimer: {
    fontSize: "11px",
    color: "#6B6B6B",
    marginTop: "14px",
    textAlign: "center",
  },
  errorText: {
    fontSize: "13px",
    color: "#FF6B6B",
    margin: "4px 0 0 0",
  },
  badge: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#3DDC97",
    marginBottom: "10px",
  },
  successHeadline: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: "22px",
    fontWeight: 800,
    color: "#FFFFFF",
    margin: "0 0 8px 0",
  },
  successBody: {
    fontSize: "14px",
    color: "#B7B7B7",
    lineHeight: 1.5,
    margin: 0,
  },
};
