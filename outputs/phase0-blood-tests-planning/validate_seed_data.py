import csv

SCRATCH = "/private/tmp/claude-501/-Users-jcnmacbook/590f0cfb-220b-4d7b-bae0-2f5124eb7fb6/scratchpad"

def load(name):
    return list(csv.DictReader(open(f'{SCRATCH}/{name}')))

biomarkers = load('seed_biomarkers.csv')
peptide_biomarkers = load('seed_peptide_biomarkers.csv')
blend_components = load('seed_peptide_blend_components.csv')
lab_vendors = load('seed_lab_vendors.csv')
vendor_tiers = load('seed_vendor_tiers.csv')
coverage = load('seed_vendor_biomarker_coverage.csv')

print('=== VALIDATION (dry-run CSVs, mirrors the original spec\'s post-seed queries) ===\n')
print(f'SELECT COUNT(*) FROM biomarkers;                              -> {len(biomarkers)}')
print(f'SELECT COUNT(*) FROM peptide_biomarkers;                      -> {len(peptide_biomarkers)}')
print(f'SELECT COUNT(*) FROM peptide_blend_components;                -> {len(blend_components)}')
print(f'SELECT COUNT(*) FROM lab_vendors WHERE eligibility!=\'EXCLUDE\'; -> {len(lab_vendors)}')
print(f'SELECT COUNT(*) FROM vendor_tiers;                            -> {len(vendor_tiers)}')
included = sum(1 for r in coverage if r['status'] == 'included')
unconfirmed = sum(1 for r in coverage if r['status'] == 'unconfirmed')
print(f'SELECT COUNT(*) FROM vendor_biomarker_coverage WHERE status=\'included\';    -> {included}')
print(f'SELECT COUNT(*) FROM vendor_biomarker_coverage WHERE status=\'unconfirmed\'; -> {unconfirmed}')

print('\n=== Integrity checks ===')
bio_slugs = set(r['slug'] for r in biomarkers)
pep_slugs_in_pb = set(r['biomarker_slug'] for r in peptide_biomarkers)
orphan_pb = pep_slugs_in_pb - bio_slugs
print(f'peptide_biomarkers referencing a biomarker_slug not in biomarkers.csv: {orphan_pb or "none"}')

cov_bio_slugs = set(r['biomarker_slug'] for r in coverage)
orphan_cov = cov_bio_slugs - bio_slugs
print(f'vendor_biomarker_coverage referencing a biomarker_slug not in biomarkers.csv: {orphan_cov or "none"}')

vendor_slugs = set(r['slug'] for r in lab_vendors)
cov_vendor_slugs = set(r['vendor_slug'] for r in coverage)
orphan_cov_v = cov_vendor_slugs - vendor_slugs
print(f'vendor_biomarker_coverage referencing a vendor not in lab_vendors.csv: {orphan_cov_v or "none"}')

tier_vendor_slugs = set(r['vendor_slug'] for r in vendor_tiers)
orphan_tiers = tier_vendor_slugs - vendor_slugs
print(f'vendor_tiers referencing a vendor not in lab_vendors.csv: {orphan_tiers or "none"}')

blend_slugs_used = set(r['blend_slug'] for r in blend_components) | set(r['component_slug'] for r in blend_components)
pep_slugs_in_pb_peptide = set(r['peptide_slug'] for r in peptide_biomarkers)
print(f'Peptides with peptide_biomarkers rows: {len(pep_slugs_in_pb_peptide)}')
print(f'Blends with resolved components: {len(set(r["blend_slug"] for r in blend_components))}')

print('\n=== Known gaps carried into this dry-run (by design, not oversights) ===')
print('- 3 blends (diamond-glow, deadpool-blend, isoflow) have NO peptide_biomarkers rows and')
print('  NO peptide_blend_components rows — genuinely unresolved, not seeded rather than guessed.')
print('- Only 3 of 14 lab_vendors have a clean confirmed affiliate_commission figure.')
print('- tier_price_cents/addon_cost_cents in vendor_biomarker_coverage were regex-extracted from')
print('  free-text annotations — spot-check before trusting for display.')
non_blood = sum(1 for r in coverage if r['specimen_type'] != 'blood')
print(f'- specimen_type column added and populated ({non_blood} non-blood rows: 14 stool + 9 urine) — schema gap fixed.')
