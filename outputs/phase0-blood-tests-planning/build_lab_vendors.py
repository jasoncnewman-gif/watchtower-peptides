import json, csv, re

SCRATCH = "/private/tmp/claude-501/-Users-jcnmacbook/590f0cfb-220b-4d7b-bae0-2f5124eb7fb6/scratchpad"
JSON_PATH = "/Users/jcnmacbook/Documents/Watchtower Peptides/platform/outputs/lab_vendor_audit.json"

section_map = json.load(open(f'{SCRATCH}/vendor_section_mapping.json'))
data = json.load(open(JSON_PATH))
by_name = {v['vendor_name']: v for v in data}

def slugify(name):
    s = name.lower()
    s = re.sub(r'[()]', '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def price_to_cents(text):
    if not text:
        return None
    m = re.search(r'\$([\d,]+(?:\.\d{2})?)', text)
    return round(float(m.group(1).replace(',', '')) * 100) if m else None

def classify_collection(text):
    if not text:
        return None, 'not stated in source'
    t = text.lower()
    hits = []
    if 'fingerstick' in t or 'finger-stick' in t or 'finger prick' in t:
        hits.append('fingerstick')
    if 'arm-patch' in t or 'easydraw' in t or 'arm patch' in t or 'arm-device' in t:
        hits.append('arm-device')
    if 'venous' in t or 'phlebotomist' in t or 'quest' in t or 'labcorp' in t:
        hits.append('venous-draw')
    if 'at-home kit' in t or 'mail' in t or 'dried blood spot' in t:
        hits.append('at-home-kit')
    if 'mobile phlebotomist' in t or 'at-home draw' in t or 'at-home blood draw' in t or 'in-home phlebotomy' in t:
        hits.append('mobile-phlebotomist')
    if 'in-lab' in t or 'partner location' in t or 'lab near you' in t or 'at a lab' in t:
        hits.append('clinic-draw')
    hits = list(dict.fromkeys(hits))  # dedupe, preserve order
    if len(hits) == 0:
        return None, f'could not classify from text: {text[:120]!r}'
    if len(hits) == 1:
        return hits[0], None
    return 'multiple', f'multiple methods detected in source text: {hits}'

def classify_business_model(section, name):
    if section == 'membership':
        return 'subscription'
    if section == 'panel-package':
        return 'panel'
    if section == 'build-your-own':
        return 'ala-carte'
    if section == 'special':
        return 'clinic'  # Lifeforce -- physician-prescribed, managed-protocol positioning
    return None

# affiliate data researched this session (outputs/affiliate_audit.md) -- only vendors with
# CONFIRMED (not conflicting/undisclosed) terms get affiliate_commission populated as a clean
# value; conflicting/undisclosed ones get affiliate_program=True but commission=NULL with the
# ambiguity preserved in a review note, not collapsed into a fake single number.
AFFILIATE = {
    'Superpower': {'has_program': True, 'commission': '$25/referral + milestone bonuses (5=$100,10=$250,25=$750,50=$1500)',
                   'network': 'Dub', 'url': 'https://superpower.com/partner', 'confidence': 'high'},
    'Vitals Vault': {'has_program': True, 'commission': 'Up to 10% (ceiling, tiered/negotiable per partner)',
                      'network': 'First Promoter', 'url': 'https://www.vitalsvault.com/affiliate', 'confidence': 'high'},
    'Function Health': {'has_program': True, 'commission': None,
                         'network': 'Impact (referral program; affiliate backend unconfirmed)',
                         'url': 'https://www.functionhealth.com/for-creators', 'confidence': 'low - application-gated, rate undisclosed'},
    'Mito Health': {'has_program': False, 'commission': None, 'network': None, 'url': None,
                     'confidence': 'high confidence NO public program exists'},
    'InsideTracker': {'has_program': True, 'commission': None,
                       'network': 'Awin (merchant ID 91617, via DMi Partners)',
                       'url': 'https://ui.awin.com/merchant-profile/91617', 'confidence': 'low - conflicting rate (8% vs 3%) and cookie window (30 vs 90 days) across sources'},
    'Everlywell': {'has_program': True, 'commission': None, 'network': 'CJ Affiliate (primary)',
                    'url': None, 'confidence': 'low - conflicting rate (12%/6% vs $4 flat vs 5-10%) across sources'},
    'Hundred Health': {'has_program': True, 'commission': '$50 flat per first sale',
                        'network': 'Dub', 'url': 'https://partners.dub.co/hundred', 'confidence': 'medium'},
    'OneTwenty': {'has_program': True, 'commission': None,
                  'network': 'In-house/proprietary (application via Google Form)',
                  'url': 'https://onetwenty.com/affiliates',
                  'confidence': 'medium on structure (fixed-fee, not %), amount undisclosed'},
}

vendor_to_section = {}
for section, vendors in section_map['sections'].items():
    for v in vendors:
        vendor_to_section[v] = section

out_rows = []
collection_review_notes = []
for name, v in by_name.items():
    section = vendor_to_section.get(name)
    if section is None or section == 'excluded':
        continue  # only seed non-excluded vendors, matching original spec's validation query
    pricing = v.get('pricing', {})
    coll = v.get('collection_lab', {})
    collection_method, coll_note = classify_collection(coll.get('collection_method'))
    if coll_note:
        collection_review_notes.append((name, coll_note))
    aff = AFFILIATE.get(name, {'has_program': None, 'commission': None, 'network': None, 'url': None, 'confidence': 'not researched this session'})
    clia_raw = (coll.get('clia_certified') or '').lower()
    clia = True if clia_raw.startswith('yes') else (False if clia_raw.startswith('no') else None)
    out_rows.append({
        'name': name, 'slug': slugify(name), 'url': v.get('url'), 'section': section,
        'business_model': classify_business_model(section, name),
        'entry_price_cents': price_to_cents(pricing.get('entry_price')),
        'true_annual_cost_cents': price_to_cents(pricing.get('true_annual_cost')),
        'collection_method': collection_method,
        'lab_partner': coll.get('lab_partner'),
        'clia_certified': clia,
        'peptide_rx_offered': (name == 'Lifeforce'),  # only Lifeforce prescribes/dispenses peptides per original audit
        'affiliate_program': aff['has_program'],
        'affiliate_url': aff['url'],
        'affiliate_commission': aff['commission'],
        'affiliate_network': aff['network'],
        'affiliate_confidence_note': aff['confidence'],
        'audience_fit_score': v.get('audience_fit_score'),
        'eligibility': v.get('eligibility_decision'),
        'is_gated': v.get('is_gated'),
    })

with open(f'{SCRATCH}/seed_lab_vendors.csv', 'w', newline='') as f:
    fieldnames = list(out_rows[0].keys())
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(out_rows)

print(f'OK — {len(out_rows)} lab_vendors rows written (non-excluded only)')
print(f'\nCollection-method classifications needing manual review (ambiguous or multi-method source text):')
for name, note in collection_review_notes:
    print(f'  {name}: {note}')
print(f'\nAffiliate data: {sum(1 for r in out_rows if r["affiliate_commission"])} of {len(out_rows)} vendors have a clean confirmed commission figure.')
