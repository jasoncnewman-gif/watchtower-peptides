import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { TRUST_TIER_LABEL, type Lab } from "@/lib/labs";

const title = "Is Your Peptide's Testing Lab Legit? — COA Lab Verification";
const description = "Independent verification of the third-party labs that test peptide COAs — accreditation status, corporate registration, and public batch-verification portals checked directly, not taken from a vendor's word.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/labs" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

export const revalidate = 0;

export default async function LabsPage() {
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .order("trust_tier", { ascending: true })
    .order("name", { ascending: true });

  if (error) console.error("labs query error:", error.message);
  const labs = (data ?? []) as Lab[];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description,
    numberOfItems: labs.length,
    itemListElement: labs.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: l.name,
      url: `https://www.watchtowerpeptides.com/labs/${l.slug}`,
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
        <section className="px-6 py-20 text-center" style={{ backgroundColor: "#1D1D1F" }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#5BA4C4" }}>
              Lab Verification
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
              Is the lab on your COA legit?
            </h1>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.75)" }}>
              A COA is only as trustworthy as the lab behind it. We independently check accreditation
              registries, corporate filings, and public verification portals — not the lab&apos;s own
              marketing copy.
            </p>
          </div>
        </section>

        <section className="px-6 py-16" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-5xl mx-auto">
            {labs.length === 0 ? (
              <p style={{ color: "#6E6E73" }}>No labs published yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {labs.map((lab) => {
                  const tier = TRUST_TIER_LABEL[lab.trust_tier];
                  return (
                    <Link
                      key={lab.slug}
                      href={`/labs/${lab.slug}`}
                      className="block rounded-2xl p-6 transition-shadow hover:shadow-md"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="font-semibold text-lg" style={{ color: "#1D1D1F" }}>{lab.name}</h2>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3"
                          style={{ backgroundColor: tier.bg, color: tier.text }}
                        >
                          {tier.label}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "#6E6E73" }}>
                        {lab.bottom_line}
                      </p>
                      <p className="text-xs mt-4" style={{ color: "#9A9AA0" }}>
                        Last reviewed {new Date(lab.last_reviewed).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer verseIndex={6} />
    </div>
  );
}
