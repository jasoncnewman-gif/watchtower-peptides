"use client";

import { useState, useEffect, useMemo, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// PLACEHOLDER DATA
// Replace by fetching from Supabase server-side and passing as a
// prop: <CalculatorSuite peptides={peptides} />
// The DB schema needs flat numeric dose columns before that's viable.
// ─────────────────────────────────────────────────────────────────

const PLACEHOLDER_PEPTIDES = [
  {
    name: "BPC-157", slug: "bpc-157", category: "Healing & Recovery",
    doseRange: { low: 200, high: 400, unit: "mcg" },
    frequency: "Once or twice daily",
    timing: [
      { label: "Morning (fasted)", preferred: true, note: "Take 30–60 min before food." },
      { label: "Pre-sleep", preferred: false, note: "Split AM/PM dosing for systemic recovery." },
    ],
    durationWeeks: { min: 4, max: 12 },
    protocolNote: "Cycled 4–6 weeks on, 2 weeks off. Subcutaneous injection near injury site preferred.",
    commonVials: [5, 10],
  },
  {
    name: "TB-500", slug: "tb-500", category: "Healing & Recovery",
    doseRange: { low: 2000, high: 2500, unit: "mcg" },
    frequency: "Twice weekly (loading) → once weekly (maintenance)",
    timing: [{ label: "Any time of day", preferred: true, note: "Consistency matters more than timing." }],
    durationWeeks: { min: 4, max: 6 },
    protocolNote: "Loading: 2–2.5mg twice weekly × 4–6 weeks. Maintenance: 2mg once weekly.",
    commonVials: [5, 10],
  },
  {
    name: "Ipamorelin", slug: "ipamorelin", category: "Hormones & Performance",
    doseRange: { low: 200, high: 300, unit: "mcg" },
    frequency: "Once to three times daily",
    timing: [
      { label: "Pre-sleep", preferred: true, note: "Maximizes natural GH pulse." },
      { label: "Morning (fasted)", preferred: false, note: "Alternative for performance goals." },
    ],
    durationWeeks: { min: 8, max: 12 },
    protocolNote: "Often stacked with CJC-1295 (no DAC). Avoid dosing within 1–2 hours of high-carb meals.",
    commonVials: [2, 5],
  },
  {
    name: "CJC-1295", slug: "cjc-1295", category: "Hormones & Performance",
    doseRange: { low: 100, high: 300, unit: "mcg" },
    frequency: "Once to three times daily",
    timing: [
      { label: "Pre-sleep", preferred: true, note: "Stack with Ipamorelin for maximal GH pulse." },
      { label: "Morning (fasted)", preferred: false, note: "For daytime performance protocols." },
    ],
    durationWeeks: { min: 8, max: 16 },
    protocolNote: "No-DAC variant preferred. Commonly 1:1 ratio with Ipamorelin per injection.",
    commonVials: [2, 5],
  },
  {
    name: "Semaglutide", slug: "semaglutide", category: "Weight & Metabolic",
    doseRange: { low: 250, high: 2400, unit: "mcg" },
    frequency: "Once weekly",
    timing: [{ label: "Same day each week", preferred: true, note: "Consistency of day matters more than time of day." }],
    durationWeeks: { min: 12, max: 52 },
    protocolNote: "Escalation: 0.25mg/week × 4 weeks → 0.5mg × 4 weeks → up to 2.4mg. Rotate injection sites.",
    commonVials: [2, 5],
  },
  {
    name: "Semax", slug: "semax", category: "Brain & Longevity",
    doseRange: { low: 300, high: 900, unit: "mcg" },
    frequency: "Once or twice daily",
    timing: [
      { label: "Morning", preferred: true, note: "Most research uses morning intranasal dosing." },
    ],
    durationWeeks: { min: 2, max: 8 },
    protocolNote: "Typically administered intranasally. Cycled 2–4 weeks on, 1–2 weeks off.",
    commonVials: [5],
  },
  {
    name: "Thymosin Alpha-1", slug: "thymosin-alpha-1", category: "Immune & Protective",
    doseRange: { low: 900, high: 1800, unit: "mcg" },
    frequency: "Twice weekly",
    timing: [{ label: "Any time of day", preferred: true, note: "Timing is not critical. Subcutaneous injection." }],
    durationWeeks: { min: 4, max: 12 },
    protocolNote: "Used in immune modulation research. 900mcg–1.8mg twice weekly subcutaneously.",
    commonVials: [5, 10],
  },
];

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All",
  "Healing & Recovery",
  "Hormones & Performance",
  "Weight & Metabolic",
  "Brain & Longevity",
  "Immune & Protective",
  "Blends",
];

const FREQUENCY_OPTIONS = [
  { label: "Once daily",       multiplier: 1 },
  { label: "Twice daily",      multiplier: 2 },
  { label: "Three times daily", multiplier: 3 },
  { label: "Every other day",  multiplier: 0.5 },
  { label: "Twice weekly",     multiplier: 2 / 7 },
  { label: "Once weekly",      multiplier: 1 / 7 },
];

const VIAL_SIZES = [2, 5, 10, 15, 20, 30];

const SYRINGE_TYPES = [
  { label: "U-100", unitsPerMl: 100, note: "Most common for peptides. 1 mL = 100 units." },
  { label: "U-50",  unitsPerMl: 50,  note: "1 mL = 50 units." },
  { label: "U-30",  unitsPerMl: 30,  note: "1 mL = 30 units. Primarily insulin use." },
];

const TABLE_DOSES_MCG = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500];

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────

const C = {
  bg: "#FFFFFF",
  surface: "#F7F8FA",
  border: "#E5E7EB",
  accent: "#2B6CB0",
  accentLight: "#EBF4FF",
  success: "#276749",
  successLight: "#F0FFF4",
  text: "#111827",
  textMid: "#374151",
  textMuted: "#6B7280",
  warn: "#92400E",
  warnLight: "#FFFBEB",
};

const S = {
  label:  { fontSize: 13, fontWeight: 600, color: C.textMid, display: "block", marginBottom: 6, letterSpacing: "0.01em" } as React.CSSProperties,
  input:  { width: "100%", padding: "10px 14px", fontSize: 15, border: `1.5px solid ${C.border}`, borderRadius: 8, backgroundColor: C.bg, color: C.text, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" },
  select: { width: "100%", padding: "10px 14px", fontSize: 15, border: `1.5px solid ${C.border}`, borderRadius: 8, backgroundColor: C.bg, color: C.text, outline: "none", boxSizing: "border-box" as const, cursor: "pointer", fontFamily: "inherit", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 },
  btn:        { padding: "11px 24px", backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" } as React.CSSProperties,
  btnOutline: { padding: "9px 18px", backgroundColor: "transparent", color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" } as React.CSSProperties,
  card:    { backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28 } as React.CSSProperties,
  surface: { backgroundColor: C.surface, borderRadius: 10, padding: 20 } as React.CSSProperties,
  statBox: (color = C.accent, bg = C.accentLight, border = "#BEE3F8"): React.CSSProperties => ({ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 8px", textAlign: "center" }),
  statVal:   (color = C.accent): React.CSSProperties => ({ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4, whiteSpace: "nowrap" }),
  statLabel: (color = C.accent): React.CSSProperties => ({ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.08em" }),
};

// ─────────────────────────────────────────────────────────────────
// SHARED: PEPTIDE SELECTOR
// ─────────────────────────────────────────────────────────────────

export type CalcPeptide = {
  name: string;
  slug: string;
  category: string;
  doseRange: { low: number; high: number; unit: string };
  frequency: string;
  timing: { label: string; preferred: boolean; note: string }[];
  durationWeeks: { min: number; max: number };
  protocolNote: string;
  commonVials: number[];
  perKgDosing?: boolean;  // true when DB range was mcg/kg or mg/kg
  escalation?: boolean;   // true for GLP drugs — fixed ramp, not weight-scaled
  loadingPhase?: {
    range: { low: number; high: number; unit: string };
    frequency: string;
    durationWeeks: { min: number; max: number };
  };
  maintenancePhase?: {
    range: { low: number; high: number; unit: string };
    frequency: string;
  };
};

type Peptide = CalcPeptide;

function PeptideSelector({ peptides, value, onChange }: { peptides: Peptide[]; value: string; onChange: (name: string) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => peptides.filter(p => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [peptides, search, category]);

  const selected = peptides.find(p => p.name === value);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ ...S.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", border: open ? `1.5px solid ${C.accent}` : `1.5px solid ${C.border}` }}
      >
        <span>
          {selected
            ? <><strong>{selected.name}</strong> <span style={{ color: C.textMuted, fontSize: 13 }}>— {selected.category}</span></>
            : <span style={{ color: C.textMuted }}>Select a peptide…</span>
          }
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, backgroundColor: C.bg, border: `1.5px solid ${C.accent}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
            <input
              autoFocus
              type="text"
              placeholder="Search peptides…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...S.input, padding: "8px 12px", fontSize: 13, border: `1.5px solid ${C.border}` }}
            />
          </div>
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{ padding: "4px 10px", borderRadius: 999, border: `1.5px solid ${category === cat ? C.accent : C.border}`, backgroundColor: category === cat ? C.accentLight : C.bg, color: category === cat ? C.accent : C.textMuted, fontSize: 11, fontWeight: category === cat ? 700 : 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {filtered.length === 0
              ? <div style={{ padding: "16px", fontSize: 13, color: C.textMuted, textAlign: "center" }}>No peptides found</div>
              : filtered.map(p => (
                <button
                  key={p.slug}
                  onClick={() => { onChange(p.name); setOpen(false); setSearch(""); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 16px", backgroundColor: p.name === value ? C.accentLight : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", borderBottom: `1px solid ${C.border}` }}
                >
                  <span style={{ fontSize: 14, fontWeight: p.name === value ? 700 : 400, color: p.name === value ? C.accent : C.text }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8 }}>{p.category}</span>
                </button>
              ))
            }
          </div>
          <div style={{ padding: "8px 16px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textMuted }}>
            {filtered.length} peptide{filtered.length !== 1 ? "s" : ""}{category !== "All" || search ? " matching filters" : " in library"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOOL 1: DOSAGE PLANNER
// ─────────────────────────────────────────────────────────────────

function fmtDose(v: number, unit: string): string {
  if (unit === "mg") {
    if (v < 1)  return v.toFixed(2);
    if (v < 10) return Number(v.toFixed(1)).toString();
    return Math.round(v).toString();
  }
  return Math.round(v).toString();
}

function calcAdj(base: number, wKg: number | null, perKg: boolean | undefined): number {
  if (!wKg) return base;
  return perKg ? base * wKg : base * (wKg / 75);
}

function DosagePlanner({ peptides, onUseValues }: { peptides: Peptide[]; onUseValues: (v: { peptide: string; doseAmount: number; doseUnit: string; durationWeeks: number }) => void }) {
  const [selectedName, setSelectedName] = useState(peptides[0]?.name || "");
  const [result, setResult]             = useState<Peptide | null>(null);
  const [weightInput, setWeightInput]   = useState("");
  const [useKg, setUseKg]               = useState(false);
  const [phase, setPhase]               = useState<"loading" | "maintenance">("loading");
  const [customDose, setCustomDose]     = useState("");

  const peptide = peptides.find(p => p.name === selectedName);

  useEffect(() => { setResult(null); setPhase("loading"); setCustomDose(""); }, [selectedName]);

  const weightKg = useMemo(() => {
    const v = parseFloat(weightInput);
    if (!weightInput || isNaN(v) || v <= 0) return null;
    return useKg ? v : v / 2.2046;
  }, [weightInput, useKg]);

  const hasPhases = result?.loadingPhase != null && result?.maintenancePhase != null;

  const activeRange = useMemo(() => {
    if (!result) return { low: 0, high: 0, unit: "mcg" as string };
    if (hasPhases && phase === "loading")      return result.loadingPhase!.range;
    if (hasPhases && phase === "maintenance")  return result.maintenancePhase!.range;
    return result.doseRange;
  }, [result, hasPhases, phase]);

  const activeFreq = useMemo(() => {
    if (!result) return "";
    if (hasPhases && phase === "loading")     return result.loadingPhase!.frequency;
    if (hasPhases && phase === "maintenance") return result.maintenancePhase!.frequency;
    return result.frequency;
  }, [result, hasPhases, phase]);

  const activeDurationWeeks = useMemo(() => {
    if (!result) return null;
    if (hasPhases && phase === "loading")     return result.loadingPhase!.durationWeeks;
    if (hasPhases && phase === "maintenance") return null; // maintenance is ongoing
    return result.durationWeeks;
  }, [result, hasPhases, phase]);

  const adjLow  = calcAdj(activeRange.low,  weightKg, result?.perKgDosing);
  const adjHigh = calcAdj(activeRange.high, weightKg, result?.perKgDosing);
  const showAdj = weightKg !== null && result !== null && !result.escalation;
  const dispLow  = showAdj ? adjLow  : activeRange.low;
  const dispHigh = showAdj ? adjHigh : activeRange.high;
  const weightLabel = weightKg
    ? (useKg ? `${Math.round(weightKg)} kg` : `${Math.round(weightKg * 2.2046)} lbs`)
    : null;

  const midpoint    = Math.round((dispLow + dispHigh) / 2);
  const rawDoseVal  = customDose !== "" ? parseFloat(customDose) : NaN;
  const doseNum     = !isNaN(rawDoseVal) && rawDoseVal > 0 ? rawDoseVal : midpoint;
  const doseWarnLow  = !isNaN(rawDoseVal) && rawDoseVal > 0 && rawDoseVal < dispLow;
  const doseWarnHigh = !isNaN(rawDoseVal) && rawDoseVal > dispHigh;
  const doseBlocked  = !isNaN(rawDoseVal) && (rawDoseVal <= 0 || rawDoseVal > 10000);

  // Sync editable dose to new midpoint when weight-adjusted range or result changes
  useEffect(() => { if (result) setCustomDose(String(midpoint)); }, [midpoint, result]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
        Research-backed dose ranges drawn from published studies. Enter your body weight for a personalized dose estimate.
      </p>

      <div>
        <label style={S.label}>Peptide</label>
        <PeptideSelector peptides={peptides} value={selectedName} onChange={setSelectedName} />
      </div>

      <div>
        <label style={S.label}>
          Body Weight <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span>
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            placeholder={useKg ? "e.g. 68" : "e.g. 150"}
            style={{ ...S.input, flex: 1 }}
          />
          <div style={{ display: "flex", borderRadius: 8, border: `1.5px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
            {([{ label: "lbs", kg: false }, { label: "kg", kg: true }] as const).map(opt => (
              <button
                key={opt.label}
                onClick={() => setUseKg(opt.kg)}
                style={{ padding: "10px 16px", backgroundColor: useKg === opt.kg ? C.accent : C.bg, color: useKg === opt.kg ? "#fff" : C.textMuted, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {weightKg && (
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
            {useKg ? `${Math.round(weightKg * 2.2046)} lbs` : `${weightKg.toFixed(1)} kg`}
          </div>
        )}
      </div>

      <button
        onClick={() => { if (peptide) { setResult(peptide); setCustomDose(String(Math.round((peptide.doseRange.low + peptide.doseRange.high) / 2))); } }}
        disabled={!peptide}
        style={{ ...S.btn, opacity: peptide ? 1 : 0.5 }}
      >
        View Protocol Reference →
      </button>

      {result && (
        <div style={{ ...S.surface, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Phase toggle — only shown when peptide has loading + maintenance phases */}
          {hasPhases && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Protocol Phase</div>
              <div style={{ display: "flex", borderRadius: 8, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
                {(["loading", "maintenance"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPhase(p)}
                    style={{ flex: 1, padding: "10px 16px", backgroundColor: phase === p ? C.accent : C.bg, color: phase === p ? "#fff" : C.textMuted, border: "none", fontSize: 13, fontWeight: phase === p ? 700 : 500, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}
                  >
                    {p === "loading" ? `Loading (${result.loadingPhase!.durationWeeks.min}–${result.loadingPhase!.durationWeeks.max} wks)` : "Maintenance (ongoing)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dose stat boxes */}
          <div>
            {showAdj && (
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Estimated dose for {weightLabel}
              </div>
            )}
            {!showAdj && weightKg && result.escalation && (
              <div style={{ backgroundColor: C.accentLight, border: `1px solid #BEE3F8`, borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 12, color: C.accent, lineHeight: 1.5 }}>
                <strong>Fixed escalation protocol</strong> — the weekly ramp schedule is the same regardless of body weight. Your starting dose is always {fmtDose(result.doseRange.low, result.doseRange.unit)} {result.doseRange.unit}. Body weight may influence your final maintenance dose tolerance.
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div style={S.statBox()}>
                <div style={S.statVal()}>{fmtDose(dispLow, activeRange.unit)}</div>
                <div style={S.statLabel()}>{activeRange.unit} · Low</div>
              </div>
              <div style={S.statBox()}>
                <div style={S.statVal()}>{fmtDose(dispHigh, activeRange.unit)}</div>
                <div style={S.statLabel()}>{activeRange.unit} · High</div>
              </div>
              <div style={S.statBox(C.success, C.successLight, "#9AE6B4")}>
                {activeDurationWeeks
                  ? <><div style={S.statVal(C.success)}>{activeDurationWeeks.min}–{activeDurationWeeks.max}</div><div style={S.statLabel(C.success)}>Weeks</div></>
                  : <><div style={S.statVal(C.success)}>∞</div><div style={S.statLabel(C.success)}>Ongoing</div></>
                }
              </div>
            </div>
            {showAdj && (
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                Reference range (75 kg / 165 lbs): {activeRange.low}–{activeRange.high} {activeRange.unit}
                {result.perKgDosing && " · weight-based dosing"}
              </div>
            )}
          </div>

          <div>
            <label style={S.label}>Dose to use for calculations</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                value={customDose}
                onChange={e => setCustomDose(e.target.value)}
                placeholder={String(midpoint)}
                style={{ ...S.input, flex: 1, borderColor: doseBlocked ? "#F87171" : (doseWarnLow || doseWarnHigh) ? "#F59E0B" : C.border }}
              />
              <span style={{ fontSize: 13, color: C.textMuted, flexShrink: 0 }}>{activeRange.unit}</span>
            </div>
            {doseBlocked && !isNaN(rawDoseVal) && rawDoseVal <= 0 && (
              <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>Dose must be greater than 0</div>
            )}
            {doseBlocked && rawDoseVal > 10000 && (
              <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>Dose exceeds 10,000 {activeRange.unit} — above safe research range</div>
            )}
            {doseWarnLow  && <div style={{ fontSize: 11, color: C.warn, marginTop: 4 }}>Below studied range ({fmtDose(dispLow, activeRange.unit)}–{fmtDose(dispHigh, activeRange.unit)} {activeRange.unit})</div>}
            {doseWarnHigh && <div style={{ fontSize: 11, color: C.warn, marginTop: 4 }}>Above studied range ({fmtDose(dispLow, activeRange.unit)}–{fmtDose(dispHigh, activeRange.unit)} {activeRange.unit})</div>}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Frequency</div>
            <div style={{ fontSize: 14, color: C.textMid }}>{activeFreq}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Timing</div>
            {result.timing.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0, marginTop: 1, color: t.preferred ? C.success : C.textMuted, backgroundColor: t.preferred ? C.successLight : C.surface }}>
                  {t.preferred ? "Preferred" : "Alt"}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{t.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: C.warnLight, border: `1px solid #FDE68A`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.warn, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Protocol Notes</div>
            <div style={{ fontSize: 13, color: C.warn, lineHeight: 1.5 }}>{result.protocolNote}</div>
          </div>

          <div style={{ fontSize: 11, color: C.textMuted, borderTop: `1px solid ${C.border}`, paddingTop: 12, lineHeight: 1.5 }}>
            For research purposes only. Not medical advice. Consult a licensed healthcare professional before use.
          </div>

          <button
            onClick={() => onUseValues({ peptide: result.name, doseAmount: doseNum, doseUnit: activeRange.unit, durationWeeks: activeDurationWeeks?.min ?? result.durationWeeks.min })}
            disabled={doseBlocked}
            style={{ ...S.btn, opacity: doseBlocked ? 0.5 : 1 }}
          >
            Use {fmtDose(doseNum, activeRange.unit)} {activeRange.unit} in Order Calculator →
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOOL 2: ORDER CALCULATOR
// ─────────────────────────────────────────────────────────────────

type OrderPrefill = { peptide: string; doseAmount: number; doseUnit: string; durationWeeks: number };
type OrderResult  = { totalMg: number; vialsNeeded: number; vialSize: number; dose: number; doseUnit: string; freq: typeof FREQUENCY_OPTIONS[0]; weeks: number; peptide: string };

function OrderCalculator({ peptides, prefill, onUseValues }: {
  peptides: Peptide[];
  prefill: OrderPrefill | null;
  onUseValues: (v: { peptide: string; vialSize: number; doseAmount: number; doseUnit: string }) => void;
}) {
  const [selectedName, setSelectedName] = useState(prefill?.peptide || peptides[0]?.name || "");
  const [doseAmount, setDoseAmount]     = useState(String(prefill?.doseAmount || ""));
  const [doseUnit, setDoseUnit]         = useState(prefill?.doseUnit || "mcg");
  const [freqIndex, setFreqIndex]       = useState(0);
  const [weeks, setWeeks]               = useState(String(prefill?.durationWeeks || ""));
  const [vialSize, setVialSize]         = useState(5);
  const [result, setResult]             = useState<OrderResult | null>(null);

  const calculate = () => {
    const dose = parseFloat(doseAmount);
    const w    = parseFloat(weeks);
    if (!dose || !w) return;
    const freq   = FREQUENCY_OPTIONS[freqIndex];
    const doseMg = doseUnit === "mcg" ? dose / 1000 : dose;
    const totalMg = doseMg * freq.multiplier * w * 7;
    setResult({ totalMg, vialsNeeded: Math.ceil(totalMg / vialSize), vialSize, dose, doseUnit, freq, weeks: w, peptide: selectedName });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
        Enter your protocol to calculate exactly how many vials to order before you buy.
      </p>

      <div>
        <label style={S.label}>Peptide</label>
        <PeptideSelector peptides={peptides} value={selectedName} onChange={setSelectedName} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={S.label}>Dose per Injection</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={doseAmount} onChange={e => setDoseAmount(e.target.value)} placeholder="e.g. 250" style={{ ...S.input, flex: 1 }} />
            <select value={doseUnit} onChange={e => setDoseUnit(e.target.value)} style={{ ...S.select, width: 80 }}>
              <option>mcg</option><option>mg</option>
            </select>
          </div>
        </div>
        <div>
          <label style={S.label}>Protocol Duration</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" value={weeks} onChange={e => setWeeks(e.target.value)} placeholder="e.g. 8" style={{ ...S.input, flex: 1 }} />
            <span style={{ fontSize: 13, color: C.textMuted, whiteSpace: "nowrap" }}>weeks</span>
          </div>
        </div>
      </div>

      <div>
        <label style={S.label}>Injection Frequency</label>
        <select value={freqIndex} onChange={e => setFreqIndex(Number(e.target.value))} style={S.select}>
          {FREQUENCY_OPTIONS.map((f, i) => <option key={i} value={i}>{f.label}</option>)}
        </select>
      </div>

      <div>
        <label style={S.label}>Vial Size</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {VIAL_SIZES.map(v => (
            <button key={v} onClick={() => setVialSize(v)} style={{ padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${vialSize === v ? C.accent : C.border}`, backgroundColor: vialSize === v ? C.accentLight : C.bg, color: vialSize === v ? C.accent : C.textMid, fontSize: 14, fontWeight: vialSize === v ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
              {v}mg
            </button>
          ))}
        </div>
      </div>

      <button onClick={calculate} style={S.btn}>Calculate Order →</button>

      {result && (
        <div style={{ ...S.surface, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid grid-cols-3 gap-3">
            <div style={S.statBox()}>
              <div style={S.statVal()}>{result.totalMg.toFixed(2)}</div>
              <div style={S.statLabel()}>mg Needed</div>
            </div>
            <div style={S.statBox()}>
              <div style={S.statVal()}>{result.vialsNeeded}</div>
              <div style={S.statLabel()}>{result.vialSize}mg Vials</div>
            </div>
            <div style={S.statBox(C.success, C.successLight, "#9AE6B4")}>
              <div style={S.statVal(C.success)}>{result.weeks}</div>
              <div style={S.statLabel(C.success)}>Weeks</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: C.textMuted, backgroundColor: C.surface, borderRadius: 8, padding: "10px 14px" }}>
            <strong>Calculation:</strong> {result.dose} {result.doseUnit} × {result.freq.label.toLowerCase()} × {result.weeks} weeks = {result.totalMg.toFixed(2)} mg → {result.vialsNeeded} × {result.vialSize}mg vials
          </div>

          <button onClick={() => onUseValues({ peptide: result.peptide, vialSize: result.vialSize, doseAmount: result.dose, doseUnit: result.doseUnit })} style={S.btn}>
            Use in Reconstitution Calculator →
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOOL 3: RECONSTITUTION CALCULATOR
// ─────────────────────────────────────────────────────────────────

type ReconPrefill = { vialSize?: number; doseAmount?: number; doseUnit?: string };

function ReconstitutionCalculator({ prefill }: { prefill: ReconPrefill | null }) {
  const [vialMg, setVialMg]         = useState(String(prefill?.vialSize || ""));
  const [bacWater, setBacWater]     = useState("2");
  const [targetDose, setTargetDose] = useState(String(prefill?.doseAmount || ""));
  const [targetUnit, setTargetUnit] = useState(prefill?.doseUnit || "mcg");
  const [syringeIdx, setSyringeIdx] = useState(0);
  const [result, setResult]         = useState<{ concMgPerMl: number; concMcgPerMl: number; mlToDraw: number | null; vial: number; water: number; dose: number | null; targetUnit: string } | null>(null);

  const syringe = SYRINGE_TYPES[syringeIdx];

  const calculate = () => {
    const vial  = parseFloat(vialMg);
    const water = parseFloat(bacWater);
    const dose  = parseFloat(targetDose);
    if (!vial || !water) return;
    const concMgPerMl  = vial / water;
    const concMcgPerMl = concMgPerMl * 1000;
    let mlToDraw: number | null = null;
    if (dose) {
      const doseMg = targetUnit === "mcg" ? dose / 1000 : dose;
      mlToDraw = doseMg / concMgPerMl;
    }
    setResult({ concMgPerMl, concMcgPerMl, mlToDraw, vial, water, dose: dose || null, targetUnit });
  };

  const displayUnits = result?.mlToDraw != null ? result.mlToDraw * syringe.unitsPerMl : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6 }}>
        Enter your vial size and BAC water volume to get your concentration, then find exact draw volumes and syringe markings for any dose.
      </p>

      <div>
        <label style={S.label}>Syringe Type</label>
        <div style={{ display: "flex", gap: 8 }}>
          {SYRINGE_TYPES.map((s, i) => (
            <button key={i} onClick={() => setSyringeIdx(i)} style={{ padding: "8px 18px", borderRadius: 8, border: `1.5px solid ${syringeIdx === i ? C.accent : C.border}`, backgroundColor: syringeIdx === i ? C.accentLight : C.bg, color: syringeIdx === i ? C.accent : C.textMid, fontSize: 14, fontWeight: syringeIdx === i ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{syringe.note}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={S.label}>Vial Size</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" value={vialMg} onChange={e => setVialMg(e.target.value)} placeholder="e.g. 5" style={{ ...S.input, flex: 1 }} />
            <span style={{ fontSize: 13, color: C.textMuted }}>mg</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {[2, 5, 10, 15].map(v => (
              <button key={v} onClick={() => setVialMg(String(v))} style={{ padding: "4px 10px", borderRadius: 999, border: `1.5px solid ${vialMg === String(v) ? C.accent : C.border}`, backgroundColor: vialMg === String(v) ? C.accentLight : C.bg, color: vialMg === String(v) ? C.accent : C.textMuted, fontSize: 11, fontWeight: vialMg === String(v) ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                {v}mg
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={S.label}>Bacteriostatic Water</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" value={bacWater} onChange={e => setBacWater(e.target.value)} placeholder="e.g. 2" style={{ ...S.input, flex: 1 }} />
            <span style={{ fontSize: 13, color: C.textMuted }}>mL</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {["1", "2", "3", "5", "10"].map(v => (
              <button key={v} onClick={() => setBacWater(v)} style={{ padding: "4px 10px", borderRadius: 999, border: `1.5px solid ${bacWater === v ? C.accent : C.border}`, backgroundColor: bacWater === v ? C.accentLight : C.bg, color: bacWater === v ? C.accent : C.textMuted, fontSize: 11, fontWeight: bacWater === v ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                {v} mL
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Target Dose <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={targetDose} onChange={e => setTargetDose(e.target.value)} placeholder="e.g. 250" style={{ ...S.input, flex: 1 }} />
          <select value={targetUnit} onChange={e => setTargetUnit(e.target.value)} style={{ ...S.select, width: 90 }}>
            <option>mcg</option><option>mg</option>
          </select>
        </div>
      </div>

      <button onClick={calculate} style={S.btn}>Calculate →</button>

      {result && (
        <div style={{ ...S.surface, display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Concentration After Mixing</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.statBox()}>
                <div style={S.statVal()}>{result.concMgPerMl.toFixed(3)}</div>
                <div style={S.statLabel()}>mg / mL</div>
              </div>
              <div style={S.statBox()}>
                <div style={S.statVal()}>{result.concMcgPerMl.toFixed(1)}</div>
                <div style={S.statLabel()}>mcg / mL</div>
              </div>
            </div>
          </div>

          {result.mlToDraw != null && displayUnits != null && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                Draw Volume for {result.dose} {result.targetUnit} — {syringe.label} Syringe
              </div>
              <div style={{ backgroundColor: C.accentLight, border: `1px solid #BEE3F8`, borderRadius: 10, padding: "16px 20px", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.textMid, lineHeight: 1.4 }}>
                  Draw to the{" "}
                  <span style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{displayUnits.toFixed(1)}</span>
                  {" "}unit mark on a {syringe.label} insulin syringe
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>({result.mlToDraw.toFixed(3)} mL)</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={S.statBox()}>
                  <div style={S.statVal()}>{displayUnits.toFixed(1)}</div>
                  <div style={S.statLabel()}>{syringe.label} units</div>
                </div>
                <div style={S.statBox(C.success, C.successLight, "#9AE6B4")}>
                  <div style={S.statVal(C.success)}>{result.mlToDraw.toFixed(3)}</div>
                  <div style={S.statLabel(C.success)}>mL to draw</div>
                </div>
              </div>
              <div style={{ backgroundColor: C.surface, borderRadius: 8, padding: "12px 16px", fontSize: 12, color: C.textMuted }}>
                <div style={{ fontWeight: 600, color: C.textMid, marginBottom: 6 }}>Same dose on other syringe types:</div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
                  {SYRINGE_TYPES.map((s, i) => (
                    <div key={i} style={{ color: i === syringeIdx ? C.accent : C.textMuted, fontWeight: i === syringeIdx ? 700 : 400 }}>
                      {s.label}: <strong>{(result.mlToDraw! * s.unitsPerMl).toFixed(1)} units</strong>
                    </div>
                  ))}
                </div>
                <div>mL draw is always <strong>{result.mlToDraw.toFixed(3)} mL</strong> — only the unit markings change between syringe types.</div>
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Dose Reference Table — {syringe.label}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: C.border }}>
                    {["Dose (mcg)", "mL to Draw", `${syringe.label} Units`].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: C.textMid, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TABLE_DOSES_MCG.map((d, i) => {
                    const ml    = (d / 1000) / result.concMgPerMl;
                    const units = ml * syringe.unitsPerMl;
                    const isTarget = result.targetUnit === "mcg" && result.dose != null && Math.abs(d - result.dose) < 1;
                    return (
                      <tr key={d} style={{ backgroundColor: isTarget ? C.accentLight : i % 2 === 0 ? C.bg : C.surface }}>
                        <td style={{ padding: "7px 12px", fontWeight: isTarget ? 700 : 400, color: isTarget ? C.accent : C.textMid }}>
                          {d} mcg{isTarget ? " ← your dose" : ""}
                        </td>
                        <td style={{ padding: "7px 12px", color: C.textMid, fontFamily: "monospace" }}>{ml.toFixed(3)}</td>
                        <td style={{ padding: "7px 12px", color: C.textMid, fontWeight: 500, fontFamily: "monospace" }}>{units.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8, lineHeight: 1.5 }}>
              Switch syringe type above to update the units column. mL values never change.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "dosage",         label: "Dosage Planner",   desc: "What dose should I take?" },
  { id: "order",          label: "Order Calculator",  desc: "How many vials do I need?" },
  { id: "reconstitution", label: "Reconstitution",    desc: "How do I mix and draw?" },
];

export default function CalculatorSuite({ peptides = PLACEHOLDER_PEPTIDES }: { peptides?: Peptide[] }) {
  const [activeTab,    setActiveTab]    = useState("dosage");
  const [orderPrefill, setOrderPrefill] = useState<OrderPrefill | null>(null);
  const [reconPrefill, setReconPrefill] = useState<ReconPrefill | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const scrollToCard = () => {
    if (!cardRef.current) return;
    const top = cardRef.current.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleDosageUseValues = (vals: OrderPrefill) => { setOrderPrefill(vals); setActiveTab("order"); setTimeout(scrollToCard, 0); };
  const handleOrderUseValues  = (vals: ReconPrefill & { peptide: string }) => { setReconPrefill(vals); setActiveTab("reconstitution"); setTimeout(scrollToCard, 0); };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", color: C.text }}>
      <div style={{ padding: "32px 16px 0", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.accent, textTransform: "uppercase", marginBottom: 12 }}>Dosage Tools</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: C.text, margin: "0 0 12px", lineHeight: 1.1 }}>Peptide Calculator Suite</h1>
        <p style={{ fontSize: 15, color: C.textMuted, margin: "0 0 36px", lineHeight: 1.5 }}>
          Three independent tools. Use any one on its own, or follow the flow — values carry forward automatically.
        </p>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${C.border}`, marginBottom: 32 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "14px 12px 16px", backgroundColor: "transparent", border: "none", borderBottom: `3px solid ${activeTab === tab.id ? C.accent : "transparent"}`, marginBottom: -2, cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "border-color 0.15s" }}>
              <div style={{ fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? C.accent : C.textMuted, marginBottom: 3 }}>
                {tab.label}
                {tab.id === "order"          && orderPrefill && <span style={{ marginLeft: 5, fontSize: 9, color: C.success }}>●</span>}
                {tab.id === "reconstitution" && reconPrefill  && <span style={{ marginLeft: 5, fontSize: 9, color: C.success }}>●</span>}
              </div>
              <div className="hidden sm:block" style={{ fontSize: 11, color: activeTab === tab.id ? C.accent : C.textMuted, opacity: 0.8 }}>{tab.desc}</div>
            </button>
          ))}
        </div>

        <div ref={cardRef} style={S.card}>
          {activeTab === "order" && orderPrefill && (
            <div style={{ backgroundColor: C.successLight, border: `1px solid #9AE6B4`, borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.success, fontWeight: 500 }}>
              ✓ Pre-filled from Dosage Planner — {orderPrefill.peptide}, {orderPrefill.doseAmount} {orderPrefill.doseUnit}
            </div>
          )}
          {activeTab === "reconstitution" && reconPrefill && (
            <div style={{ backgroundColor: C.successLight, border: `1px solid #9AE6B4`, borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.success, fontWeight: 500 }}>
              ✓ Pre-filled from Order Calculator — {reconPrefill.vialSize}mg vial, {reconPrefill.doseAmount} {reconPrefill.doseUnit} target dose
            </div>
          )}

          {activeTab === "dosage"         && <DosagePlanner          peptides={peptides} onUseValues={handleDosageUseValues} />}
          {activeTab === "order"          && <OrderCalculator         peptides={peptides} prefill={orderPrefill} onUseValues={handleOrderUseValues} />}
          {activeTab === "reconstitution" && <ReconstitutionCalculator prefill={reconPrefill} />}
        </div>

        <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 20, lineHeight: 1.5, paddingBottom: 40 }}>
          For research purposes only. Not medical advice. All peptides referenced are sold as research chemicals for laboratory use only.
        </p>
      </div>
    </div>
  );
}
