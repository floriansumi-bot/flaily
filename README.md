# Flaily — AI email triage (portfolio showcase)

A one-page showcase site for **Flaily**, an AI assistant that triages a Gmail inbox
twice a day: it stars and labels the mail that matters (invoices, payroll, government,
tax, insurance, legal, deadlines, security), drafts the replies that need one (never
sends), and can block noisy senders on request.

The tool itself runs **privately** as a scheduled Claude Code agent against the owner's
own Gmail, so this page *demonstrates* how it behaves rather than offering a public login.

## Live site
https://floriansumi-bot.github.io/flaily/

## What's here
- `index.html` — the full single-page site
- `css/styles.css` — styling (dark theme, responsive, reduced-motion aware)
- `js/app.js` — mobile nav, scroll reveal, service-worker registration
- `assets/` — logo, favicon, PWA icons, social card
- `manifest.webmanifest`, `sw.js` — installable PWA + offline shell
- `robots.txt`, `sitemap.xml` — basic SEO

Pure static site — no build step, no backend, no keys.

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Hosting
Deployed on GitHub Pages (branch `main`, root). Any push to `main` redeploys.

---
A portfolio project by Florian Sumi. Not affiliated with Google or Gmail.
