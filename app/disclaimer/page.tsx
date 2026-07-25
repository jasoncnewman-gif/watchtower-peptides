import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Disclaimer — Watchtower Peptides",
  description: "Watchtower Peptides is an independent research and review platform. Read our disclaimer regarding research chemicals, vendor listings, and medical advice.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F5F7" }}>
      <Nav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: "#1D1D1F" }}>
          Disclaimer
        </h1>
        <p className="text-sm mb-10" style={{ color: "#6E6E73" }}>
          Last updated: June 2026
        </p>

        <div className="flex flex-col gap-8 text-base leading-relaxed" style={{ color: "#3D3D3F" }}>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Research Use Only
            </h2>
            <p>
              Watchtower Peptides is an independent research and review platform. Peptides referenced
              on this site are sold by third-party vendors as research chemicals intended strictly for
              laboratory and scientific research purposes. While some peptides have received FDA
              approval for specific medical uses, the products sold by the vendors listed here are not
              dispensed through licensed medical channels and are not intended for human consumption,
              self-administration, or treatment of any disease or condition.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              No Products Sold
            </h2>
            <p>
              Watchtower Peptides does not sell peptides or any pharmaceutical products. We are a
              review and information platform only. Vendor scores, rankings, and ratings reflect our
              independent analysis of publicly available data and do not constitute an endorsement of
              any vendor, product, or practice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Not Medical Advice
            </h2>
            <p>
              Nothing on this site constitutes medical advice, diagnosis, or treatment. All content
              is provided for informational and educational purposes only. Consult a licensed
              physician or qualified healthcare provider before making any health-related decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Affiliate Relationships &amp; Scoring Independence
            </h2>
            <p>
              Peptide vendor reviews on this site carry no affiliate relationships, referral fees, or
              vendor compensation of any kind — that analysis is funded entirely independently. Some
              blood-test vendors participate in a referral/affiliate program, disclosed directly on
              that vendor&rsquo;s page when applicable. In every case, affiliate participation has no
              bearing on a vendor&rsquo;s score, ranking, or placement — scoring works the same way
              whether or not a commission relationship exists.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Age Requirement
            </h2>
            <p>
              By using this site you confirm you are at least 18 years of age and agree to use any
              information provided for lawful research purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Accuracy of Information
            </h2>
            <p>
              Vendor scores, product listings, pricing, and COA availability are based on data
              collected through automated scraping and independent review. This information may not
              reflect real-time changes. We make no warranty, express or implied, regarding the
              accuracy, completeness, or timeliness of any information on this site.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
