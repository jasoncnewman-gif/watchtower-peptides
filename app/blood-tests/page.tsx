import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorCard from "@/components/blood-tests/VendorCard";
import ProtocolBuilder from "@/components/blood-tests/ProtocolBuilder";
import { supabase, dbLabVendorToLabVendor, type DbLabVendor } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Blood Test Comparison for Peptide Researchers | Watchtower",
  description: "Find the right blood testing service for your peptide protocol. Compare 14 vendors on IGF-1, hormone panels, liver enzymes, and the biomarkers that actually matter.",
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

  // Entry-tier prices come from a cleaner source (the Pricing Deep Dive table) than
  // lab_vendors.entry_price_cents, which was regex-extracted from free-text notes and can
  // grab the wrong figure (e.g. a monthly membership fee quoted before the actual panel
  // price). Prefer these wherever a tier exists.
  const { data: entryTiers } = await supabase
    .from("vendor_tiers")
    .select("vendor_id, price_cents")
    .eq("is_entry_tier", true);
  const entryTierPriceByVendorId = new Map((entryTiers ?? []).map((t) => [t.vendor_id, t.price_cents]));

  const { data: peptideRows } = await supabase
    .from("peptides")
    .select("name, slug, category")
    .order("name");

  const membership = vendors.filter((v) => v.section === "membership");
  const panelPackage = vendors.filter((v) => v.section === "panel-package");
  const buildYourOwn = vendors.filter((v) => v.section === "build-your-own");
  const lifeforce = vendors.find((v) => v.section === "special");

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
                entryTierPrices={Object.fromEntries(entryTierPriceByVendorId)}
              />
            </div>

            {lifeforce && (
              <div
                className="rounded-2xl p-8 mb-16"
                style={{ backgroundColor: "#EAF4F8", borderLeft: "4px solid #186784" }}
              >
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#186784" }}>
                  Managed Protocol
                </p>
                <h2 className="text-2xl font-bold mb-3" style={{ color: "#1D1D1F" }}>
                  Want a physician managing your protocol and your bloodwork?
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#6E6E73" }}>
                  Lifeforce pairs physician-prescribed peptides (BPC-157, Ipamorelin, Semaglutide, and more) with quarterly
                  blood testing and health coaching in one membership. All-in cost: ~$2,400–$4,200/yr depending on protocol.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {["Peptides Prescribed", "At-Home Blood Draw", "Physician Oversight", "HSA/FSA Eligible"].map((badge) => (
                    <span
                      key={badge}
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "#FFFFFF", color: "#186784" }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <a
                  href={lifeforce.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold rounded-xl px-5 py-3 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#186784", color: "#FFFFFF" }}
                >
                  Learn more about Lifeforce ↗
                </a>
                <p className="text-xs mt-3" style={{ color: "#6E6E73" }}>
                  Affiliate link — Watchtower earns a referral fee if you sign up. This does not affect our editorial scores.
                </p>
              </div>
            )}

            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#1D1D1F" }}>Membership Plans</h2>
              <p className="text-sm mb-6" style={{ color: "#6E6E73" }}>
                Annual or monthly subscriptions with recurring access to comprehensive panels.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {membership.map((v) => (
                  <VendorCard key={v.id} vendor={v} entryTierPriceCents={entryTierPriceByVendorId.get(v.id)} />
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
                  <VendorCard key={v.id} vendor={v} entryTierPriceCents={entryTierPriceByVendorId.get(v.id)} />
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
                  <VendorCard key={v.id} vendor={v} entryTierPriceCents={entryTierPriceByVendorId.get(v.id)} />
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
