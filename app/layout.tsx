import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Watchtower Peptides — Independent Vendor Review",
    template: "%s | Watchtower Peptides",
  },
  description: "Independent research platform tracking, scoring, and monitoring peptide vendors. No affiliate bias. No paid placements.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://watchtowerpeptides.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.className} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
