import csv, json, os, urllib.request, urllib.error, sys

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
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {path} -> {e.code}: {e.read().decode()[:500]}')

def load_csv(name):
    with open(os.path.join(DIR, name), newline='') as f:
        return list(csv.DictReader(f))

def to_bool(v):
    if v in ('True', 'true'):
        return True
    if v in ('False', 'false'):
        return False
    return None

def to_int(v):
    if v in (None, ''):
        return None
    try:
        return int(float(v))
    except ValueError:
        return None

def chunked_insert(table, rows, chunk_size=300):
    inserted, errors = 0, []
    for i in range(0, len(rows), chunk_size):
        chunk = rows[i:i + chunk_size]
        try:
            result = api('POST', table, body=chunk)
            inserted += len(result)
        except RuntimeError as e:
            errors.append(str(e))
    return inserted, errors

def get_all(table, select='*'):
    return api('GET', table, params={'select': select, 'limit': 5000})

def main():
    print('=== Fetching existing peptides table for slug->id lookup ===')
    peptides = get_all('peptides', 'id,slug')
    peptide_id = {p['slug']: p['id'] for p in peptides}
    print(f'  {len(peptides)} peptides loaded')

    # ---------- 1. biomarkers ----------
    print('\n=== Seeding biomarkers ===')
    bio_rows = [{
        'name': r['name'], 'slug': r['slug'], 'category': r['category'],
        'tier': to_int(r['tier']), 'peptide_relevance_rank': to_int(r['peptide_relevance_rank']),
        'notes': r['notes'] or None,
    } for r in load_csv('seed_biomarkers.csv')]
    inserted, errors = chunked_insert('biomarkers', bio_rows)
    print(f'  inserted: {inserted}/{len(bio_rows)}', errors or '')

    biomarker_id = {b['slug']: b['id'] for b in get_all('biomarkers', 'id,slug')}

    # ---------- 2. lab_vendors ----------
    print('\n=== Seeding lab_vendors ===')
    vendor_rows = [{
        'name': r['name'], 'slug': r['slug'], 'url': r['url'], 'section': r['section'],
        'business_model': r['business_model'] or None,
        'entry_price_cents': to_int(r['entry_price_cents']), 'true_annual_cost_cents': to_int(r['true_annual_cost_cents']),
        'collection_method': r['collection_method'] or None, 'lab_partner': r['lab_partner'] or None,
        'clia_certified': to_bool(r['clia_certified']), 'peptide_rx_offered': to_bool(r['peptide_rx_offered']) or False,
        'affiliate_program': to_bool(r['affiliate_program']),
        'affiliate_url': r['affiliate_url'] or None, 'affiliate_commission': r['affiliate_commission'] or None,
        'affiliate_network': r['affiliate_network'] or None,
        'audience_fit_score': to_int(r['audience_fit_score']), 'eligibility': r['eligibility'],
        'is_gated': to_bool(r['is_gated']) or False,
    } for r in load_csv('seed_lab_vendors.csv')]
    inserted, errors = chunked_insert('lab_vendors', vendor_rows)
    print(f'  inserted: {inserted}/{len(vendor_rows)}', errors or '')

    vendor_id = {v['slug']: v['id'] for v in get_all('lab_vendors', 'id,slug')}

    # ---------- 3. vendor_tiers ----------
    print('\n=== Seeding vendor_tiers ===')
    tier_rows, tier_skipped = [], []
    for r in load_csv('seed_vendor_tiers.csv'):
        vid = vendor_id.get(r['vendor_slug'])
        if not vid:
            tier_skipped.append(r['vendor_slug']); continue
        tier_rows.append({
            'vendor_id': vid, 'tier_name': r['tier_name'], 'price_cents': to_int(r['price_cents']),
            'billing_cycle': r['billing_cycle'] or None, 'biomarker_count': r['biomarker_count'] or None,
            'tests_included': r['tests_included'] or None, 'hsa_fsa_eligible': r['hsa_fsa_eligible'] or None,
            'state_restrictions': r['state_restrictions'] or None, 'ny_nj_surcharge': r['ny_nj_surcharge'] or None,
            'is_entry_tier': to_bool(r['is_entry_tier']) or False,
        })
    inserted, errors = chunked_insert('vendor_tiers', tier_rows)
    print(f'  inserted: {inserted}/{len(tier_rows)}', errors or '')
    if tier_skipped:
        print('  SKIPPED (vendor not found):', tier_skipped)

    tier_lookup = {}
    for t in get_all('vendor_tiers', 'id,vendor_id,tier_name'):
        tier_lookup[f"{t['vendor_id']}::{t['tier_name']}"] = t['id']

    # ---------- 4. peptide_blend_components ----------
    print('\n=== Seeding peptide_blend_components ===')
    blend_rows, blend_skipped = [], []
    for r in load_csv('seed_peptide_blend_components.csv'):
        bid, cid = peptide_id.get(r['blend_slug']), peptide_id.get(r['component_slug'])
        if not bid or not cid:
            blend_skipped.append(r); continue
        blend_rows.append({'blend_id': bid, 'component_id': cid, 'quantity_mcg': to_int(r['quantity_mcg'])})
    inserted, errors = chunked_insert('peptide_blend_components', blend_rows)
    print(f'  inserted: {inserted}/{len(blend_rows)}', errors or '')
    if blend_skipped:
        print('  SKIPPED (peptide not found):', blend_skipped)

    # ---------- 5. peptide_biomarkers ----------
    print('\n=== Seeding peptide_biomarkers ===')
    pb_rows, pb_skipped = [], []
    for r in load_csv('seed_peptide_biomarkers.csv'):
        pid, bid = peptide_id.get(r['peptide_slug']), biomarker_id.get(r['biomarker_slug'])
        if not pid or not bid:
            pb_skipped.append(r); continue
        pb_rows.append({
            'peptide_id': pid, 'biomarker_id': bid, 'monitoring_tier': r['monitoring_tier'],
            'priority': to_int(r['priority']) or 3, 'clinical_note': r['clinical_note'] or None,
        })
    inserted, errors = chunked_insert('peptide_biomarkers', pb_rows)
    print(f'  inserted: {inserted}/{len(pb_rows)}', errors or '')
    if pb_skipped:
        print(f'  SKIPPED ({len(pb_skipped)} rows):', pb_skipped[:10])

    # ---------- 6. vendor_biomarker_coverage ----------
    print('\n=== Seeding vendor_biomarker_coverage ===')
    cov_rows, cov_skipped = [], []
    for r in load_csv('seed_vendor_biomarker_coverage.csv'):
        vid, bid = vendor_id.get(r['vendor_slug']), biomarker_id.get(r['biomarker_slug'])
        if not vid or not bid:
            cov_skipped.append(r); continue
        tier_id = tier_lookup.get(f"{vid}::{r['tier_name']}") if r['tier_name'] else None
        cov_rows.append({
            'vendor_id': vid, 'biomarker_id': bid, 'status': r['status'],
            'tier_id': tier_id, 'tier_price_cents': to_int(r['tier_price_cents']),
            'addon_cost_cents': to_int(r['addon_cost_cents']), 'specimen_type': r['specimen_type'] or 'blood',
            'accuracy_flag': r['accuracy_flag'] or None, 'notes': r['raw_annotation'] or None,
        })
    inserted, errors = chunked_insert('vendor_biomarker_coverage', cov_rows)
    print(f'  inserted: {inserted}/{len(cov_rows)}', errors or '')
    if cov_skipped:
        print(f'  SKIPPED ({len(cov_skipped)} rows):', cov_skipped[:10])

    tier_resolved = sum(1 for r in cov_rows if r['tier_id'])
    print(f'\n  tier_id resolved for {tier_resolved} of {len(cov_rows)} coverage rows')
    print('\n=== DONE ===')

if __name__ == '__main__':
    main()
