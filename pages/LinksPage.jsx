import { useState, useRef, useEffect } from 'react';
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
    href: "https://appliednutrition.uk/?ref=kpcwjaga",
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
  const scriptInjected = useRef(false);

  useEffect(() => {
    if (scriptInjected.current) return;
    scriptInjected.current = true;

    // Brevo's own stylesheet (base layout/spacing only, colours are overridden below)
    if (!document.getElementById("sib-styles")) {
      const link = document.createElement("link");
      link.id = "sib-styles";
      link.rel = "stylesheet";
      link.href = "https://sibforms.com/forms/end-form/build/sib-styles.css";
      document.head.appendChild(link);
    }

    // Brevo's required config globals
    window.REQUIRED_CODE_ERROR_MESSAGE = "Please choose a country code";
    window.LOCALE = "en";
    window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE =
      "The information provided is invalid. Please review the field format and try again.";
    window.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank. ";
    window.GENERIC_INVALID_MESSAGE =
      "The information provided is invalid. Please review the field format and try again.";
    window.INVALID_NUMBER =
      "The information provided is invalid. Please review the field format and try again.";
    window.INVALID_DATE = "Please enter a valid date";
    window.REQUIRED_MULTISELECT_MESSAGE = "Please select at least 1 option";
    window.translation = {
      common: {
        selectedList: "{quantity} list selected",
        selectedLists: "{quantity} lists selected",
        selectedOption: "{quantity} selected",
        selectedOptions: "{quantity} selected",
      },
    };
    window.AUTOHIDE = Boolean(0);

    // Brevo's form logic (validation, submit handling, success/error panel toggling)
    const script = document.createElement("script");
    script.src = "https://sibforms.com/forms/end-form/build/main.js";
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="lk-brevo-wrap">
      <style>{brevoOverrideCss}</style>
      <div
        className="sib-form"
        dangerouslySetInnerHTML={{ __html: brevoFormHtml }}
      />
    </div>
  );
}

// Brevo's raw embed markup — structure and submit logic untouched, only inline
// colours changed to match the KDPT brand (handled here since Brevo relies on
// inline styles that need to be present in the actual HTML, not just CSS).
const brevoFormHtml = `
<div id="sib-form-container" class="sib-form-container">
  <div id="error-message" class="sib-form-message-panel" style="display:none;font-family:Poppins,sans-serif;font-size:13px;text-align:left;color:#ff8a80;background-color:rgba(255,107,107,0.08);border-color:rgba(255,90,90,0.4);border-radius:10px;max-width:540px;">
    <div class="sib-form-message-panel__text sib-form-message-panel__text--center">
      <span class="sib-form-message-panel__inner-text">Your subscription could not be saved. Please try again.</span>
    </div>
  </div>
  <div id="success-message" class="sib-form-message-panel" style="display:none;font-family:Poppins,sans-serif;font-size:13px;text-align:left;color:#7ED597;background-color:rgba(126,213,151,0.1);border-color:rgba(126,213,151,0.4);border-radius:10px;max-width:540px;">
    <div class="sib-form-message-panel__text sib-form-message-panel__text--center">
      <span class="sib-form-message-panel__inner-text">You're in! Check your inbox for your Strong Start Guide.</span>
    </div>
  </div>
  <div id="sib-container" class="sib-container--large sib-container--vertical" style="max-width:540px;text-align:center;background-color:#141414;border-width:1px;border-style:solid;border-color:rgba(126,213,151,0.3);border-radius:16px;direction:ltr;padding:22px 20px;">
    <form id="sib-form" method="POST" action="https://dcc3eae3.sibforms.com/serve/MUIFAH4m-ke_vfbyszHOM4LQniXGbbp3S2y-SbYueTdVQ7WKj4eSiDDSA7yTLleMfsnYc6u_s0crWVT6tlSLD_6WaLIjTT7wJ1bDiLkHsy-W60a8QYaQZcJt14qGXSPThXjMHLaVKfUT4178TmD8FqJu8yP1Wlw_Uf7wjuD_oJX8jnb9kUNlanT0aMw_BTYIhui-9r2JIwULp3GN1Q==" data-type="subscription">
      <div style="padding: 6px 0;">
        <div class="sib-form-block" style="font-family:Montserrat,sans-serif;font-size:17px;font-weight:700;text-align:center;color:#ffffff;">
          <p>Claim your Strong Start Guide</p>
        </div>
      </div>
      <div style="padding: 4px 0 14px;">
        <div class="sib-form-block" style="font-family:Poppins,sans-serif;font-size:13px;text-align:center;color:rgba(255,255,255,0.55);">
          <div class="sib-text-form-block">
            <p>Add your details, check your inbox, begin your fitness journey!</p>
          </div>
        </div>
      </div>
      <div style="padding: 6px 0;">
        <div class="sib-input sib-form-block">
          <div class="form__entry entry_block">
            <div class="form__label-row">
              <div class="entry__field">
                <input class="input" maxlength="200" type="text" id="FIRSTNAME" name="FIRSTNAME" autocomplete="off" placeholder="First name" data-required="true" required />
              </div>
            </div>
            <label class="entry__error entry__error--primary" style="font-family:Poppins,sans-serif;font-size:12px;text-align:left;color:#ff8a80;"></label>
          </div>
        </div>
      </div>
      <div style="padding: 6px 0;">
        <div class="sib-input sib-form-block">
          <div class="form__entry entry_block">
            <div class="form__label-row">
              <div class="entry__field">
                <input class="input" type="text" id="EMAIL" name="EMAIL" autocomplete="off" value="" placeholder="Email address" data-required="true" required />
              </div>
            </div>
            <label class="entry__error entry__error--primary" style="font-family:Poppins,sans-serif;font-size:12px;text-align:left;color:#ff8a80;"></label>
          </div>
        </div>
      </div>
      <div style="padding: 10px 0 2px;">
        <div class="sib-form-block" style="text-align: center">
          <button class="sib-form-block__button sib-form-block__button-with-loader" style="font-family:Montserrat,sans-serif;font-size:12.5px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;text-align:center;color:#000000;background-color:#7ED597;border-width:0px;border-radius:999px;padding:13px 20px;width:100%;" form="sib-form" type="submit">
            <svg class="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512" style="display:none;">
              <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
            </svg>
            Send Me The Guide
          </button>
        </div>
      </div>
      <input type="text" name="email_address_check" value="" class="input--hidden" style="display:none;">
      <input type="hidden" name="locale" value="en">
    </form>
  </div>
</div>
`;

const brevoOverrideCss = `
  .lk-brevo-wrap .sib-form { background: transparent !important; padding: 0 !important; }
  .lk-brevo-wrap .sib-input .input {
    background: #0B0B0B !important;
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.14) !important;
    border-radius: 10px !important;
    padding: 12px 14px !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 14px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  .lk-brevo-wrap .sib-input .input::placeholder { color: rgba(255,255,255,0.35) !important; }
  .lk-brevo-wrap .sib-form-block__button:hover { filter: brightness(1.08); }
  .lk-brevo-wrap #sib-container { animation: none !important; }
`;

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
