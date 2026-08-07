import json, csv, re, openpyxl

SCRATCH = "/private/tmp/claude-501/-Users-jcnmacbook/590f0cfb-220b-4d7b-bae0-2f5124eb7fb6/scratchpad"
DOWNLOADS_XLSX = "/Users/jcnmacbook/Downloads/watchtower_biomarker_audit.xlsx"

norm = json.load(open(f"{SCRATCH}/biomarker_normalization.json"))
RAW_MAP = norm['raw_token_to_canonical']
NAME_ALIAS = {'CRP': 'CRP (standard)'}
bio_slugs = json.load(open(f"{SCRATCH}/biomarker_slug_lookup.json"))

PEPTIDE_SLUGS = {
 'AOD-9604':'aod-9604','BPC-157':'bpc-157','BPC-157 + TB-500':'bpc-157-tb-500-blend',
 'BPC-157 + TB-500 + GHK-Cu':'bpc-157-tb-500-ghk-cu-blend','Cartalax':'cartalax','CJC-1295':'cjc-1295',
 'CJC-1295 (No DAC)':'cjc-1295-no-dac','CJC-1295 + GHRP-2':'cjc-1295-ghrp-2-blend',
 'CJC-1295 + GHRP-6':'cjc-1295-ghrp-6-blend','CJC-1295 + Ipamorelin':'cjc-1295-ipamorelin-blend',
 'CJC-1295 with DAC':'cjc-1295-dac','Deadpool Blend':'deadpool-blend','Diamond Glow':'diamond-glow',
 'Dihexa':'dihexa','DSIP':'dsip','Epithalon':'epithalon','GHK-Cu':'ghk-cu','GHRP-2':'ghrp-2','GHRP-6':'ghrp-6',
 'GLOW Blend':'glow-blend','GLP-1 (S)':'glp-1-s','GLP-2 (T)':'glp-2-t','GLP-3 (R)':'glp-3-r','Hexarelin':'hexarelin',
 'hGH Fragment 176-191':'fragment-176-191','Humanin':'humanin','IGF-1 LR3':'igf-1-lr3','Ipamorelin':'ipamorelin',
 'ISOFLOW':'isoflow','Kisspeptin':'kisspeptin','Kisspeptin-10':'kisspeptin-10','KLOW Blend':'klow-blend','KPV':'kpv',
 'LL-37':'ll-37','Melanotan I':'melanotan-1','Melanotan II':'melanotan-2','MK-677':'mk-677',
 'Mod GRF 1-29 + Ipamorelin':'mod-grf-1-29-ipamorelin-blend','MOTS-c':'mots-c','N-Acetyl Selank':'n-acetyl-selank',
 'N-Acetyl Semax':'n-acetyl-semax','Nova KLOW':'nova-klow','Oxytocin':'oxytocin','Pinealon':'pinealon',
 'PT-141':'pt-141','PT-141 Bremelanotide':'pt-141-bremelanotide','Retatrutide':'retatrutide','Selank':'selank',
 'Semaglutide':'semaglutide','Semax':'semax','Sermorelin':'sermorelin','Sermorelin + Ipamorelin':'sermorelin-ipamorelin-blend',
 'SS-31':'ss-31','TB-500':'tb-500','TB-500 Fragment 17-23':'tb-500-frag-17-23','Tesamorelin':'tesamorelin',
 'Thymosin Alpha-1':'thymosin-alpha-1','Thymulin':'thymulin','Tirzepatide':'tirzepatide',
 'Wolverine-Cu Blend':'wolverine-cu-blend',
}

# blends whose components we resolved THIS session (audit file still says "Requires component
# identification" for these -- override using blend_resolution.md findings)
RESOLVED_THIS_SESSION = {
    'GLOW Blend': ['BPC-157', 'TB-500', 'GHK-Cu'],
    'KLOW Blend': ['BPC-157', 'TB-500', 'GHK-Cu', 'KPV'],
    'Nova KLOW': ['BPC-157', 'TB-500', 'GHK-Cu', 'KPV'],
    'Wolverine-Cu Blend': ['BPC-157', 'TB-500', 'GHK-Cu'],  # already stated directly in source file
}
# still genuinely unresolved -- skip peptide_biomarkers seeding entirely
UNRESOLVED_BLENDS = {'Diamond Glow', 'Deadpool Blend', 'ISOFLOW'}

# The Biomarker Audit sheet's raw cell text is NOT truncated (unlike the derived Biomarker
# Frequency sheet, which drops trailing ')' -- a quirk of how that sheet was generated).
# RAW_MAP's keys are all in the truncated form, so look up the untruncated token first,
# then fall back to a paren-stripped variant.
EXTRA_EXCLUSIONS = {'No validated bloodwork efficacy markers'}  # Dihexa T2 -- not a marker list

def lookup(seg):
    if seg in RAW_MAP:
        return RAW_MAP[seg]
    if seg in EXTRA_EXCLUSIONS:
        return None
    if seg.endswith(')'):
        stripped = seg[:-1]
        if stripped in RAW_MAP:
            return RAW_MAP[stripped]
    return 'UNMAPPED'  # sentinel distinct from a real None (intentional exclusion)

def parse_cell(cell_text):
    """Split a Tier1/2/3 cell into a list of canonical biomarker names (in pipe-segment order,
    with segment index for priority), dropping non-lab-marker exclusions and unmapped tokens."""
    if not cell_text:
        return []
    out = []
    for seg_idx, seg in enumerate(cell_text.split('|'), start=1):
        seg = seg.strip()
        canon = lookup(seg)
        if canon == 'UNMAPPED':
            print(f'  WARNING: unmapped raw token in cell: {seg!r}')
            continue
        if canon is None:
            continue  # intentional exclusion (non-lab marker), silent
        for c in canon:
            c = NAME_ALIAS.get(c, c)
            out.append((c, seg_idx))
    return out

wb = openpyxl.load_workbook(DOWNLOADS_XLSX, data_only=True)
ws = wb['Biomarker Audit']
rows = [r for r in ws.iter_rows(values_only=True) if r[0] and r[0] != 'Peptide'
        and not str(r[0]).startswith('Watchtower Peptides')]

# pass 1: parse every non-blend-placeholder peptide's tiers directly
peptide_tiers = {}  # name -> {1: [(canon,priority)], 2: [...], 3: [...]}
raw_data = {}  # name -> (t1_text, t2_text, t3_text, notes)
for name, category, axis, t1, t2, t3, bpu, notes in rows:
    raw_data[name] = (t1, t2, t3, notes)
    tiers = {1: [], 2: [], 3: []}
    for tier_num, cell in [(1, t1), (2, t2), (3, t3)]:
        if cell and cell.strip().startswith('See '):
            continue  # blend placeholder ("See X + Y components" / "... blend"), resolve in pass 2
        if cell and 'Requires component identification' in cell:
            continue  # unresolved blend, skip entirely
        tiers[tier_num] = parse_cell(cell)
    peptide_tiers[name] = tiers

# pass 2a: resolve blend Tier-1 "See X + Y components" cells via union of named components' own Tier 1
# (these blends have real, peptide-specific Tier 2/3 text already -- only Tier 1 is a placeholder)
for name, (t1, t2, t3, notes) in raw_data.items():
    if name in UNRESOLVED_BLENDS or name in RESOLVED_THIS_SESSION:
        continue  # handled separately below
    if t1 and t1.strip().startswith('See '):
        comp_names = [c.strip() for c in name.split('+')]
        union, seen = [], set()
        for comp in comp_names:
            for canon, prio in peptide_tiers.get(comp, {}).get(1, []):
                if canon not in seen:
                    seen.add(canon)
                    union.append((canon, prio))
        peptide_tiers[name][1] = union

# pass 2b: blends resolved THIS SESSION (GLOW/KLOW/Nova KLOW/Wolverine-Cu) have ALL THREE
# tiers as "Requires component identification" placeholders in the source file -- since we
# now know their components (blend_resolution.md), derive all 3 tiers as the union of the
# named components' own tiers (this is an inference: "the blend's monitoring needs are the
# union of its components' monitoring needs", not literal source-file text).
for name, comp_names in RESOLVED_THIS_SESSION.items():
    resolved = {1: [], 2: [], 3: []}
    for tier_num in (1, 2, 3):
        union, seen = [], set()
        for comp in comp_names:
            for canon, prio in peptide_tiers.get(comp, {}).get(tier_num, []):
                if canon not in seen:
                    seen.add(canon)
                    union.append((canon, prio))
        resolved[tier_num] = union
    peptide_tiers[name] = resolved

# ---- emit peptide_biomarkers.csv ----
MONITORING_TIER = {1: 'safety', 2: 'efficacy', 3: 'advanced'}
out_rows = []
skipped_unmatched_biomarker = []
skipped_blends = []

for name, tiers in peptide_tiers.items():
    if name in UNRESOLVED_BLENDS:
        skipped_blends.append(name)
        continue
    pep_slug = PEPTIDE_SLUGS.get(name)
    if pep_slug is None:
        print(f'UNMATCHED PEPTIDE: {name!r} -- skipping, do not guess')
        continue
    notes = raw_data[name][3]
    if name in RESOLVED_THIS_SESSION:
        # source note ("Cannot audit without knowing components.") is stale now that
        # components + derived tiers are resolved -- don't seed a self-contradicting note
        comps = ' + '.join(RESOLVED_THIS_SESSION[name])
        notes = (f'Blend components resolved 2026-07-09 ({comps}). Tier lists are the union '
                 f'of each component\'s own monitoring markers, not independently audited for this specific blend.')
    # dedupe across tiers: keep the HIGHEST tier occurrence only (1=safety beats 2 beats 3)
    # to satisfy UNIQUE(peptide_id, biomarker_id)
    seen_markers = {}
    for tier_num in (1, 2, 3):
        for canon, seg_idx in tiers[tier_num]:
            if canon not in seen_markers:
                seen_markers[canon] = (tier_num, seg_idx)
    for canon, (tier_num, seg_idx) in seen_markers.items():
        bio_slug = bio_slugs.get(canon)
        if bio_slug is None:
            skipped_unmatched_biomarker.append((name, canon))
            continue
        out_rows.append({
            'peptide_slug': pep_slug,
            'biomarker_slug': bio_slug,
            'monitoring_tier': MONITORING_TIER[tier_num],
            'priority': min(seg_idx, 5),
            'clinical_note': notes or None,
        })

with open(f'{SCRATCH}/seed_peptide_biomarkers.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['peptide_slug', 'biomarker_slug', 'monitoring_tier', 'priority', 'clinical_note'])
    w.writeheader()
    w.writerows(out_rows)

print(f'\nOK — {len(out_rows)} peptide_biomarkers rows written to seed_peptide_biomarkers.csv')
print(f'Peptides covered: {len(set(r["peptide_slug"] for r in out_rows))} of {len(PEPTIDE_SLUGS)}')
print(f'Blends SKIPPED (unresolved, not guessed): {skipped_blends}')
if skipped_unmatched_biomarker:
    print(f'UNMATCHED biomarkers (skipped, not guessed): {skipped_unmatched_biomarker}')
