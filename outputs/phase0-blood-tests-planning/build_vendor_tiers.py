import csv, re, json, openpyxl

SCRATCH = "/private/tmp/claude-501/-Users-jcnmacbook/590f0cfb-220b-4d7b-bae0-2f5124eb7fb6/scratchpad"
XLSX = "/Users/jcnmacbook/Documents/Watchtower Peptides/platform/outputs/lab_vendor_audit.xlsx"

section_map = json.load(open(f'{SCRATCH}/vendor_section_mapping.json'))
included_vendors = set(v for vs in section_map['sections'].values() for v in vs) - set(section_map['sections']['excluded'])

def slugify(name):
    s = name.lower()
    s = re.sub(r'[()]', '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def parse_price_cents(price_text):
    """Best-effort: extract the FIRST dollar figure in the string. Ranges/A-B pricing/notes
    are preserved in tests_included-adjacent free text elsewhere -- this is a representative
    price for is_entry_tier comparison, not a guarantee of exact current pricing."""
    if not price_text:
        return None
    m = re.search(r'\$([\d,]+(?:\.\d{2})?)', price_text)
    if not m:
        return None
    return round(float(m.group(1).replace(',', '')) * 100)

wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb['Pricing Deep Dive']
rows = [r for r in ws.iter_rows(values_only=True) if r[0] and r[0] != 'Vendor']

out_rows = []
by_vendor = {}
for vendor, tier_name, price, billing, tests, biomarker_count, addl_cost, hsa_fsa, state_restr, ny_nj in rows:
    if vendor not in included_vendors:
        continue
    price_cents = parse_price_cents(price)
    row = {
        'vendor_slug': slugify(vendor), 'tier_name': tier_name, 'price_cents': price_cents,
        'billing_cycle': billing, 'biomarker_count': biomarker_count, 'tests_included': tests,
        'hsa_fsa_eligible': hsa_fsa, 'state_restrictions': state_restr, 'ny_nj_surcharge': ny_nj,
        'price_raw_text': price,  # kept for review -- price_cents alone loses range/A-B nuance
    }
    out_rows.append(row)
    by_vendor.setdefault(slugify(vendor), []).append(row)

# is_entry_tier = lowest price_cents per vendor (ties broken by first-seen order)
for vendor_slug, tiers in by_vendor.items():
    priced = [t for t in tiers if t['price_cents'] is not None]
    if not priced:
        continue
    cheapest = min(priced, key=lambda t: t['price_cents'])
    cheapest['is_entry_tier'] = True
for row in out_rows:
    row.setdefault('is_entry_tier', False)

with open(f'{SCRATCH}/seed_vendor_tiers.csv', 'w', newline='') as f:
    fieldnames = ['vendor_slug', 'tier_name', 'price_cents', 'billing_cycle', 'biomarker_count',
                  'tests_included', 'hsa_fsa_eligible', 'state_restrictions', 'ny_nj_surcharge',
                  'is_entry_tier', 'price_raw_text']
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(out_rows)

vendors_missing_price = [v for v, tiers in by_vendor.items() if not any(t['price_cents'] for t in tiers)]
print(f'OK — {len(out_rows)} vendor_tiers rows written across {len(by_vendor)} vendors')
if vendors_missing_price:
    print(f'WARNING — vendors with no parseable price on any tier: {vendors_missing_price}')
print('\nCAVEAT: price_cents is a best-effort single figure extracted from often-complex price')
print('strings (A/B test pricing, ranges, "starting at"). price_raw_text is kept alongside for')
print('manual review before this is trusted for is_entry_tier or any dollar-figure display.')
