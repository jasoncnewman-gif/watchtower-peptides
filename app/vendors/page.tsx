import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorListClient from "@/components/vendors/VendorListClient";
import { supabase, dbVendorToVendor, type DbVendor } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Peptide Vendor Reviews",
  description: "Independent scores for every major peptide supplier — ranked by lab testing, purity accuracy, transparency, and community reputation. Updated regularly.",
  alternates: { canonical: "/vendors" },
};

export default async function VendorsPage() {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, slug, website, overall_score, status, location, has_coa, verified_domain, verdict, last_reviewed, lab_testing_score, purity_accuracy_score, transparency_score, community_reputation_score, pricing_reliability_score, notes")
    .eq("status", "active")
    .order("overall_score", { ascending: false, nullsFirst: false });

  if (error) console.error("vendors query error:", error.message);
  const vendors = (data ?? []).map((v) => dbVendorToVendor(v as DbVendor));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-20 text-center" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#186784" }}>
              Supplier Reviews
            </p>
            <h1 className="text-5xl font-bold mb-4" style={{ color: "#1D1D1F" }}>Vendor Directory</h1>
            <p className="text-xl" style={{ color: "#6E6E73" }}>
              Every vendor independently scored on lab testing, transparency, and reliability. Scores are out of 100.
            </p>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto">
            <VendorListClient vendors={vendors} />
          </div>
        </section>
      </div>

      <Footer verseIndex={2} />
    </div>
  );
}
