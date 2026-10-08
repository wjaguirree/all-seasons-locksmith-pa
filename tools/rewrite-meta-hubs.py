#!/usr/bin/env python3
"""Rewrite <title> and meta description on city hub and service pages.
Titles <= 60 chars, descriptions 120-160 chars; syncs og/twitter title+description.
Carlisle and Lebanon hubs are hand-written and left alone.
Usage: python3 -I tools/rewrite-meta-hubs.py [--apply]"""
import re, glob, sys
B = 'All Seasons Locksmith'; PH = 'Call (223) 240-3505.'
APPLY = '--apply' in sys.argv
KEEP = {'service-areas/carlisle-pa/index.html', 'service-areas/lebanon-pa/index.html'}

def raw(s):
    t = re.search(r'<title>(.*?)</title>', s, re.S).group(1)
    d = re.search(r'name="description" content="([^"]*)"', s).group(1)
    return t, d

def sync(s, old, new, keys):
    for k in keys:
        s = re.sub(r'(<meta\s+(?:property|name)="%s"\s+content=")%s(")' % (k, re.escape(old)),
                   lambda m: m.group(1) + new + m.group(2), s)
    return s

def first(cands, ok):
    return next((c for c in cands if ok(c)), cands[0])

changed = 0
files = sorted(glob.glob('service-areas/*/index.html')) + \
        sorted(f for f in glob.glob('services/*/*/index.html') if '-pa/' not in f)
for f in files:
    if f in KEEP: continue
    s = open(f, encoding='utf8').read(); t, d = raw(s)
    if f.startswith('service-areas/'):
        city = re.search(r'in (.+?), PA', t).group(1)
        if 'Mobile Car' in t:  # New Cumberland: keep its hand-written style, trim to fit
            nt = f'Locksmith in {city}, PA | Car, Home &amp; Business' if '&amp;' in t else f'Locksmith in {city}, PA | Car, Home & Business'
            nd = d
        else:
            nt = f'Locksmith in {city}, PA | {B}'
            nd = f'Mobile locksmith in {city}, PA. Automotive, residential, commercial and emergency service with non-destructive entry. {PH}'
    else:
        label = t.split(' | ')[0]
        blurb = d.split('upfront quote. ', 1)[1].rsplit(' Call (223)', 1)[0]
        nt = first([f'{label} in Central PA | {B}', f'{label} | Central PA | {B}',
                    f'{label} in Central PA | All Seasons', f'{label} | Central PA | All Seasons'],
                   lambda c: len(c) <= 60)
        base = f'{label} across Central PA. {blurb}'
        nd = first([f'{base} {PH}', base, f'{base} Mobile, on-site service. {PH}'],
                   lambda c: 120 <= len(c) <= 160)
    s2 = s.replace(f'<title>{t}</title>', f'<title>{nt}</title>', 1)
    s2 = s2.replace(f'name="description" content="{d}"', f'name="description" content="{nd}"', 1)
    s2 = sync(s2, t, nt, ['og:title', 'twitter:title'])
    s2 = sync(s2, d, nd, ['og:description', 'twitter:description'])
    if s2 != s:
        changed += 1
        if APPLY: open(f, 'w', encoding='utf8').write(s2)
print(('applied' if APPLY else 'dry run'), 'changed', changed)
