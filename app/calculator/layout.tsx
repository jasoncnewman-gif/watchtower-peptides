import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reconstitution Calculator",
  description: "Calculate exact injection volumes for any peptide vial. Enter your vial size, BAC water amount, and desired dose — get syringe markings for U-100 insulin syringes.",
  alternates: { canonical: "/calculator" },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
