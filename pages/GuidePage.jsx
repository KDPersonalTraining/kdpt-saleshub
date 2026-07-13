import { useEffect, useState } from 'react';
import { Dumbbell, DoorOpen, CheckCircle2, Utensils, Flame, Quote, ArrowRight, Sparkles } from 'lucide-react';

/**
 * KDPT Strong Start Guide Page.
 * Black background, mint green accent (#7ED597), Montserrat headings, Poppins body.
 */

const CHECKS_STEP3 = [
  "The weight feels challenging but manageable",
  "You can control the movement from start to finish",
  "You feel the muscles you're supposed to be working",
  "You're improving small things over time (more reps, better form, more confidence)",
];

const NUTRITION = [
  { label: "Carbs", items: "Rice, potatoes, oats, quinoa, sweet potato, gluten-free pasta, beans, fruits" },
  { label: "Protein", items: "Chicken, eggs, Greek yoghurt, lentils, tofu, tempeh, fish, cottage cheese" },
  { label: "Healthy Fats", items: "Olive oil, avocado, nuts & seeds, peanut butter, almonds, coconut oil, chia and flax" },
];

const STEPS = [
  {
    n: "01",
    Icon: DoorOpen,
    title: "Get in the gym",
    subtitle: "Without overcomplicating it",
    body: "The hardest part of the gym is getting through that front door. Most people think they need the perfect plan before they start, but most of the time the real challenge is just showing up. It's normal to feel unsure at the start. Everyone does.",
    list: [
      "Pick 2–4 days you can realistically stick to",
      "Go at quieter times if you feel more comfortable",
      "Keep your first few sessions short and simple",
      "Don't worry about what anyone else is doing",
    ],
    takeaway: "Don't wait until you feel ready. Just start, and build from there.",
  },
  {
    n: "02",
    Icon: Dumbbell,
    title: "What to actually do",
    subtitle: "Once you're through the door",
    body: "You don't need anything complicated. A simple session with 4–6 exercises is more than enough. Stick to the same exercises for a few weeks rather than changing it up every week or copying random trends online.",
    list: [
      "A lower body movement (leg press or squats)",
      "A push exercise (chest press or shoulder press)",
      "A pull exercise (rows or lat pulldown)",
    ],
    takeaway: "A simple, consistent workout will always beat a complicated one.",
  },
  {
    n: "03",
    Icon: CheckCircle2,
    title: "Are you doing it right?",
    subtitle: "A quick way to check yourself",
    body: "It's normal to worry if you're doing exercises correctly, especially starting out. You don't need to be perfect: most progress comes from consistency, not perfection. If something feels painful, stop and adjust.",
    checklist: CHECKS_STEP3,
    takeaway: "Focus on control, feeling the right muscles, and gradual improvement. That's all that matters.",
  },
  {
    n: "04",
    Icon: Utensils,
    title: "Keep nutrition simple",
    subtitle: "No strict diets, no tracking apps",
    body: "The goal is just to eat well most of the time, get enough protein, fuel your body, and stay consistent. Mix and match from options that suit you.",
    nutrition: NUTRITION,
    takeaway: "Small, consistent choices beat complicated plans every time.",
  },
  {
    n: "05",
    Icon: Flame,
    title: "Consistency beats everything",
    subtitle: "The one rule that actually matters",
    body: "The best results come from showing up regularly, not from perfect workouts or perfect meals. Small, consistent actions beat big, occasional efforts every time.",
    list: [
      "Build a routine you can actually stick to",
      "Show up even when you don't feel like it",
      "Follow your simple nutrition habits most of the time",
      "Track small improvements: more weight, more reps, feeling stronger",
    ],
    takeaway: "Consistency beats perfection. Keep showing up, keep doing the basics, results will follow.",
  },
];

export default function GuidePage() {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const copyCode = () => {
    navigator.clipboard?.writeText("STRONGSTART10");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sg-page">
      <style>{css}</style>

      {/* Hero */}
      <div className="sg-hero">
        <div className="sg-glow" />
        <div className="sg-hero-inner">
          <div className="sg-eyebrow-badge">
            <Sparkles size={13} />
            <span>Presented by KDPT</span>
          </div>
          <h1 className="sg-title">
            The Strong<br /><span className="sg-title-accent">Start Guide</span>
          </h1>
          <p className="sg-subtitle">
            Everything you need to walk into the gym with a plan, not a guess.
          </p>
          <div className="sg-progress-row">
            {STEPS.map((s) => (
              <button
                key={s.n}
                className="sg-progress-chip"
                onClick={() => document.getElementById(`step-${s.n}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <span className="sg-progress-num">{s.n}</span>
                <span className="sg-progress-label">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sg-content">

        {/* Welcome */}
        <section className="sg-intro">
          <div className="sg-quote-block">
            <Quote size={28} color="#7ED597" style={{ opacity: 0.35, marginBottom: 12 }} />
            <p className="sg-quote-text">
              You don't need anything advanced to get results. Most people just need a bit of
              structure, some consistency, and to focus on the right things.
            </p>
          </div>
          <p className="sg-body">
            If you're reading this, you're either getting started in the gym or feel like you don't
            really have a clear plan right now. This guide gives you a simple starting point. What
            your first sessions should look like, what to focus on, and how to keep things moving
            without overcomplicating it.
          </p>
          <div className="sg-outcome-grid">
            {[
              "Know exactly what to do when you walk into the gym",
              "Feel more confident with your training",
              "Have a simple approach you can actually stick to",
            ].map((t) => (
              <div key={t} className="sg-outcome-card">
                <CheckCircle2 size={18} color="#7ED597" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why listen to KDPT */}
        <section className="sg-why">
          <p className="sg-section-label">Why listen to KDPT?</p>
          <p className="sg-body">
            I'm a personal trainer working with people of all levels, but mainly those who feel a bit
            lost in the gym or just want a clear plan to follow. Most of the people I work with just
            want to feel more confident, build strength and fitness, have structure, and actually see
            progress from the time they're putting in.
          </p>
          <p className="sg-body sg-body-emphasis">
            That's exactly how I coach. Nothing overcomplicated, nothing unrealistic. Just simple,
            structured training that fits around your life.
          </p>
        </section>

        {/* Steps */}
        {STEPS.map((step) => (
          <section key={step.n} id={`step-${step.n}`} className="sg-step">
            <span className="sg-step-watermark">{step.n}</span>

            <div className="sg-step-header">
              <div className="sg-step-icon">
                <step.Icon size={22} color="#7ED597" strokeWidth={1.8} />
              </div>
              <div>
                <p className="sg-step-eyebrow">{step.subtitle}</p>
                <h2 className="sg-step-title">{step.title}</h2>
              </div>
            </div>

            <p className="sg-body">{step.body}</p>

            {step.list && (
              <div className="sg-list-grid">
                {step.list.map((item) => (
                  <div key={item} className="sg-list-item">
                    <span className="sg-list-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {step.checklist && (
              <div className="sg-checklist">
                {step.checklist.map((item) => (
                  <div key={item} className="sg-check-row">
                    <CheckCircle2 size={16} color="#7ED597" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {step.nutrition && (
              <div className="sg-nutrition-grid">
                {step.nutrition.map((n) => (
                  <div key={n.label} className="sg-nutrition-card">
                    <p className="sg-nutrition-label">{n.label}</p>
                    <p className="sg-nutrition-items">{n.items}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="sg-takeaway">
              <Quote size={20} color="#7ED597" style={{ opacity: 0.5, flexShrink: 0 }} />
              <div>
                <p className="sg-takeaway-label">Quick takeaway</p>
                <p className="sg-takeaway-text">{step.takeaway}</p>
              </div>
            </div>
          </section>
        ))}

        {/* Next steps / CTA */}
        <section className="sg-cta">
          <div className="sg-cta-glow" />
          <p className="sg-section-label sg-section-label-center">Keep the momentum going</p>
          <h2 className="sg-cta-title">Ready to take it further?</h2>
          <p className="sg-body sg-cta-body">
            You've got your Strong Start Guide and know how to move with a plan. If you want extra
            support, accountability, or a personalised plan, I work with people 1-1 in person and
            online, with guidance tailored to you, help with form, workouts and nutrition, and a plan
            that fits your life.
          </p>

          <div className="sg-code-box">
            <p className="sg-code-label">10% off your first month of online coaching</p>
            <div className="sg-code-row">
              <span className="sg-code">STRONGSTART10</span>
              <button className="sg-code-btn" onClick={copyCode}>
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
          </div>

          <a className="sg-cta-btn" href="https://start.kdpersonaltraining.com/online#oc-pricing">
            Start Online Coaching <ArrowRight size={14} />
          </a>

          <p className="sg-body-small">
            No pressure. Whether you stick with the guide alone or add coaching, the important thing
            is to keep going and stay consistent.
          </p>
        </section>

      </div>

      <div className="sg-footer">
        <p className="sg-footer-title">Want more KDPT?</p>
        <div className="sg-footer-links">
          <a href="https://www.kdpersonaltraining.com" target="_blank" rel="noopener noreferrer">www.kdpersonaltraining.com</a>
          <a href="https://www.instagram.com/kdpersonaltraining" target="_blank" rel="noopener noreferrer">@kdpersonaltraining</a>
          <a href="mailto:kyle.kdpt@gmail.com">kyle.kdpt@gmail.com</a>
        </div>
      </div>
    </div>
  );
}

const css = `
.sg-page {
  background: #000000;
  min-height: 100vh;
  font-family: 'Poppins', sans-serif;
  padding-bottom: 80px;
  overflow-x: hidden;
}

.sg-hero {
  position: relative;
  padding: 88px 24px 56px;
  text-align: center;
  overflow: hidden;
}
.sg-glow {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 560px;
  height: 400px;
  background: radial-gradient(circle, rgba(126,213,151,0.16) 0%, rgba(126,213,151,0) 70%);
  pointer-events: none;
}
.sg-hero-inner {
  position: relative;
  max-width: 720px;
  margin: 0 auto;
}
.sg-eyebrow-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(126,213,151,0.08);
  border: 1px solid rgba(126,213,151,0.3);
  border-radius: 999px;
  padding: 7px 16px;
  color: #7ED597;
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 24px;
}
.sg-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: clamp(38px, 7vw, 60px);
  color: #ffffff;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0 0 18px 0;
}
.sg-title-accent { color: #7ED597; }
.sg-subtitle {
  color: #D1D5DB;
  font-weight: 300;
  font-size: 17px;
  line-height: 1.6;
  margin: 0 auto 36px;
  max-width: 440px;
}
.sg-progress-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.sg-progress-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #101010;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 999px;
  padding: 8px 16px 8px 10px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  font-family: 'Poppins', sans-serif;
}
.sg-progress-chip:hover {
  border-color: rgba(126,213,151,0.4);
  background: #141414;
}
.sg-progress-num {
  font-family: 'Montserrat', sans-serif;
  color: #7ED597;
  font-weight: 800;
  font-size: 11px;
  background: rgba(126,213,151,0.12);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sg-progress-label {
  color: rgba(255,255,255,0.55);
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
}

.sg-content {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.sg-quote-block {
  border-left: 2px solid #7ED597;
  padding-left: 22px;
  margin-bottom: 28px;
}
.sg-quote-text {
  font-family: 'Montserrat', sans-serif;
  color: #ffffff;
  font-size: clamp(17px, 2.4vw, 21px);
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}

.sg-body {
  color: #D1D5DB;
  font-weight: 300;
  font-size: 15px;
  line-height: 1.8;
  margin: 0 0 16px 0;
}
.sg-body:last-child { margin-bottom: 0; }
.sg-body-emphasis { color: #ffffff; }
.sg-body-small {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  margin-top: 24px;
  text-align: center;
}

.sg-outcome-grid {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}
.sg-outcome-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #101010;
  border: 1px solid rgba(126,213,151,0.18);
  border-radius: 12px;
  padding: 14px 18px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
}

.sg-section-label {
  font-family: 'Montserrat', sans-serif;
  color: #7ED597;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin: 0 0 20px 0;
}
.sg-section-label-center { text-align: center; }

.sg-step {
  position: relative;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 44px;
}
.sg-step-watermark {
  position: absolute;
  top: 20px;
  right: 0;
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 72px;
  color: rgba(255,255,255,0.025);
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
.sg-step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.sg-step-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(126,213,151,0.1);
  border: 1px solid rgba(126,213,151,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sg-step-eyebrow {
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  font-weight: 400;
  margin: 0 0 3px 0;
}
.sg-step-title {
  font-family: 'Montserrat', sans-serif;
  color: #ffffff;
  font-weight: 800;
  font-size: clamp(20px, 3vw, 24px);
  margin: 0;
  line-height: 1.2;
}

.sg-list-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 8px 0 20px 0;
}
.sg-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #D1D5DB;
  font-size: 14.5px;
  font-weight: 300;
  line-height: 1.5;
}
.sg-list-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7ED597;
  flex-shrink: 0;
}

.sg-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 8px 0 20px 0;
}
.sg-check-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #D1D5DB;
  font-size: 14px;
  font-weight: 300;
  line-height: 1.6;
}

.sg-nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 8px 0 20px 0;
}
.sg-nutrition-card {
  background: #101010;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 18px;
}
.sg-nutrition-label {
  font-family: 'Montserrat', sans-serif;
  color: #7ED597;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 8px 0;
}
.sg-nutrition-items {
  color: #D1D5DB;
  font-size: 13px;
  font-weight: 300;
  line-height: 1.6;
  margin: 0;
}

.sg-takeaway {
  display: flex;
  gap: 14px;
  background: linear-gradient(135deg, rgba(126,213,151,0.08), rgba(126,213,151,0.02));
  border: 1px solid rgba(126,213,151,0.25);
  border-radius: 16px;
  padding: 20px 22px;
  margin-top: 4px;
}
.sg-takeaway-label {
  font-family: 'Montserrat', sans-serif;
  color: #7ED597;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 6px 0;
}
.sg-takeaway-text {
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 400;
  line-height: 1.6;
  margin: 0;
}

.sg-cta {
  position: relative;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 48px;
  text-align: center;
  overflow: hidden;
}
.sg-cta-glow {
  position: absolute;
  bottom: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 480px;
  height: 300px;
  background: radial-gradient(circle, rgba(126,213,151,0.1) 0%, rgba(126,213,151,0) 70%);
  pointer-events: none;
}
.sg-cta-title {
  font-family: 'Montserrat', sans-serif;
  color: #ffffff;
  font-weight: 800;
  font-size: clamp(24px, 4vw, 32px);
  margin: 0 0 16px 0;
}
.sg-cta-body {
  max-width: 480px;
  margin: 0 auto 8px;
}

.sg-code-box {
  position: relative;
  background: #101010;
  border: 1px solid rgba(126,213,151,0.25);
  border-radius: 16px;
  padding: 24px;
  margin: 24px auto;
  max-width: 400px;
}
.sg-code-label {
  font-family: 'Montserrat', sans-serif;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  margin: 0 0 14px 0;
}
.sg-code-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
.sg-code {
  font-family: 'Montserrat', sans-serif;
  color: #7ED597;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 0.04em;
  background: rgba(126,213,151,0.08);
  border: 1px dashed rgba(126,213,151,0.4);
  border-radius: 8px;
  padding: 8px 16px;
}
.sg-code-btn {
  font-family: 'Montserrat', sans-serif;
  background: transparent;
  color: #ffffff;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 999px;
  padding: 8px 18px;
  cursor: pointer;
}

.sg-cta-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Montserrat', sans-serif;
  background: #7ED597;
  color: #000000;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 15px 30px;
  text-decoration: none;
  margin: 8px 0 4px;
}

.sg-footer {
  max-width: 700px;
  margin: 64px auto 0 auto;
  padding: 40px 24px 0;
  border-top: 1px solid rgba(255,255,255,0.08);
  text-align: center;
}
.sg-footer-title {
  font-family: 'Montserrat', sans-serif;
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
  margin: 0 0 18px 0;
}
.sg-footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 24px;
}
.sg-footer-links a {
  color: #7ED597;
  font-size: 13px;
  text-decoration: none;
}

@media (min-width: 640px) {
  .sg-outcome-grid { grid-template-columns: 1fr; }
}
`;
