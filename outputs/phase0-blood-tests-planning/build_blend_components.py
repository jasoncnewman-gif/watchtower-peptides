import csv

SCRATCH = "/private/tmp/claude-501/-Users-jcnmacbook/590f0cfb-220b-4d7b-bae0-2f5124eb7fb6/scratchpad"

# (blend_slug, component_slug, quantity_mcg or None)
ROWS = [
    ('wolverine-cu-blend', 'bpc-157', None),   # source states "same as BPC-157+TB-500+GHK-Cu blend" but doesn't repeat the mg ratio for this specific product name
    ('wolverine-cu-blend', 'tb-500', None),
    ('wolverine-cu-blend', 'ghk-cu', None),
    ('glow-blend', 'bpc-157', 10000),          # 10mg per 70mg vial, 5:1:1 ratio, 8+ sources agree
    ('glow-blend', 'tb-500', 10000),
    ('glow-blend', 'ghk-cu', 50000),
    ('klow-blend', 'bpc-157', 10000),          # 10mg per 80mg vial, 8+ sources agree
    ('klow-blend', 'tb-500', 10000),
    ('klow-blend', 'ghk-cu', 50000),
    ('klow-blend', 'kpv', 10000),
    ('nova-klow', 'bpc-157', 10000),           # same as KLOW -- Nova-branded vendors sell the standard KLOW formula
    ('nova-klow', 'tb-500', 10000),
    ('nova-klow', 'ghk-cu', 50000),
    ('nova-klow', 'kpv', 10000),
]

with open(f'{SCRATCH}/seed_peptide_blend_components.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['blend_slug', 'component_slug', 'quantity_mcg'])
    w.writerows(ROWS)

print(f'OK — {len(ROWS)} rows written to seed_peptide_blend_components.csv')
print('Blends seeded: wolverine-cu-blend, glow-blend, klow-blend, nova-klow (4 of 7)')
print('Blends SKIPPED, not guessed: diamond-glow, deadpool-blend, isoflow (unresolved per blend_resolution.md)')
