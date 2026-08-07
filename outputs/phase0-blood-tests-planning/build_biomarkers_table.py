import json, csv, re, openpyxl
from collections import defaultdict

SCRATCH = "/private/tmp/claude-501/-Users-jcnmacbook/590f0cfb-220b-4d7b-bae0-2f5124eb7fb6/scratchpad"
DOWNLOADS_XLSX = "/Users/jcnmacbook/Downloads/watchtower_biomarker_audit.xlsx"

norm = json.load(open(f"{SCRATCH}/biomarker_normalization.json"))
RAW_MAP = norm['raw_token_to_canonical']

# full 84-row canonical marker list (matches lab_vendor_audit.xlsx matrix exactly)
old_md = json.load(open(f"{SCRATCH}/matrix_data.json"))
new_md = json.load(open(f"{SCRATCH}/matrix_data_v2.json"))
ALL_84 = old_md['rows'] + new_md['new_rows']

def slugify(name):
    s = name.lower()
    s = re.sub(r'[()/]', ' ', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

# ---- aggregate Tier1/2/3 counts per canonical name from the Biomarker Frequency sheet ----
wb = openpyxl.load_workbook(DOWNLOADS_XLSX, data_only=True)
freq_ws = wb['Biomarker Frequency']
freq_rows = [r for r in freq_ws.iter_rows(values_only=True)
             if r[0] and r[0] != 'Biomarker / Marker' and not str(r[0]).startswith('Biomarker Frequency')]

# alias: normalize_biomarkers.py mapped the frequency-sheet token "CRP" to canonical
# name "CRP" (bare), but the vendor-coverage matrix builder independently named the
# same standard/non-hs CRP marker "CRP (standard)" -- reconcile here so frequency
# counts attach to the matrix's row name.
NAME_ALIAS = {'CRP': 'CRP (standard)'}

canon_counts = defaultdict(lambda: {'t1': 0, 't2': 0, 't3': 0, 'total': 0})
for raw, t1, t2, t3, total, primary in freq_rows:
    canon_list = RAW_MAP.get(raw)
    if not canon_list:
        continue
    canon_list = [NAME_ALIAS.get(c, c) for c in canon_list]
    for c in canon_list:
        canon_counts[c]['t1'] += t1 or 0
        canon_counts[c]['t2'] += t2 or 0
        canon_counts[c]['t3'] += t3 or 0
        canon_counts[c]['total'] += total or 0

# ---- category assignment (manual, judgment calls noted inline) ----
CATEGORY = {
    # liver
    'ALT': 'liver', 'AST': 'liver', 'GGT': 'liver', 'Albumin': 'liver', 'Pre-Albumin': 'liver', 'HGF': 'liver',
    # kidney
    'BUN': 'kidney', 'Creatinine': 'kidney', 'eGFR': 'kidney',
    # metabolic
    'HbA1c': 'metabolic', 'Fasting Insulin': 'metabolic', 'HOMA-IR': 'metabolic', 'Fasting Glucose': 'metabolic',
    'Lipid Panel': 'metabolic', 'ApoB': 'metabolic', 'Lp(a)': 'metabolic', 'Amylase': 'metabolic', 'Lipase': 'metabolic',
    'Free Fatty Acids': 'metabolic', 'Ketones': 'metabolic', 'Lactate': 'metabolic', 'Glucagon': 'metabolic',
    'Adiponectin': 'metabolic', 'Leptin': 'metabolic', 'Ghrelin': 'metabolic', 'CoQ10': 'metabolic',
    'Vitamin D (25-OH)': 'metabolic', 'Serum Zinc': 'metabolic', 'Citrulline': 'metabolic',
    # hormones
    'Cortisol (AM)': 'hormones', 'Prolactin': 'hormones', 'Testosterone (Total)': 'hormones', 'Testosterone (Free)': 'hormones',
    'Estradiol': 'hormones', 'LH': 'hormones', 'FSH': 'hormones', 'SHBG': 'hormones', 'DHEA-S': 'hormones',
    'Progesterone': 'hormones', 'AMH': 'hormones', 'ACTH': 'hormones', 'GnRH Stimulation Test': 'hormones',
    'Growth Hormone (Fasting)': 'hormones', 'Vasopressin (ADH)': 'hormones', 'Melatonin': 'hormones', 'PSA': 'hormones',
    # inflammation
    'hs-CRP': 'inflammation', 'CRP (standard)': 'inflammation', 'IL-6': 'inflammation', 'Fibrinogen': 'inflammation',
    'ESR': 'inflammation', 'Procalcitonin': 'inflammation', 'Fecal Calprotectin': 'inflammation',
    # immune
    'Immunoglobulins (IgG/IgM/IgA)': 'immune', 'Lymphocyte Subsets (CD4/CD8)': 'immune', 'NK Cell Activity': 'immune',
    'Thymulin Assay': 'immune',
    # cardiac
    'BNP/NT-proBNP': 'cardiac', 'Troponin I': 'cardiac', 'VEGF': 'cardiac', 'Creatine Kinase': 'cardiac',
    # neurological
    'BDNF': 'neurological', 'Serotonin Metabolites (5-HIAA)': 'neurological',
    # copper-status
    'Serum Copper': 'copper-status', 'Ceruloplasmin': 'copper-status',
    # thyroid
    'TSH': 'thyroid', 'Free T3': 'thyroid', 'Free T4': 'thyroid', 'Calcitonin': 'thyroid',
    # longevity
    'IGF-1': 'longevity', 'IGFBP-3': 'longevity', 'Biological Age Score': 'longevity', 'Telomere Length': 'longevity',
    'NAD+': 'longevity', '8-OHdG': 'longevity', 'Mitochondrial Function Markers': 'longevity', 'Homocysteine': 'longevity',
    'Collagen Biomarkers (CTX/P1NP)': 'longevity',
    # hematology (new)
    'CBC with Differential': 'hematology', 'WBC Differential': 'hematology', 'Ferritin': 'hematology', 'TIBC': 'hematology',
    # electrolyte (new)
    'Sodium': 'electrolyte', 'Osmolality': 'electrolyte',
}

missing_cat = [m for m in ALL_84 if m not in CATEGORY]
if missing_cat:
    raise SystemExit(f'MISSING CATEGORY for: {missing_cat}')

# ---- build biomarkers.csv ----
rows_out = []
for name in sorted(ALL_84):
    slug = slugify(name)
    counts = canon_counts.get(name, {'t1': 0, 't2': 0, 't3': 0, 'total': 0})
    if counts['total'] == 0:
        tier = 3  # NAD+ only case: never referenced by a peptide protocol; default to advanced/longevity tier
        rank = None
        note = 'Not referenced by any of the 60 peptide protocols in watchtower_biomarker_audit.xlsx; tier defaulted to 3 (advanced).'
    else:
        # primary tier = whichever of t1/t2/t3 has the highest count
        tier = max([(counts['t1'], 1), (counts['t2'], 2), (counts['t3'], 3)])[1]
        rank = counts['total']
        note = None
    rows_out.append({
        'name': name, 'slug': slug, 'category': CATEGORY[name], 'tier': tier,
        'peptide_relevance_rank': rank, 'notes': note
    })

with open(f'{SCRATCH}/seed_biomarkers.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['name', 'slug', 'category', 'tier', 'peptide_relevance_rank', 'notes'])
    w.writeheader()
    w.writerows(rows_out)

# also save a name->slug lookup for downstream scripts
with open(f'{SCRATCH}/biomarker_slug_lookup.json', 'w') as f:
    json.dump({r['name']: r['slug'] for r in rows_out}, f, indent=2)

print(f'OK — {len(rows_out)} biomarkers written to seed_biomarkers.csv')
print(f'  by category: {dict(sorted({c: sum(1 for r in rows_out if r["category"]==c) for c in set(CATEGORY.values())}.items()))}')
print(f'  by tier: {dict(sorted({t: sum(1 for r in rows_out if r["tier"]==t) for t in (1,2,3)}.items()))}')
print(f'  markers with rank=None (never referenced by a protocol): {[r["name"] for r in rows_out if r["peptide_relevance_rank"] is None]}')
