# KD Personal Training – Sales Hub

A production-ready React/Vite sales hub for KD Personal Training.

---

## Tech Stack

- **React 18** with hooks
- **Vite 5** for bundling
- **lucide-react** for icons
- **Vercel** for hosting
- All styling via inline styles (no CSS framework required)

---

## Project Structure

```
kdpt-sales-hub/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        ← entire application
│   └── main.jsx       ← React entry point
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .gitignore
└── README.md
```

---

## Live Links (already configured in App.jsx)

| Service | Link |
|---|---|
| Online Coaching (Stripe) | https://buy.stripe.com/28EaEW6eFaPy3l76Sd3oA00 |
| Personalised Programme (Stripe) | https://buy.stripe.com/28EaEW6eFaPy3l76Sd3oA00 |
| PT Consultation (Calendly) | https://calendly.com/kdpt/book-your-free-pt-consultation-here |

---

## Deploying to Vercel

### Option A – Deploy via GitHub (recommended)

1. **Upload to GitHub**
   - Go to [github.com](https://github.com) and create a new repository
   - Name it `kdpt-sales-hub` (or anything you like)
   - Upload this entire folder (drag and drop the ZIP contents, or use GitHub Desktop)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in (or create a free account)
   - Click **Add New Project**
   - Select **Import Git Repository**
   - Choose your `kdpt-sales-hub` repository

3. **Configure the project**
   - Framework Preset: **Vite** (Vercel usually detects this automatically)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Click **Deploy**

4. **Add your custom domain**
   - In your Vercel project, go to **Settings → Domains**
   - Add `kdpersonaltraining.com` and `www.kdpersonaltraining.com`
   - Follow Vercel's instructions to update your DNS records with your domain registrar
   - Vercel automatically provisions an SSL certificate

---

### Option B – Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to the project folder
cd kdpt-sales-hub

# Install dependencies
npm install

# Deploy
vercel

# Follow the prompts, then for production:
vercel --prod
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (opens at http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## Making Content Updates

All content, copy, testimonials, pricing and links live in a single file:

**`src/App.jsx`**

### Update testimonials / reviews

Find the three arrays near the top of `App.jsx`:

```js
const REVIEWS_ONLINE = [ ... ]
const REVIEWS_PROGRAMMES = [ ... ]
const REVIEWS_PT = [ ... ]
```

Replace each placeholder object with a real client review:

```js
{
  name: "Sarah M.",
  stars: 5,
  quote: "Your genuine client quote here.",
  goal: "Fat Loss",
  duration: "6 months"
}
```

### Update pricing

Search for `PriceCard` in `App.jsx` and update the `price` prop.

### Update Stripe links

Search for `buy.stripe.com` and replace with your updated Stripe Payment Link.

### Update Calendly link

Search for `calendly.com/kdpt` and replace with your updated Calendly URL.

---

## After Each Update

If deployed via GitHub, simply push your changes to GitHub and Vercel will automatically redeploy.

```bash
git add .
git commit -m "Update testimonials"
git push
```

---

## Contact

**KD Personal Training**  
Email: kyle.kdpt@gmail.com  
Website: www.kdpersonaltraining.com  
Instagram: @kyle.coaching  
TikTok: @kyle.coaching
