import csv, json, os, urllib.request, urllib.error

DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(DIR, '..', '..', '.env.local')

def load_env():
    env = {}
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    return env

env = load_env()
SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

def api(method, path, body=None, params=None):
    url = f'{SUPABASE_URL}/rest/v1/{path}'
    if params:
        url += '?' + '&'.join(f'{k}={v}' for k, v in params.items())
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('apikey', SERVICE_KEY)
    req.add_header('Authorization', f'Bearer {SERVICE_KEY}')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Prefer', 'return=representation')
    try:
        with urllib.request.urlopen(req) as resp:
            body_text = resp.read().decode()
            return json.loads(body_text) if body_text else []
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {path} -> {e.code}: {e.read().decode()[:500]}')

def get_all(table, select='*', extra=None):
    params = {'select': select, 'limit': 5000}
    if extra:
        params.update(extra)
    return api('GET', table, params=params)

# The matrix used vendor-specific shorthand for tier names (e.g. "Ultra") while vendor_tiers
# (built independently from the Pricing Deep Dive sheet) has the full tier names (e.g. "Mito
# Ultra Panel") -- this is the mismatch that left 1,115 of 1,176 coverage rows with tier_id
# unresolved. Explicit alias map built from comparing both sides directly.
ALIAS = {
    'everlywell':          {'360': 'Everlywell 360'},
    'function-health':     {'Base': 'Function Membership (single tier)'},
    'hundred-health':      {'Core': 'Hundred Core'},
    'insidetracker':       {'Membership': 'Membership (required annual)', 'Ultimate': 'Ultimate',
                             'add-on to Ultimate': 'Ultimate'},
    'jinfiniti-agingsos':  {'Advanced': 'Advanced Panel', 'Essential': 'Essential Panel', 'Ultimate': 'Ultimate Panel'},
    'lifeforce':           {'General': 'General Membership (main funnel)'},
                             # 'TRT track only' intentionally NOT mapped -- it's a note that PSA
                             # is gated behind Lifeforce's TRT signup flow, not a purchasable
                             # membership tier that exists as its own vendor_tiers row. NULL is
                             # the semantically correct value here, not a gap.
    'mito-health':         {'Core': 'Mito Core Panel', 'Essential': 'Mito Essential Panel',
                             'Ultra': 'Mito Ultra Panel', 'Ultra only': 'Mito Ultra Panel'},
    'onetwenty':           {'Standard': 'Annual Membership (Standard)'},
    'rythm-health':        {'Core': 'Core Monthly Subscription'},
    'siphox-health':       {'Core': 'Core', 'Core-EasyDraw': 'Core', 'Heart&Metabolic': 'Heart & Metabolic',
                             'Hormone Focus': 'Hormone Focus', 'Hormone Focus + Hormone+ upgrade': 'Hormone Focus',
                             'Thyroid Focus': 'Thyroid Focus'},
    'superpower':          {'Base': 'Baseline / Core (single tier)', 'Baseline': 'Baseline / Core (single tier)'},
    'vitals-vault':        {'Advanced': 'Advanced', 'Essential': 'Essential', 'Max': 'Max'},
    # marek-diagnostics, goodlabs: intentionally absent -- these are à la carte vendors, coverage
    # cells never carry a "(TierName/$Price)" pattern for them, so tier_id=NULL is correct as-is.
}

def main():
    vendor_id = {v['slug']: v['id'] for v in get_all('lab_vendors', 'id,slug')}
    biomarker_id = {b['slug']: b['id'] for b in get_all('biomarkers', 'id,slug')}
    tiers = get_all('vendor_tiers', 'id,vendor_id,tier_name')
    tier_lookup = {f"{t['vendor_id']}::{t['tier_name']}": t['id'] for t in tiers}

    rows = list(csv.DictReader(open(os.path.join(DIR, 'seed_vendor_biomarker_coverage.csv'))))

    updates = []
    unmapped_shorthand = set()
    for r in rows:
        if not r['tier_name']:
            continue
        vslug = r['vendor_slug']
        full_name = ALIAS.get(vslug, {}).get(r['tier_name'])
        if full_name is None:
            if vslug not in ('marek-diagnostics', 'goodlabs'):
                unmapped_shorthand.add((vslug, r['tier_name']))
            continue
        vid = vendor_id.get(vslug)
        bid = biomarker_id.get(r['biomarker_slug'])
        tid = tier_lookup.get(f'{vid}::{full_name}')
        if vid and bid and tid:
            updates.append((vid, bid, tid))

    print(f'{len(updates)} coverage rows to update with a resolved tier_id')
    if unmapped_shorthand:
        print('UNMAPPED shorthand (not in ALIAS, review needed):', unmapped_shorthand)

    ok, failed = 0, []
    for vid, bid, tid in updates:
        try:
            api('PATCH', 'vendor_biomarker_coverage', body={'tier_id': tid},
                params={'vendor_id': f'eq.{vid}', 'biomarker_id': f'eq.{bid}'})
            ok += 1
        except RuntimeError as e:
            failed.append(str(e))

    print(f'Updated: {ok}/{len(updates)}')
    if failed:
        print('Failures:', failed[:10])

    final_count = api('GET', 'vendor_biomarker_coverage', params={'select': 'id', 'tier_id': 'not.is.null', 'limit': 5000})
    print(f'\nFinal tier_id-resolved count (live DB): {len(final_count)} of 1176')

if __name__ == '__main__':
    main()
