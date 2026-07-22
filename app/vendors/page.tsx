import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorListClient from "@/components/vendors/VendorListClient";
import { supabase, dbVendorToVendor, type DbVendor } from "@/lib/supabase";

const title = "Peptide Vendor Reviews & Rankings — Independent Lab-Verified Scores";
const description = "Independent scores for 50+ peptide vendors — ranked by lab testing, purity, transparency, and price. See which suppliers pass third-party COA verification and which to avoid.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/vendors" },
  openGraph: { title, description, images: [{ url: "/images/vendor-directory.png" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/images/vendor-directory.png"] },
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

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description,
    numberOfItems: vendors.length,
    itemListElement: vendors.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.name,
      url: `https://www.watchtowerpeptides.com/vendors/${v.slug}`,
    })),
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
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
