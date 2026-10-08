#!/usr/bin/env python3
"""Rewrite <title> and meta description on the hand-written top-level pages.
Titles <= 60 chars, descriptions 120-160 chars; syncs og/twitter title+description.
Usage: python3 -I tools/rewrite-meta-pages.py [--apply]"""
import re, sys
B = 'All Seasons Locksmith'; PH = 'Call (223) 240-3505.'
APPLY = '--apply' in sys.argv
PAGES = {
 'index.html': (f'Mobile Locksmith in Central PA | {B}',
   f'Non-destructive entry, done in one visit. Car, home, business and emergency locksmith serving Harrisburg and Central PA. {PH}'),
 'services/index.html': (f'Locksmith Services in Central PA | {B}', None),
 'service-areas/index.html': (f'Service Areas in Central PA | {B}',
   'Mobile locksmith service in 31 towns across Dauphin, Cumberland and Lebanon counties, PA. Find your town and call (223) 240-3505.'),
 'services/automotive-locksmith/index.html': (None,
   f'Locked out or need a car key made? We come to you, cut and program keys on-site, and get it done in one visit. Central PA. {PH}'),
 'services/residential-locksmith/index.html': (f'Residential Locksmith in Central PA | {B}',
   f'Residential locksmith across Central PA. Lock Rekeying, Lock Replacement, Deadbolt Installation and more. Mobile and non-destructive. {PH}'),
 'services/commercial-locksmith/index.html': (f'Commercial Locksmith in Central PA | {B}',
   f'Commercial locksmith across Central PA. Lock Installation, Lock Repair, Master Key Systems and more. Mobile and non-destructive. {PH}'),
 'services/emergency-locksmith/index.html': (None,
   f'Locked out of your car, house or business? We reach you fast and open it without damage. Serving Central PA. {PH}'),
 'blog/index.html': (f'Blog | {B}, Central Pennsylvania',
   f'Locksmith tips, guides and security advice for Harrisburg and Central Pennsylvania from the team at {B}. {PH}'),
 'faq/index.html': (f'FAQ | {B}, Central Pennsylvania', None),
 'privacy-policy/index.html': (None,
   f'Privacy Policy for {B}, a mobile locksmith serving Harrisburg and Central Pennsylvania. How we handle your information.'),
 'terms-of-service/index.html': (None,
   f'Terms of Service for {B}, a mobile locksmith serving Harrisburg and Central Pennsylvania. Read the terms for our website and services.'),
 '404.html': (None,
   f'The page you were looking for is not here. Browse our locksmith services or call {B} at (223) 240-3505 for help.'),
}

def sync(s, old, new, keys):
    for k in keys:
        s = re.sub(r'(<meta\s+(?:property|name)="%s"\s+content=")%s(")' % (k, re.escape(old)),
                   lambda m: m.group(1) + new + m.group(2), s)
    return s

for f, (nt, nd) in PAGES.items():
    s = open(f, encoding='utf8').read()
    t = re.search(r'<title>(.*?)</title>', s, re.S).group(1)
    m = re.search(r'name="description" content="([^"]*)"', s)
    d = m.group(1) if m else None
    s2 = s
    if nt:
        nt_raw = nt.replace('&', '&amp;') if '&amp;' in t else nt
        s2 = s2.replace(f'<title>{t}</title>', f'<title>{nt_raw}</title>', 1)
        s2 = sync(s2, t, nt_raw, ['og:title', 'twitter:title'])
    if nd:
        if d is None:
            s2 = s2.replace('</title>', f'</title>\n<meta name="description" content="{nd}" />', 1)
        else:
            s2 = s2.replace(f'name="description" content="{d}"', f'name="description" content="{nd}"', 1)
            s2 = sync(s2, d, nd, ['og:description', 'twitter:description'])
    print(f, 'changed' if s2 != s else 'UNCHANGED')
    if APPLY and s2 != s: open(f, 'w', encoding='utf8').write(s2)
