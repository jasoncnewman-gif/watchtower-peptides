import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { TRUST_TIER_LABEL, type Lab } from "@/lib/labs";
import { truncateDescription } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from("labs").select("name, bottom_line").eq("slug", slug).maybeSingle();

  if (!data) return { title: "Lab Not Found" };

  const title = `Is ${data.name} Legit? — Lab Verification`;
  const desc = truncateDescription(data.bottom_line);

  return {
    title,
    description: desc,
    alternates: { canonical: `/labs/${slug}` },
    openGraph: { title, description: desc },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

export async function generateStaticParams() {
  const { data } = await supabase.from("labs").select("slug");
  return (data ?? []).map((l) => ({ slug: l.slug }));
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: "#5BA4C4" }}>
        {heading}
      </h2>
      <p className="text-base leading-relaxed" style={{ color: "#1D1D1F" }}>{children}</p>
    </div>
  );
}

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data, error } = await supabase.from("labs").select("*").eq("slug", slug).maybeSingle();

  if (error) console.error("lab detail query error:", error.message);
  if (!data) notFound();

  const lab = data as Lab;
  const tier = TRUST_TIER_LABEL[lab.trust_tier];

  const { data: vendorTests } = await supabase
    .from("lab_tests")
    .select("vendor_id, vendors(name, slug)")
    .eq("lab_name", lab.name);

  const vendorsUsingLab = Array.from(
    new Map(
      (vendorTests ?? [])
        .map((t) => t.vendors as unknown as { name: string; slug: string } | null)
        .filter((v): v is { name: string; slug: string } => !!v)
        .map((v) => [v.slug, v])
    ).values()
  );

  const labJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: lab.name,
    url: lab.website,
    description: lab.what_it_is,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(labJsonLd) }} />
      <Nav />

      <div className="pt-20">
        <section className="px-6 py-16" style={{ backgroundColor: "#1D1D1F" }}>
          <div className="max-w-3xl mx-auto">
            <Link href="/labs" className="text-sm mb-4 inline-block" style={{ color: "#5BA4C4" }}>
              ← All labs
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold" style={{ color: "#FFFFFF" }}>{lab.name}</h1>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                style={{ backgroundColor: tier.bg, color: tier.text }}
              >
                {tier.label}
              </span>
            </div>
            <a
              href={lab.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {lab.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </section>

        <section className="px-6 py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-6 mb-10"
              style={{ backgroundColor: tier.bg }}
            >
              <p className="text-base leading-relaxed font-medium" style={{ color: "#1D1D1F" }}>
                {lab.bottom_line}
              </p>
            </div>

            <Section heading="What It Is">{lab.what_it_is}</Section>
            <Section heading="Accreditation">{lab.accreditation_summary}</Section>

            {(lab.founded_mismatch || lab.address_mismatch) && (
              <div className="mb-8 rounded-xl p-5" style={{ backgroundColor: "#FEF3C7" }}>
                <h2 className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: "#D97706" }}>
                  Discrepancies Found
                </h2>
                {lab.founded_mismatch && (
                  <p className="text-sm mb-2" style={{ color: "#1D1D1F" }}>
                    <strong>Age claim:</strong> markets as &quot;{lab.founded_claim}&quot;, but registered
                    {lab.founded_actual ? ` ${new Date(lab.founded_actual).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}` : " more recently than that"}.
                  </p>
                )}
                {lab.address_mismatch && (
                  <p className="text-sm" style={{ color: "#1D1D1F" }}>
                    <strong>Address:</strong> markets as &quot;{lab.claimed_location}&quot;, registered at {lab.registered_address}.
                  </p>
                )}
              </div>
            )}

            <Section heading="What We Verified">{lab.what_we_verified}</Section>
            <Section heading="What We Could Not Verify">{lab.what_we_could_not_verify}</Section>
            {lab.caveats && <Section heading="Caveats">{lab.caveats}</Section>}

            {lab.verification_portal_url && (
              <div className="mb-10 rounded-xl p-5" style={{ backgroundColor: "#F5F5F7" }}>
                <p className="text-sm" style={{ color: "#1D1D1F" }}>
                  <strong>Verify a COA from {lab.name} yourself:</strong>{" "}
                  <a
                    href={lab.verification_portal_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    style={{ color: "#5BA4C4" }}
                  >
                    {lab.verification_portal_url.replace(/^https?:\/\//, "")}
                  </a>
                  {lab.portal_verified ? " — tested directly by Watchtower and confirmed working." : " — not personally tested this cycle."}
                </p>
              </div>
            )}

            {vendorsUsingLab.length > 0 && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: "#5BA4C4" }}>
                  Vendors On Watchtower Using {lab.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vendorsUsingLab.map((v) => (
                    <Link
                      key={v.slug}
                      href={`/vendors/${v.slug}`}
                      className="text-sm px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: "#F5F5F7", color: "#1D1D1F" }}
                    >
                      {v.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs mt-12" style={{ color: "#9A9AA0" }}>
              Last reviewed {new Date(lab.last_reviewed).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} by Watchtower Peptides.
            </p>
          </div>
        </section>
      </div>

      <Footer verseIndex={7} />
    </div>
  );
}
