import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const siteName = "Watchtower Peptides";
const defaultTitle = "Watchtower Peptides — Peptide Vendor Scores & Research";
const defaultDescription = "Independently scored peptide vendor reviews based on lab testing, purity records, and verifiable data. No affiliates. No paid placements.";

export const metadata: Metadata = {
  title: {
    default: defaultTitle,
    template: "%s | Watchtower Peptides",
  },
  description: defaultDescription,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.watchtowerpeptides.com"),
  verification: {
    google: "PiLHIKIwBarL7HYrsOyZX7fJzVDEWPUirrVp3EyemEg",
  },
  openGraph: {
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    type: "website",
    images: [{ url: "/images/slide-1.png", width: 1672, height: 941 }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/images/slide-1.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: "https://www.watchtowerpeptides.com",
  logo: "https://www.watchtowerpeptides.com/images/logo-full.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.className} h-full`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
