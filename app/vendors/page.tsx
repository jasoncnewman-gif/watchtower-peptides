import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorListClient from "@/components/vendors/VendorListClient";
import { supabase, dbVendorToVendor, type DbVendor } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Peptide Vendor Reviews",
  description: "Independent scores for every major peptide supplier — ranked by lab testing, purity accuracy, transparency, and community reputation. Updated regularly.",
  alternates: { canonical: "/vendors" },
};

export const revalidate = 0

export default async function VendorsPage() {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, slug, website, overall_score, status, location, has_coa, verified_domain, verdict, last_reviewed, lab_testing_score, purity_accuracy_score, transparency_score, pricing_reliability_score, notes")
    .eq("status", "active")
    .order("overall_score", { ascending: false, nullsFirst: false });

  if (error) console.error("vendors query error:", error.message);
  const vendors = (data ?? []).map((v) => dbVendorToVendor(v as DbVendor));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="relative" style={{ minHeight: "320px" }}>
          <Image
            src="/images/vendor-directory.png"
            alt="Vendor Directory"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 100%)" }} />
          <div className="relative z-10 px-6 py-24 text-center">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#5BA4C4" }}>
                Vendor Reviews
              </p>
              <h1 className="text-5xl font-bold mb-4" style={{ color: "#FFFFFF" }}>Vendor Directory</h1>
              <p className="text-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
                Every vendor in our database is independently scored across four criteria. No vendor pays to be listed. No vendor pays to be ranked higher.
              </p>
            </div>
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
