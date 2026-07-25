# potentialunexplored.com

Multi-page rebuild of the Potential Unexplored Ltd website, structured the same way as boystomencamp.com:
real image files instead of embedded base64, a shared stylesheet, and a shared JS file, rather than one giant single-page HTML file.

## Structure
- `index.html` — Home
- `organisational-strengthening.html` — overview, with sub-pages:
  - `leadership-development.html`
  - `team-building.html`
  - `sales-excellence.html`
- `life-readiness-programme.html` — overview, with sub-pages:
  - `boys-to-men.html`
  - `girls-rising.html`
  - `mep-masterclass.html`
  - `school-support.html`
- `about.html` — philosophy, case study, team
- `register.html` — registration hub (tabs + dropdown selector, all 5 Formspree forms)
- `contact.html` — general enquiry form and contact details
- `books.html` — books and courses
- `assets/css/styles.css` — shared stylesheet
- `assets/js/main.js` — shared JS (nav, dropdowns, registration logic, payment modals)
- `assets/img/` — all site photos and the logo as real files

## Deployment (GitHub Pages, same as before)
1. Upload all files at the top level of the `potentialunexplored.com` repo (not nested inside a folder)
2. Settings → Pages → confirm custom domain is `potentialunexplored.com` and HTTPS is enforced
3. Namecheap DNS should already have the 4 GitHub A records + `www` CNAME from the original setup, no changes needed
