import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peptide Calculator Suite — Dosage, Order & Reconstitution",
  description: "Three tools in one: research-backed dose ranges, vial order calculator, and reconstitution guide with exact syringe markings. For research use only.",
  alternates: { canonical: "/calculator" },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
