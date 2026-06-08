import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — Watchtower Peptides",
  description: "Terms of service for Watchtower Peptides. Read our terms governing use of this independent research and review platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F5F7" }}>
      <Nav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: "#1D1D1F" }}>
          Terms of Service
        </h1>
        <p className="text-sm mb-10" style={{ color: "#6E6E73" }}>
          Last updated: June 2026
        </p>

        <div className="flex flex-col gap-8 text-base leading-relaxed" style={{ color: "#3D3D3F" }}>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Acceptance of Terms
            </h2>
            <p>
              By accessing or using Watchtower Peptides ("the Site"), you agree to be bound by
              these Terms of Service. If you do not agree, do not use the Site. We reserve the
              right to update these terms at any time. Continued use of the Site after changes
              constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Use of the Site
            </h2>
            <p className="mb-3">
              Watchtower Peptides is an independent research and review platform. You may use
              the Site for lawful, informational, and research purposes only. You agree not to:
            </p>
            <ul className="flex flex-col gap-2 pl-5 list-disc">
              <li>Use the Site for any unlawful purpose or in violation of any applicable laws or regulations</li>
              <li>Reproduce, distribute, or commercially exploit any content from the Site without written permission</li>
              <li>Attempt to interfere with or disrupt the Site's infrastructure, servers, or networks</li>
              <li>Scrape, crawl, or extract data from the Site in a manner that places unreasonable load on our systems</li>
              <li>Use the Site's content to make investment, medical, or legal decisions without independent professional advice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Informational Purpose Only
            </h2>
            <p>
              All content on this Site — including vendor scores, rankings, ratings, peptide
              profiles, and pricing data — is provided for informational and research purposes
              only. It does not constitute medical advice, legal advice, financial advice, or
              an endorsement of any vendor or product. We make no representations or warranties
              regarding the accuracy, completeness, or timeliness of any information on the Site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              No Vendor Relationships
            </h2>
            <p>
              Watchtower Peptides has no affiliate relationships, sponsorships, or financial
              arrangements with any vendor listed on the Site. Vendor scores and rankings are
              determined independently based on publicly available data. We do not accept payment
              in exchange for scores, rankings, or placement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Intellectual Property
            </h2>
            <p>
              All original content on this Site, including scoring methodology, written analysis,
              and design, is the property of Watchtower Peptides and is protected by applicable
              copyright laws. Vendor names, product names, and third-party data remain the
              property of their respective owners. Limited non-commercial use with attribution
              is permitted; commercial reproduction requires written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Third-Party Links and Content
            </h2>
            <p>
              The Site may contain links to third-party websites, including vendor sites and
              lab testing platforms. These links are provided for convenience only. We have no
              control over third-party content and assume no responsibility for it. Linking to
              a vendor does not constitute an endorsement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Disclaimer of Warranties
            </h2>
            <p>
              The Site is provided "as is" without warranties of any kind, express or implied,
              including but not limited to warranties of merchantability, fitness for a particular
              purpose, or non-infringement. We do not warrant that the Site will be uninterrupted,
              error-free, or free of viruses or other harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Watchtower Peptides shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising
              from your use of, or inability to use, the Site or its content — including any
              decisions made in reliance on vendor scores, rankings, or ratings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Governing Law
            </h2>
            <p>
              These Terms of Service are governed by the laws of the United States. Any disputes
              arising from use of the Site shall be subject to the exclusive jurisdiction of the
              courts of the United States.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Contact
            </h2>
            <p>
              Questions about these terms?{" "}
              <a
                href="mailto:info@watchtowerpeptides.com"
                className="underline hover:opacity-70 transition-opacity"
                style={{ color: "#186784" }}
              >
                info@watchtowerpeptides.com
              </a>
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
