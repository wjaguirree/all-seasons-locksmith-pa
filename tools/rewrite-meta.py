#!/usr/bin/env python3
"""Rewrite <title> and meta description on service-city and category-city pages.
Titles <= 60 chars, descriptions 120-160 chars. Also syncs og/twitter title+description.
Usage: python3 -I tools/rewrite-meta.py [--apply]"""
import re, glob, sys, html
B = 'All Seasons Locksmith'; PH = 'Call (223) 240-3505.'
APPLY = '--apply' in sys.argv

def title_for(label, city):
    for t in (f'{label} in {city}, PA | {B}', f'{label} in {city} | {B}',
              f'{label} in {city}, PA | All Seasons', f'{label} in {city} | All Seasons'):
        if len(t) <= 60: return t
    return None  # still too long: leave the page title as is

def fit(cands):
    for d in cands:
        if 120 <= len(d) <= 160: return d
    return cands[0]

def get(s):
    t = html.unescape(re.search(r'<title>(.*?)</title>', s, re.S).group(1))
    d = html.unescape(re.search(r'name="description" content="([^"]*)"', s).group(1))
    return t, d

def sync(s, old, new, keys):
    for k in keys:
        s = re.sub(r'(<meta\s+(?:property|name)="%s"\s+content=")%s(")' % (k, re.escape(old)),
                   lambda m: m.group(1) + new + m.group(2), s)
    return s

changed = skipped = 0
for f in sorted(glob.glob('services/*/*/index.html') + glob.glob('services/*/*/*/index.html')):
    s = open(f, encoding='utf8').read(); t, d = get(s)
    depth = f.count('/')
    if depth == 4:  # service-city: {Service} in {City}, PA | brand
        m = re.match(r'(.+?) in (.+?), PA \| ', t)
        if not m: continue
        label, city = m.groups()
        blurb = d.split('upfront quote. ', 1)[1].rsplit(' Call (223)', 1)[0]
        base = f'{label} in {city}, PA. {blurb}'
        nd = fit([f'{base} {PH}', base, f'{base} Mobile, on-site service. {PH}', f'{base} On-site service. {PH}'])
        nt = title_for(label, city)
    else:  # category-city: {Cat} Locksmith Services in {City}, PA | brand
        m = re.match(r'(.+?) Services in (.+?), PA \| ', t)
        if not m: continue
        cat, city = m.groups()
        lst = re.search(r'PA\. (.*?) and more\.', d).group(1)
        base = f'{cat} in {city}, PA. {lst} and more.'
        nd = fit([f'{base} {PH}', f'{base} Mobile, on-site service. {PH}'])
        nt = title_for(cat, city)
    if nt is None: nt = t; skipped += 1
    s2 = s
    s2 = s2.replace(f'<title>{html.escape(t, quote=False)}</title>', f'<title>{nt}</title>', 1) if f'<title>{t}</title>' not in s else s2.replace(f'<title>{t}</title>', f'<title>{nt}</title>', 1)
    s2 = s2.replace(f'name="description" content="{d}"', f'name="description" content="{nd}"', 1)
    s2 = sync(s2, t, nt, ['og:title', 'twitter:title'])
    s2 = sync(s2, d, nd, ['og:description', 'twitter:description'])
    if s2 != s:
        changed += 1
        if APPLY: open(f, 'w', encoding='utf8').write(s2)
print(('applied' if APPLY else 'dry run'), 'changed', changed, 'titles left as is', skipped)
