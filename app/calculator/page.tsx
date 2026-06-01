"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const COMMON_PEPTIDES = [
  { name: "BPC-157", typical_vial_mg: 5, typical_dose_mcg: 250 },
  { name: "TB-500", typical_vial_mg: 5, typical_dose_mcg: 2000 },
  { name: "Sermorelin", typical_vial_mg: 9, typical_dose_mcg: 300 },
  { name: "CJC-1295", typical_vial_mg: 2, typical_dose_mcg: 100 },
  { name: "PT-141", typical_vial_mg: 10, typical_dose_mcg: 1750 },
  { name: "Semaglutide", typical_vial_mg: 5, typical_dose_mcg: 250 },
];

export default function CalculatorPage() {
  const [vialMg, setVialMg] = useState("5");
  const [bacWaterMl, setBacWaterMl] = useState("2");
  const [doseMcg, setDoseMcg] = useState("250");

  const vialMgNum = parseFloat(vialMg) || 0;
  const bacWaterMlNum = parseFloat(bacWaterMl) || 0;
  const doseMcgNum = parseFloat(doseMcg) || 0;

  const vialMcg = vialMgNum * 1000;
  const concentration = bacWaterMlNum > 0 ? vialMcg / bacWaterMlNum : 0;
  const drawVolumeMl = concentration > 0 ? doseMcgNum / concentration : 0;
  const drawVolumeUnits = drawVolumeMl * 100;
  const dosesPerVial = doseMcgNum > 0 ? Math.floor(vialMcg / doseMcgNum) : 0;

  function applyPreset(preset: typeof COMMON_PEPTIDES[0]) {
    setVialMg(String(preset.typical_vial_mg));
    setDoseMcg(String(preset.typical_dose_mcg));
    setBacWaterMl("2");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-20 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Dosage Tools
            </p>
            <h1 className="text-5xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Reconstitution Calculator</h1>
            <p className="text-xl" style={{ color: "#6E6E73" }}>
              Calculate how many units to draw for your target dose after reconstituting with bacteriostatic water.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-xl mx-auto pt-4">

            {/* Quick-select presets */}
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#6E6E73" }}>
                Quick Select
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_PEPTIDES.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="text-sm px-4 py-2 rounded-full transition-colors hover:opacity-80"
                    style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F", border: "1px solid #E5E5E7" }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="rounded-2xl p-6 mb-5" style={{ backgroundColor: "#FFFFFF" }}>
              <h2 className="font-semibold mb-6" style={{ color: "#1D1D1F" }}>Inputs</h2>

              <div className="flex flex-col gap-5">
                {[
                  { label: "Vial Size (mg)", value: vialMg, setter: setVialMg, step: "0.5", placeholder: "e.g. 5" },
                  { label: "Bacteriostatic Water Added (mL)", value: bacWaterMl, setter: setBacWaterMl, step: "0.5", placeholder: "e.g. 2" },
                  { label: "Desired Dose (mcg)", value: doseMcg, setter: setDoseMcg, step: "50", placeholder: "e.g. 250" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#1D1D1F" }}>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={field.step}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        backgroundColor: "#F5F5F7",
                        color: "#1D1D1F",
                        border: "1px solid #E5E5E7",
                      }}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#FFFFFF" }}>
              <h2 className="font-semibold mb-6" style={{ color: "#1D1D1F" }}>Results</h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Concentration", value: concentration > 0 ? `${concentration.toFixed(0)} mcg/mL` : "—", highlight: false },
                  { label: "Draw Volume", value: drawVolumeMl > 0 ? `${drawVolumeMl.toFixed(3)} mL` : "—", highlight: false },
                  { label: "Syringe Units (U-100)", value: drawVolumeUnits > 0 ? `${drawVolumeUnits.toFixed(1)} units` : "—", highlight: true },
                  { label: "Doses Per Vial", value: dosesPerVial > 0 ? `${dosesPerVial} doses` : "—", highlight: false },
                ].map((r) => (
                  <div key={r.label} className="rounded-xl p-4" style={{ backgroundColor: "#F5F5F7" }}>
                    <div
                      className="text-xl font-bold mb-1"
                      style={{ color: r.highlight ? "#186784" : "#1D1D1F" }}
                    >
                      {r.value}
                    </div>
                    <div className="text-xs" style={{ color: "#6E6E73" }}>{r.label}</div>
                  </div>
                ))}
              </div>

              {drawVolumeUnits > 0 && (
                <div className="mt-5 p-4 rounded-xl text-sm" style={{ backgroundColor: "#F5F5F7" }}>
                  <p style={{ color: "#6E6E73" }}>
                    <span className="font-semibold" style={{ color: "#1D1D1F" }}>Summary: </span>
                    Draw <span style={{ color: "#186784", fontWeight: 600 }}>{drawVolumeUnits.toFixed(1)} units</span> on a
                    U-100 insulin syringe to deliver{" "}
                    <span style={{ color: "#186784", fontWeight: 600 }}>{doseMcgNum} mcg</span>.
                    This gives <span style={{ color: "#186784", fontWeight: 600 }}>{dosesPerVial} doses</span> per vial.
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="rounded-2xl p-5 text-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E5E7" }}>
              <p className="font-semibold mb-2" style={{ color: "#1D1D1F" }}>⚠ Research Use Only</p>
              <p style={{ color: "#6E6E73" }}>
                For informational and research purposes only. Always verify calculations independently.
                This is not medical advice.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer verseIndex={0} />
    </div>
  );
}
