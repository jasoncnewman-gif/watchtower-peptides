import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CalculatorSuite, { CalcPeptide } from "@/components/CalculatorSuite";
import { getPeptides } from "@/lib/supabase";
import { DbPeptide } from "@/lib/supabase";

const DB_CATEGORY_MAP: Record<string, string> = {
  healing:           "Healing & Recovery",
  hormones:          "Hormones & Performance",
  metabolic:         "Weight & Metabolic",
  "brain-longevity": "Brain & Longevity",
  immune:            "Immune & Protective",
  blend:             "Blends",
};

function parseRange(str: string): { low: number; high: number; unit: string } | null {
  // handles "200–400 mcg", "0.25 mg → 2.4 mg", "500 mcg – 1 mg", "250 mcg"
  const m = str.match(/(\d+\.?\d*)\s*(?:[-–]|→)\s*(\d+\.?\d*)\s*(mcg|mg)/i);
  if (!m) {
    const s = str.match(/(\d+\.?\d*)\s*(mcg|mg)/i);
    if (!s) return null;
    const v = parseFloat(s[1]);
    return { low: v, high: v, unit: s[2].toLowerCase() };
  }
  return { low: parseFloat(m[1]), high: parseFloat(m[2]), unit: m[3].toLowerCase() };
}

function dbToCalcPeptide(db: DbPeptide): CalcPeptide {
  const range  = db.dosage?.ranges?.[0];
  const parsed = range?.range ? parseRange(range.range) : null;

  return {
    name:     db.name,
    slug:     db.slug,
    category: DB_CATEGORY_MAP[db.category ?? ""] ?? "Other",
    doseRange: parsed ?? { low: 0, high: 0, unit: "mcg" },
    frequency: range?.frequency ?? "Once daily",
    timing: [{
      label:     range?.route ?? "Any time of day",
      preferred: true,
      note:      range?.notes ?? "",
    }],
    durationWeeks: { min: 4, max: 12 },
    protocolNote:  db.dosage?.disclaimer ?? range?.notes ?? "",
    commonVials:   [5, 10],
  };
}

export default async function CalculatorPage() {
  let peptides: CalcPeptide[] = [];
  try {
    const rows = await getPeptides();
    peptides = rows
      .filter(p => !p.blend_components || p.blend_components.length === 0)
      .map(dbToCalcPeptide)
      .filter(p => p.doseRange.high > 0); // only peptides with actual dosage data
  } catch {
    // falls back to PLACEHOLDER_PEPTIDES inside CalculatorSuite
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <Nav />
      <div className="pt-20">
        <CalculatorSuite peptides={peptides.length > 0 ? peptides : undefined} />
      </div>
      <Footer verseIndex={0} />
    </div>
  );
}
