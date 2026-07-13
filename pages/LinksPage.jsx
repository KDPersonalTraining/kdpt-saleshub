import { useState } from 'react';
import { ArrowRight, ExternalLink, BookOpen, Dumbbell, FileText, Percent } from 'lucide-react';

/**
 * KDPT Links Page — a branded "link in bio" hub for Instagram/TikTok.
 * Lives at start.kdpersonaltraining.com/links
 */

const LINKS = [
  {
    key: "guide",
    Icon: BookOpen,
    label: "Get My Free Strong Start Guide",
    tag: "Free",
  },
  {
    key: "coaching",
    Icon: Dumbbell,
    label: "Start Training With Me",
    tag: "Most popular",
    href: "https://start.kdpersonaltraining.com/#paths",
  },
  {
    key: "programme",
    Icon: FileText,
    label: "Personalised Programme",
    tag: "£49 one-off",
    href: "https://start.kdpersonaltraining.com/programmes",
  },
  {
    key: "nutrition",
    Icon: Percent,
    label: "20% Off Applied Nutrition",
    tag: "Code: KDPT",
    href: "https://www.appliednutrition.com",
    external: true,
  },
];

export default function LinksPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="lk-page">
      <style>{css}</style>
      <div className="lk-glow" />

      <div className="lk-inner">
        <div className="lk-header">
          <img src="/logo.png" alt="KDPT" className="lk-logo" />
          <h1 className="lk-title">KD Personal Training</h1>
          <p className="lk-subtitle">Coaching, built around you. Pick your next step below.</p>
        </div>

        <div className="lk-links">
          {LINKS.map((link) => {
            if (link.key === "guide") {
              return showForm ? (
                <SignupBlock key={link.key} />
              ) : (
                <button key={link.key} className="lk-link" onClick={() => setShowForm(true)}>
                  <span className="lk-link-icon"><link.Icon size={18} /></span>
                  <span className="lk-link-body">
                    <span className="lk-link-label">{link.label}</span>
                    <span className="lk-link-tag">{link.tag}</span>
                  </span>
                  <ArrowRight size={16} className="lk-link-arrow" />
                </button>
              );
            }
            return (
              <a
                key={link.key}
                className="lk-link"
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
              >
                <span className="lk-link-icon"><link.Icon size={18} /></span>
                <span className="lk-link-body">
                  <span className="lk-link-label">{link.label}</span>
                  <span className="lk-link-tag">{link.tag}</span>
                </span>
                {link.external ? <ExternalLink size={15} className="lk-link-arrow" /> : <ArrowRight size={16} className="lk-link-arrow" />}
              </a>
            );
          })}
        </div>

        <div className="lk-footer">
          <a href="https://www.instagram.com/kyle.coaching" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.tiktok.com/@kyle.coaching" target="_blank" rel="noopener noreferrer">TikTok</a>
          <a href="mailto:kyle.kdpt@gmail.com">Email</a>
        </div>
      </div>
    </div>
  );
}

function SignupBlock() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
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
      if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="lk-signup-card lk-signup-success-card">
        <p className="lk-signup-success">You're in! Check your inbox for your guide.</p>
      </div>
    );
  }

  return (
    <form className="lk-signup-card" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="First name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="lk-input"
      />
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="lk-input"
        required
      />
      <button type="submit" disabled={status === "loading"} className="lk-submit-btn">
        {status === "loading" ? "Sending..." : "Send Me The Guide"}
      </button>
      {status === "error" && <p className="lk-error">{errorMsg}</p>}
    </form>
  );
}

const css = `
.lk-page {
  background: #000000;
  min-height: 100vh;
  font-family: 'Poppins', sans-serif;
  padding: 56px 20px 60px;
  position: relative;
  overflow: hidden;
}
.lk-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background:
    radial-gradient(circle at 50% 5%, rgba(126,213,151,0.18) 0%, rgba(126,213,151,0) 30%),
    radial-gradient(circle at 50% 38%, rgba(126,213,151,0.09) 0%, rgba(126,213,151,0) 32%),
    radial-gradient(circle at 50% 68%, rgba(126,213,151,0.1) 0%, rgba(126,213,151,0) 32%),
    radial-gradient(circle at 50% 98%, rgba(126,213,151,0.13) 0%, rgba(126,213,151,0) 32%);
  pointer-events: none;
}
.lk-inner {
  position: relative;
  max-width: 420px;
  margin: 0 auto;
}
.lk-header {
  text-align: center;
  margin-bottom: 36px;
}
.lk-logo {
  height: 130px;
  width: auto;
  margin-bottom: 20px;
}
.lk-title {
  font-family: 'Montserrat', sans-serif;
  color: #ffffff;
  font-weight: 800;
  font-size: 22px;
  margin: 0 0 8px 0;
}
.lk-subtitle {
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  font-weight: 300;
  margin: 0;
  line-height: 1.5;
}

.lk-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lk-link {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 14px 16px;
  color: #ffffff;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
  font-family: inherit;
  text-align: left;
  width: 100%;
  box-sizing: border-box;
}
.lk-link:hover {
  border-color: rgba(126,213,151,0.5);
  transform: translateY(-2px);
}
.lk-link:active {
  transform: translateY(0px) scale(0.99);
}

.lk-link-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(126,213,151,0.1);
  border: 1px solid rgba(126,213,151,0.25);
  color: #7ED597;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease;
}
.lk-link:hover .lk-link-icon {
  background: #7ED597;
  color: #000000;
}

.lk-link-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.lk-link-label {
  font-size: 14.5px;
  font-weight: 600;
  color: #ffffff;
}
.lk-link-tag {
  font-size: 11px;
  font-weight: 600;
  color: #7ED597;
  letter-spacing: 0.04em;
}

.lk-link-arrow {
  flex-shrink: 0;
  color: rgba(255,255,255,0.3);
  transition: transform 0.2s ease, color 0.2s ease;
}
.lk-link:hover .lk-link-arrow {
  color: #7ED597;
  transform: translateX(3px);
}

.lk-signup-card {
  background: #141414;
  border: 1px solid rgba(126,213,151,0.35);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lk-signup-success-card {
  align-items: center;
  padding: 22px 18px;
}
.lk-input {
  background: #0B0B0B;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 13px 14px;
  font-size: 14px;
  color: #ffffff;
  font-family: inherit;
  outline: none;
}
.lk-submit-btn {
  background: #7ED597;
  border: none;
  border-radius: 10px;
  padding: 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #000000;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
}
.lk-signup-success {
  color: #7ED597;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  margin: 0;
}
.lk-error {
  color: #ff6b6b;
  font-size: 12.5px;
  margin: 0;
}

.lk-footer {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 36px;
}
.lk-footer a {
  color: rgba(255,255,255,0.4);
  font-size: 12.5px;
  text-decoration: none;
}
`;
