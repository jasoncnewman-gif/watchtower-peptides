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
  const concentration = bacWaterMlNum > 0 ? vialMcg / bacWaterMlNum : 0; // mcg/mL
  const drawVolumeMl = concentration > 0 ? doseMcgNum / concentration : 0;
  const drawVolumeUnits = drawVolumeMl * 100; // U-100 syringe units
  const dosesPerVial = doseMcgNum > 0 ? Math.floor(vialMcg / doseMcgNum) : 0;

  function applyPreset(preset: typeof COMMON_PEPTIDES[0]) {
    setVialMg(String(preset.typical_vial_mg));
    setDoseMcg(String(preset.typical_dose_mcg));
    setBacWaterMl("2");
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#000101", color: "#FFFCF2" }}>
      <Nav />

      <div className="pt-20">
        {/* Header */}
        <section className="px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4" style={{ color: "#FFFCF2" }}>Reconstitution Calculator</h1>
            <p className="text-lg" style={{ color: "#C0A088" }}>
              Calculate how many units to draw for your target dose after reconstituting with bacteriostatic water.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-2xl mx-auto">

            {/* Quick-select presets */}
            <div className="mb-8">
              <p className="text-sm font-semibold mb-3" style={{ color: "#9A7C65" }}>QUICK SELECT</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_PEPTIDES.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="text-sm px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{ backgroundColor: "#0C2E3D", color: "#C0A088", border: "1px solid #186784" }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div
              className="rounded-xl p-6 mb-6"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <h2 className="text-lg font-bold mb-6" style={{ color: "#FFFCF2" }}>Inputs</h2>

              <div className="flex flex-col gap-5">
                {/* Vial size */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#C0A088" }}>
                    Vial Size (mg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={vialMg}
                    onChange={(e) => setVialMg(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-1"
                    style={{
                      backgroundColor: "#000101",
                      color: "#FFFCF2",
                      border: "1px solid #186784",
                    }}
                    placeholder="e.g. 5"
                  />
                </div>

                {/* BAC water */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#C0A088" }}>
                    Bacteriostatic Water Added (mL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={bacWaterMl}
                    onChange={(e) => setBacWaterMl(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-1"
                    style={{
                      backgroundColor: "#000101",
                      color: "#FFFCF2",
                      border: "1px solid #186784",
                    }}
                    placeholder="e.g. 2"
                  />
                </div>

                {/* Desired dose */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#C0A088" }}>
                    Desired Dose (mcg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={doseMcg}
                    onChange={(e) => setDoseMcg(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-1"
                    style={{
                      backgroundColor: "#000101",
                      color: "#FFFCF2",
                      border: "1px solid #186784",
                    }}
                    placeholder="e.g. 250"
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div
              className="rounded-xl p-6 mb-8"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784" }}
            >
              <h2 className="text-lg font-bold mb-6" style={{ color: "#FFFCF2" }}>Results</h2>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Concentration", value: concentration > 0 ? `${concentration.toFixed(0)} mcg/mL` : "—" },
                  { label: "Draw Volume", value: drawVolumeMl > 0 ? `${drawVolumeMl.toFixed(3)} mL` : "—" },
                  { label: "Syringe Units (U-100)", value: drawVolumeUnits > 0 ? `${drawVolumeUnits.toFixed(1)} units` : "—", highlight: true },
                  { label: "Doses Per Vial", value: dosesPerVial > 0 ? `${dosesPerVial} doses` : "—" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: "#000101" }}
                  >
                    <div
                      className="text-xl font-bold mb-1"
                      style={{ color: r.highlight ? "#186784" : "#FFFCF2" }}
                    >
                      {r.value}
                    </div>
                    <div className="text-xs" style={{ color: "#9A7C65" }}>{r.label}</div>
                  </div>
                ))}
              </div>

              {drawVolumeUnits > 0 && (
                <div
                  className="mt-6 p-4 rounded-lg text-sm"
                  style={{ backgroundColor: "#000101", border: "1px solid #186784" }}
                >
                  <p style={{ color: "#C0A088" }}>
                    <span className="font-semibold" style={{ color: "#FFFCF2" }}>Summary: </span>
                    Draw <span style={{ color: "#186784" }}>{drawVolumeUnits.toFixed(1)} units</span> on a U-100 insulin syringe to deliver{" "}
                    <span style={{ color: "#186784" }}>{doseMcgNum} mcg</span>. This reconstitution gives you{" "}
                    <span style={{ color: "#186784" }}>{dosesPerVial} doses</span> per vial.
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-5 text-sm"
              style={{ backgroundColor: "#0C2E3D", border: "1px solid #9A7C65" }}
            >
              <p className="font-semibold mb-2" style={{ color: "#9A7C65" }}>⚠ Research Use Only</p>
              <p style={{ color: "#9A7C65" }}>
                This calculator is for informational and research purposes only. Always verify calculations
                independently. Peptide reconstitution and administration should only be performed by
                qualified researchers following applicable regulations. This is not medical advice.
              </p>
            </div>

          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
