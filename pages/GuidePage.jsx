import { useEffect } from 'react';

/**
 * KDPT Strong Start Guide Page
 *
 * This is the page Day 0 of the email sequence links to (kdpersonaltraining.com/guide,
 * to be updated to start.kdpersonaltraining.com/guide once wired in).
 *
 * Replace the placeholder sections below with your actual Strong Start Guide content.
 */

export default function GuidePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="gp-page">
      <style>{css}</style>

      <div className="gp-header">
        <p className="gp-eyebrow">YOUR FREE GUIDE</p>
        <h1 className="gp-title">The Strong Start Guide</h1>
        <p className="gp-subtitle">
          A few honest lessons to help you avoid the mistakes most people make in their first few weeks of training.
        </p>
      </div>

      <div className="gp-content">
        <section className="gp-section">
          <h2 className="gp-section-title">01. Consistency beats intensity</h2>
          <p className="gp-section-body">
            [Replace with your actual guide content for this section.]
          </p>
        </section>

        <section className="gp-section">
          <h2 className="gp-section-title">02. You don't need to be sore to make progress</h2>
          <p className="gp-section-body">
            [Replace with your actual guide content for this section.]
          </p>
        </section>

        <section className="gp-section">
          <h2 className="gp-section-title">03. Nutrition doesn't have to be complicated</h2>
          <p className="gp-section-body">
            [Replace with your actual guide content for this section.]
          </p>
        </section>
      </div>

      <div className="gp-cta">
        <p className="gp-cta-text">Your first 3 meals unlock tomorrow, keep an eye on your inbox.</p>
      </div>
    </div>
  );
}

const css = `
.gp-page {
  background: #000000;
  min-height: 100vh;
  padding: 60px 24px 80px;
  font-family: 'Poppins', sans-serif;
}
.gp-header {
  max-width: 640px;
  margin: 0 auto 56px auto;
  text-align: center;
}
.gp-eyebrow {
  font-family: 'Montserrat', sans-serif;
  color: #7ED597;
  letter-spacing: 0.2em;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.gp-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: clamp(30px, 5vw, 44px);
  color: #ffffff;
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
}
.gp-subtitle {
  color: #D1D5DB;
  font-weight: 300;
  font-size: 15px;
  line-height: 1.7;
}
.gp-content {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.gp-section-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #7ED597;
  margin: 0 0 12px 0;
}
.gp-section-body {
  color: #D1D5DB;
  font-weight: 300;
  font-size: 15px;
  line-height: 1.8;
}
.gp-cta {
  max-width: 640px;
  margin: 64px auto 0 auto;
  text-align: center;
  padding-top: 32px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.gp-cta-text {
  color: rgba(255,255,255,0.5);
  font-size: 14px;
}
`;
