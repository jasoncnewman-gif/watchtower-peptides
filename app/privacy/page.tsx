import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Watchtower Peptides",
  description: "Watchtower Peptides privacy policy. We collect only anonymized analytics data and do not sell or share personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F5F7" }}>
      <Nav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="text-3xl font-semibold mb-2" style={{ color: "#1D1D1F" }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: "#6E6E73" }}>
          Last updated: June 2026
        </p>

        <div className="flex flex-col gap-8 text-base leading-relaxed" style={{ color: "#3D3D3F" }}>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              What We Collect
            </h2>
            <p>
              We collect anonymized usage data including pages visited, referral source, browser
              type, and approximate location derived from IP address. This data is processed by
              Vercel Analytics. We do not collect names, email addresses, account information, or
              any personally identifiable information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Cookies
            </h2>
            <p>
              This site does not use tracking cookies or advertising cookies. Vercel Analytics
              operates without cookies by default.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Third-Party Services
            </h2>
            <ul className="flex flex-col gap-3 mt-1">
              <li>
                <span className="font-medium" style={{ color: "#1D1D1F" }}>Vercel</span> — hosting
                and anonymized analytics. See{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70 transition-opacity"
                  style={{ color: "#186784" }}
                >
                  Vercel&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <span className="font-medium" style={{ color: "#1D1D1F" }}>Google Fonts</span> —
                typography files are loaded from Google&apos;s servers, which may log your IP
                address. See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-70 transition-opacity"
                  style={{ color: "#186784" }}
                >
                  Google&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <span className="font-medium" style={{ color: "#1D1D1F" }}>Supabase</span> —
                database infrastructure. No visitor data is stored in our database.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Data Sharing
            </h2>
            <p>
              We do not sell, trade, or share your data with any third party for marketing or
              advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Data Retention
            </h2>
            <p>
              Anonymized analytics data is retained per Vercel&apos;s standard retention policy.
              We do not store any visitor data independently.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "#1D1D1F" }}>
              Contact
            </h2>
            <p>
              Questions about this privacy policy?{" "}
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
