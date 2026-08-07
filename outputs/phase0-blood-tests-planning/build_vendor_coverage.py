import json, csv, re

SCRATCH = "/private/tmp/claude-501/-Users-jcnmacbook/590f0cfb-220b-4d7b-bae0-2f5124eb7fb6/scratchpad"

old_md = json.load(open(f"{SCRATCH}/matrix_data.json"))
new_md = json.load(open(f"{SCRATCH}/matrix_data_v2.json"))
VENDORS = old_md['vendors']
ALL_ROWS = old_md['rows'] + new_md['new_rows']
M = {**old_md['matrix'], **new_md['matrix']}
bio_slugs = json.load(open(f"{SCRATCH}/biomarker_slug_lookup.json"))

def slugify(name):
    s = name.lower()
    s = re.sub(r'[()]', '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

STATUS_MAP = {'✓': 'included', '+': 'addon', '✗': 'unavailable', '?': 'unconfirmed', '±': 'unconfirmed'}

# Markers that are non-blood BY DEFINITION regardless of whether any specific vendor's cell
# text got an explicit (urine)/(stool) tag -- relying only on inline text tags proved fragile
# (Fecal Calprotectin's Vitals Vault cell was added in a later research round and never got
# tagged, even though the marker name itself says "fecal").
INHERENTLY_NONBLOOD = {'Fecal Calprotectin': 'stool'}

def parse_cell(text, marker_name=None):
    symbol = text.strip()[0] if text.strip() else '?'
    status = STATUS_MAP.get(symbol, 'unconfirmed')

    accuracy_flag = 'CAP' if '⚠CAP' in text else None
    specimen_type = 'blood'  # schema default -- true for the overwhelming majority of cells
    if '(urine)' in text:
        specimen_type = 'urine'
    elif '(stool)' in text:
        specimen_type = 'stool'
    elif marker_name in INHERENTLY_NONBLOOD:
        specimen_type = INHERENTLY_NONBLOOD[marker_name]

    tier_match = re.search(r'\(([A-Za-z0-9 /&+.\'-]+?)/\$([\d,]+(?:\.\d{2})?)', text)
    tier_name, tier_price_cents = None, None
    if tier_match:
        tier_name = tier_match.group(1).strip()
        tier_price_cents = round(float(tier_match.group(2).replace(',', '')) * 100)

    addon_cost_cents = None
    if status == 'addon':
        m2 = re.search(r'\$([\d,]+(?:\.\d{2})?)', text)
        if m2:
            addon_cost_cents = round(float(m2.group(1).replace(',', '')) * 100)

    return {
        'status': status, 'tier_name': tier_name, 'tier_price_cents': tier_price_cents,
        'addon_cost_cents': addon_cost_cents, 'specimen_type': specimen_type,
        'accuracy_flag': accuracy_flag, 'raw_annotation': text,
    }

# SiPhox / Rythm capillary-collection accuracy flag (per original spec instructions):
# apply CAP where the marker IS offered and is one of the 4 capillary-sensitive analytes.
CAPILLARY_FLAG_VENDORS = {'SiPhox Health', 'Rythm Health'}
CAPILLARY_FLAG_MARKERS = {'IGF-1', 'Fasting Insulin', 'Cortisol (AM)', 'Testosterone (Total)', 'Testosterone (Free)'}

out_rows = []
for marker in ALL_ROWS:
    bio_slug = bio_slugs.get(marker)
    for vendor in VENDORS:
        cell = M[marker][vendor]
        parsed = parse_cell(cell, marker_name=marker)
        if (vendor in CAPILLARY_FLAG_VENDORS and marker in CAPILLARY_FLAG_MARKERS
                and parsed['status'] == 'included' and parsed['accuracy_flag'] is None):
            parsed['accuracy_flag'] = 'CAP'
        out_rows.append({
            'vendor_slug': slugify(vendor), 'biomarker_slug': bio_slug,
            **parsed,
        })

with open(f'{SCRATCH}/seed_vendor_biomarker_coverage.csv', 'w', newline='') as f:
    fieldnames = ['vendor_slug', 'biomarker_slug', 'status', 'tier_name', 'tier_price_cents',
                  'addon_cost_cents', 'specimen_type', 'accuracy_flag', 'raw_annotation']
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(out_rows)

status_counts = {}
for r in out_rows:
    status_counts[r['status']] = status_counts.get(r['status'], 0) + 1
specimen_counts = {}
for r in out_rows:
    specimen_counts[r['specimen_type']] = specimen_counts.get(r['specimen_type'], 0) + 1
cap_flagged = sum(1 for r in out_rows if r['accuracy_flag'] == 'CAP')
tier_resolved = sum(1 for r in out_rows if r['tier_name'])

print(f'OK — {len(out_rows)} vendor_biomarker_coverage rows written ({len(ALL_ROWS)} markers x {len(VENDORS)} vendors)')
print(f'Status breakdown: {status_counts}')
print(f'specimen_type breakdown: {specimen_counts}')
print(f'Cells with a parsed tier_name/tier_price: {tier_resolved}')
print(f'Cells flagged CAP (capillary accuracy caveat): {cap_flagged}')
print()
print('Non-default (non-blood) specimen_type rows:')
for r in out_rows:
    if r['specimen_type'] != 'blood':
        print(f"  {r['vendor_slug']} / {r['biomarker_slug']}: {r['specimen_type']}")
