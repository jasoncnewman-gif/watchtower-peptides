import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Watchtower Peptides — Independent Vendor Review",
  description: "Independent research platform tracking, scoring, and monitoring peptide vendors. No affiliate bias. No paid placements.",
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
