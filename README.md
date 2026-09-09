# All Seasons Locksmith PA

**allseasonslocksmith.com**

Plain static HTML/CSS/JS site — no build step, no framework. Everything in
this repo is exactly what the server sends.

---

## Contents

    index.html            homepage
    styles.css             all styling, one file
    main.js                interactions; the site reads fine with JS off
    .htaccess               server config — see "Must survive migration" below
    robots.txt
    sitemap.xml             1,034 URLs
    about/ blog/ faq/ privacy-policy/ terms-of-service/
    service-areas/          31 town hubs
    services/               4 categories x 27 services, plus town combinations
    assets/                 images (WebP), brand, 31 town photos
    lib/                    GSAP + ScrollTrigger

---

## Must survive any migration or rebuild

If the site is rebuilt on another stack, these carry real SEO consequences if
lost. Listed in order of how much damage they do.

### 1. The 1,034 URLs must stay byte-identical

Google has indexed these paths. Any change to the URL structure deindexes the
affected pages and rankings restart from zero.

The pattern is:

    /                                          homepage
    /services/<category>/                      4 region-wide category pages
    /services/<category>/<service>/            27 region-wide service pages
    /service-areas/<town>/                     31 town hubs
    /services/<category>/<town>/               124 town + category
    /services/<category>/<town>/<service>/     837 town + service

All with trailing slashes. `sitemap.xml` is the authoritative list — diff any
new build against it before going live. If a URL genuinely has to change, it
needs a 301 from the old path.

### 2. Two server rules currently live in `.htaccess`

    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

    RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
    RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

If hosting moves off Apache, both must be reimplemented in the new platform's
config. The www rule especially: Google was previously indexing pages under
both `www.` and the apex domain, splitting ranking signals between duplicate
URLs. The 301 fixed it. Losing that rule brings the problem straight back.

HSTS `preload` is deliberately not enabled — it is effectively irreversible
and is the owner's decision, not a technical default.

### 3. Structured data on every page

Every page carries JSON-LD. Removing it costs rich results and AI citations:

- LocalBusiness (homepage, town hubs) — with real geo coordinates
- Service (service pages)
- BreadcrumbList (all pages)
- FAQPage (all pages, 5–9 unique Q&A each)

### 4. Tracking tags in `<head>` on all 1,034 pages

- Google Analytics 4 — `G-JRGPYGJLYK`
- Microsoft Clarity — `y1roxb7hwa`

---

## Client content rules

These come from the business owner. Breaking them is a client-facing problem.

1. **No prices.** No dollar amounts, no "affordable", "cheap", "free",
   "cost-effective". Quotes are given by phone.
2. **No arrival times.** No minutes, no hours, no "same-day", no "24/7".
   Timing stays vague: "as quickly as we can".
3. **No "licensed".** Pennsylvania does not license locksmiths, so the claim
   is unsupportable. "Insured" and "professional" are fine.
   ("driver's license" is unrelated and stays.)
4. **No invented local detail.** Street names, landmarks and neighborhoods
   must be real. No fabricated reviews or testimonials.
5. Footer must state that in-store visits are by appointment only.

All current pages are verified clean against all five.

---

## SEO state

Open items carried forward:

- **sameAs** — needs the Google Business Profile URL and social profile URLs
- **Blog** — 3 posts against 1,034 service pages is thin
- **aggregateRating** — hold off until review volume supports it; publishing
  star ratings without real reviews is schema fraud and draws manual actions
- **HSTS preload** — deliberately not enabled, owner's decision

Per-page FAQ is already present: 5–9 unique Q&A per page, schema-backed.

---

## Accounts

- Search Console: `sc-domain:allseasonslocksmith.com`
- Google Analytics 4: `G-JRGPYGJLYK`
- Microsoft Clarity: `y1roxb7hwa`

---

## Credit

The footer of each page carries a "Made by Brixel Project" credit linking to
brixelproyect.com. Please preserve it through any rebuild.

See `HANDOFF-README.md` for the original project handoff notes.
