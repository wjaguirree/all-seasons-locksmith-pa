# All Seasons Locksmith — Handoff Package

**allseasonslocksmith.com**
Delivered by **Brixel Project** · August 2026

---

## Status

Brixel Project's work on this site is **complete**. This package is the full
deployed source as of handoff. Maintenance and further development transfer to
the incoming team.

These are plain static files. There is no build step, no framework and no
system to learn — everything here is exactly what the server sends. Nothing
will be regenerated or overwritten by us.

---

## Contents

    index.html            homepage
    styles.css            all styling, one file
    main.js               interactions; the site reads fine with JS off
    .htaccess             server config — see "Must survive migration" below
    robots.txt
    sitemap.xml           1,034 URLs
    about/ blog/ faq/ privacy-policy/ terms-of-service/
    service-areas/        31 town hubs
    services/             4 categories x 27 services, plus town combinations
    assets/               images (WebP), brand, 31 town photos
    lib/                  GSAP + ScrollTrigger

---

## Must survive migration

If the site is rebuilt on another stack, these four things carry real SEO
consequences if they are lost. Listed in order of how much damage they do.

### 1. The 1,034 URLs must stay byte-identical

Google has indexed these paths. Any change to the URL structure deindexes the
affected pages and the rankings restart from zero.

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

HSTS `preload` was deliberately not enabled — it is effectively irreversible
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

These come from the business owner, not from us. Breaking them is a
client-facing problem.

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

The current 1,034 pages are verified clean against all five.

---

## SEO state at handoff

A third-party audit (CTWDS, 18 August 2026) scored the site **84/100**. Nine of
its eleven items are closed:

- HSTS header added
- Saturday declared explicitly closed in opening-hours schema
- Real geo coordinates added
- schema `image`, `email`, `addressCountry` added
- `twitter:description` added
- alt-text coverage verified — 101 images, 0 missing
- deep-page differentiation measured rather than sampled
- Core Web Vitals measured with real Lighthouse runs
- "licensed" claim removed sitewide

Two were deliberately not done:

- **aggregateRating** — the audit qualifies this as "once review volume
  supports it". Publishing star ratings without real reviews is schema fraud
  and draws manual actions.
- **HSTS preload** — see above.

Separately, the **www duplicate-indexing problem** was found and fixed. It was
not in the audit.

### Open items

- **sameAs** — needs the Google Business Profile URL and social profile URLs
- **Blog** — 3 posts against 1,034 service pages is thin
- **Per-page FAQ** — already present, 5–9 unique Q&A per page, schema-backed

---

## Accounts

- Search Console: `sc-domain:allseasonslocksmith.com`
- Google Analytics 4: `G-JRGPYGJLYK`
- Microsoft Clarity: `y1roxb7hwa`

Transfer of ownership on these is arranged separately with the business owner.

---

## Credit

The footer of each page carries a "Made by Brixel Project" credit linking to
brixelproyect.com. We'd appreciate it being preserved through any rebuild.

---

**Brixel Project** · brixelproyect.com
