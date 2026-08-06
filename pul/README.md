# potentialunexplored.com

Multi-page rebuild of the Potential Unexplored Ltd website: real image files instead of embedded
base64, a shared stylesheet, and a shared JS file, rather than one giant single-page HTML file.

## Structure

- `index.html` — Home
- `organisational-strengthening.html` — overview, with sub-pages: `leadership-development.html`, `team-building.html`, `sales-excellence.html`
- `life-readiness-programme.html` — overview, with sub-pages: `boys-to-men.html`, `girls-rising.html`, `mep-masterclass.html`, `school-support.html`
- `impact.html` — stats, case study, clients, testimonials
- `about.html` — overview, with sub-pages: `philosophy.html`, `our-team.html`, `case-studies.html`
- `blog.html` — article listing, with `heal-to-lead-episode-1.html` as the first post
- `books-and-courses.html` — overview, with sub-pages: `books.html`, `courses.html`
- `register.html` — overview/hub (tabs + dropdown, all 5 forms on one page), with individual sub-pages: `register-boys-to-men-kampala.html`, `register-boys-to-men-arua.html`, `register-mep-masterclass.html`, `register-girls-rising.html`, `register-institutional.html`
- `support.html` — Support Our Work (sponsorship, in-kind, volunteering, giving)
- `contact.html` — general enquiry form and contact details
- `faq.html` — frequently asked questions
- `safeguarding.html` — Safeguarding and Child Protection Policy
- `privacy-policy.html` — Privacy Policy
- `terms.html` — Registration Terms
- `upcoming-intakes.html` — all confirmed programme dates in one place
- `404.html` — custom not-found page
- `assets/css/styles.css` — shared stylesheet
- `assets/js/main.js` — shared JS (nav, dropdowns, registration logic, payment modals, book/course order modal)
- `assets/img/` — all site photos, logo, and favicon as real files

## Before this goes live

1. **Google Analytics**: every page currently has a placeholder GA4 snippet with `G-XXXXXXXXXX`.
   Replace this with your real Measurement ID from analytics.google.com (or delete the two
   `<script>` tags near the top of each page's `<head>` if you don't want analytics yet).
2. **Safeguarding policy**: `safeguarding.html` has a public summary. If you have (or want to
   write) a full internal safeguarding document for institutional donor due diligence, that's
   separate from this page and should be shared directly, not published here.

## Deployment (GitHub Pages, same as before)

1. Upload all files at the top level of the `potentialunexplored.com` repo (not nested inside a folder)
2. Settings → Pages → confirm custom domain is `potentialunexplored.com` and HTTPS is enforced
3. Namecheap DNS should already have the 4 GitHub A records + `www` CNAME, no changes needed
