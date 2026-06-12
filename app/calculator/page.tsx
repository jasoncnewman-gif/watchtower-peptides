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

function pickRange(ranges: any[]): any {
  // prefer subcutaneous/intramuscular injection over implant routes
  const injectable = ranges.find((r: any) =>
    /injection|subcutaneous|intramuscular|subq/i.test(r.route ?? "") &&
    !/implant/i.test(r.route ?? "")
  );
  return injectable ?? ranges[0];
}

function dbToCalcPeptide(db: DbPeptide): CalcPeptide {
  const ranges   = db.dosage?.ranges ?? [];
  const range    = pickRange(ranges);
  const rawRange = range?.range ?? "";
  const notes    = range?.notes ?? "";
  const parsed   = rawRange ? parseRange(rawRange) : null;
  const perKgDosing = rawRange.includes("/kg");
  const escalation  = notes.includes("Fixed weekly escalation")
    || (db.dosage as any)?.escalation_protocol === true;

  // structured loading/maintenance phases (e.g. TB-500)
  let loadingPhase: CalcPeptide["loadingPhase"] | undefined;
  let maintenancePhase: CalcPeptide["maintenancePhase"] | undefined;

  const lp = (db.dosage as any)?.loading_phase;
  const mp = (db.dosage as any)?.maintenance_phase;

  if (lp?.range) {
    const lpParsed = parseRange(lp.range);
    if (lpParsed) {
      loadingPhase = {
        range: lpParsed,
        frequency: lp.frequency ?? "",
        durationWeeks: lp.duration_weeks ?? { min: 4, max: 6 },
      };
    }
  }
  if (mp?.range) {
    const mpParsed = parseRange(mp.range);
    if (mpParsed) {
      maintenancePhase = {
        range: mpParsed,
        frequency: mp.frequency ?? "",
      };
    }
  }

  return {
    name:     db.name,
    slug:     db.slug,
    category: DB_CATEGORY_MAP[db.category ?? ""] ?? "Other",
    doseRange: parsed ?? { low: 0, high: 0, unit: "mcg" },
    frequency: range?.frequency ?? "Once daily",
    timing: [{
      label:     range?.route ?? "Any time of day",
      preferred: true,
      note:      notes,
    }],
    durationWeeks: { min: 4, max: 12 },
    protocolNote:  db.dosage?.disclaimer ?? notes ?? "",
    commonVials:   [5, 10],
    perKgDosing,
    escalation,
    loadingPhase,
    maintenancePhase,
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
