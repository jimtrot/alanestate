# alanestate.com

Smoke-test site for Alan Estate: a free, personalised guide to what to do when someone dies in Australia, plus waitlists for families and professionals.

- **Stack:** Astro 7 · Tailwind 4 · Preact island for the plan builder · static output
- **Hosting:** GitHub Pages (this repo, `main` → Actions → Pages) behind Cloudflare DNS
- **Forms:** FormSubmit (alias in `src/data/site.ts`) → email. No database.
- **Content:** `src/data/plan.ts` (the plan builder steps) and `src/pages/guide/*`

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/
```

General information only, not legal advice. Every step in the guide links to its official source.
