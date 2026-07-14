import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorCard from "@/components/blood-tests/VendorCard";
import ProtocolBuilder from "@/components/blood-tests/ProtocolBuilder";
import { supabase, dbLabVendorToLabVendor, type DbLabVendor } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Blood Test Comparison for Peptide Researchers | Watchtower",
  description: "Find the right blood testing service for your peptide protocol. Compare 13 vendors on IGF-1, hormone panels, liver enzymes, and the biomarkers that actually matter.",
  alternates: { canonical: "/blood-tests" },
};

export const revalidate = 0;

export default async function BloodTestsPage() {
  const { data, error } = await supabase
    .from("lab_vendors")
    .select("*")
    .neq("eligibility", "EXCLUDE")
    .order("audience_fit_score", { ascending: false, nullsFirst: false });

  if (error) console.error("lab_vendors query error:", error.message);
  const vendors = (data ?? []).map((v) => dbLabVendorToLabVendor(v as DbLabVendor));

  // Entry price prefers the cheapest bundled panel from vendor_test_products (verified
  // current pricing, kept in sync whenever a vendor is migrated to the products model)
  // over vendor_tiers.is_entry_tier, which is only updated at initial research time and
  // goes stale the moment a vendor's real pricing changes (e.g. SiPhox/Everlywell drifted
  // from their vendor_tiers rows during the 2026-07 products-model migration pass) or
  // points at something that isn't actually a purchasable test (e.g. InsideTracker's
  // "Membership" tier is platform access, not a blood test). lab_vendors.entry_price_cents
  // is the last-resort fallback for vendors with neither.
  const { data: panelProducts } = await supabase
    .from("vendor_test_products")
    .select("vendor_id, price_cents")
    .eq("product_type", "panel")
    .order("price_cents");
  const entryPanelPriceByVendorId = new Map<string, number>();
  for (const p of panelProducts ?? []) {
    if (!entryPanelPriceByVendorId.has(p.vendor_id)) entryPanelPriceByVendorId.set(p.vendor_id, p.price_cents);
  }

  const { data: entryTiers } = await supabase
    .from("vendor_tiers")
    .select("vendor_id, price_cents")
    .eq("is_entry_tier", true);
  const entryTierPriceByVendorId = new Map((entryTiers ?? []).map((t) => [t.vendor_id, t.price_cents]));

  const entryPriceByVendorId = new Map<string, number | null>();
  for (const v of vendors) {
    entryPriceByVendorId.set(
      v.id,
      entryPanelPriceByVendorId.get(v.id) ?? entryTierPriceByVendorId.get(v.id) ?? v.entryPriceCents
    );
  }

  const { data: peptideRows } = await supabase
    .from("peptides")
    .select("name, slug, category")
    .order("name");

  const membership = vendors.filter((v) => v.section === "membership");
  const panelPackage = vendors.filter((v) => v.section === "panel-package");
  const buildYourOwn = vendors.filter((v) => v.section === "build-your-own");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="relative" style={{ minHeight: "320px" }}>
          <Image
            src="/images/research-hero.png"
            alt="Blood Testing"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 100%)" }} />
          <div className="relative z-10 px-6 py-24 text-center">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#5BA4C4" }}>
                Blood Testing
              </p>
              <h1 className="text-5xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
                Know What to Monitor. Know Which Panel Covers It.
              </h1>
              <p className="text-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
                Built for peptide researchers. Every vendor scored against the biomarkers that actually matter for your protocol.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto pt-16">

            <div className="mb-16">
              <ProtocolBuilder
                peptides={peptideRows ?? []}
                entryTierPrices={Object.fromEntries(
                  [...entryPriceByVendorId].filter((entry): entry is [string, number] => entry[1] !== null)
                )}
              />
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#1D1D1F" }}>Membership Plans</h2>
              <p className="text-sm mb-6" style={{ color: "#6E6E73" }}>
                Annual or monthly subscriptions with recurring access to comprehensive panels.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {membership.map((v) => (
                  <VendorCard key={v.id} vendor={v} entryTierPriceCents={entryPriceByVendorId.get(v.id)} />
                ))}
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#1D1D1F" }}>One-Time Panel Packages</h2>
              <p className="text-sm mb-6" style={{ color: "#6E6E73" }}>
                Pay once, no subscription required. Order again when you need to retest.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {panelPackage.map((v) => (
                  <VendorCard key={v.id} vendor={v} entryTierPriceCents={entryPriceByVendorId.get(v.id)} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#1D1D1F" }}>Build Your Own Panel</h2>
              <p className="text-sm mb-6" style={{ color: "#6E6E73" }}>
                Order exactly the tests you need, à la carte. Best for researchers who know their markers.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {buildYourOwn.map((v) => (
                  <VendorCard key={v.id} vendor={v} entryTierPriceCents={entryPriceByVendorId.get(v.id)} />
                ))}
              </div>
            </div>

          </div>
        </section>
      </div>

      <Footer verseIndex={4} />
    </div>
  );
}
