"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SLIDES = [
  {
    headline: "The Independent\nPeptide Vendor\nReview Platform",
    sub: "Watchtower Peptides tracks, scores, and monitors peptide vendors so researchers can make informed decisions. No affiliate bias. No paid placements.",
    cta: { label: "Browse Vendors →", href: "/vendors" },
    ctaSecondary: { label: "How We Score", href: "/about" },
    gradient: "linear-gradient(135deg, #000101 0%, #0C2E3D 50%, #0a2035 100%)",
    accent: "#186784",
  },
  {
    headline: "Lab-Verified\nCOA Testing\nFor Every Vendor",
    sub: "We verify third-party Certificates of Analysis and independent lab results — HPLC, NMR, LC-MS — so you know exactly what purity you're getting.",
    cta: { label: "See Lab Results →", href: "/vendors" },
    ctaSecondary: { label: "Peptide Library", href: "/peptides" },
    gradient: "linear-gradient(135deg, #000101 0%, #0a1f2e 40%, #0C2E3D 100%)",
    accent: "#22c55e",
  },
  {
    headline: "Real-Time\nAlerts When\nVendors Fail",
    sub: "Get alerted when a vendor fails a test, changes ownership, receives fraud reports, or makes misleading health claims in their advertising.",
    cta: { label: "View Vendor Scores →", href: "/vendors" },
    ctaSecondary: { label: "Reconstitution Calculator", href: "/calculator" },
    gradient: "linear-gradient(135deg, #000101 0%, #1a0c0c 40%, #2D0C0C 100%)",
    accent: "#ef4444",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => {
    if (i === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(i);
      setFading(false);
    }, 400);
  };

  const slide = SLIDES[current];

  return (
    <section
      className="relative flex items-center justify-center min-h-screen px-6 pt-20"
      style={{ background: slide.gradient, transition: "background 0.6s ease" }}
    >
      {/* Decorative grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${slide.accent}18 1px, transparent 0)`,
          backgroundSize: "48px 48px",
          opacity: 0.4,
        }}
      />

      <div
        className="relative max-w-4xl mx-auto text-center"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full mb-8"
          style={{ backgroundColor: "#0C2E3D", border: `1px solid ${slide.accent}`, color: "#C0A088" }}
        >
          <span>⚑</span>
          <span>Independent. Unbiased. Verified.</span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 whitespace-pre-line"
          style={{ color: "#FFFCF2" }}
        >
          {slide.headline.split("\n").map((line, i, arr) =>
            i === 1 ? (
              <span key={i} style={{ color: slide.accent }}>
                {line}
                {i < arr.length - 1 ? "\n" : ""}
              </span>
            ) : (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? "\n" : ""}
              </span>
            )
          )}
        </h1>

        {/* Subtext */}
        <p
          className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#C0A088" }}
        >
          {slide.sub}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={slide.cta.href}
            className="font-semibold px-8 py-4 rounded-lg transition-opacity hover:opacity-90 text-lg"
            style={{ backgroundColor: slide.accent, color: "#FFFCF2" }}
          >
            {slide.cta.label}
          </Link>
          <Link
            href={slide.ctaSecondary.href}
            className="font-semibold px-8 py-4 rounded-lg transition-opacity hover:opacity-90 text-lg"
            style={{ backgroundColor: "#0C2E3D", color: "#FFFCF2", border: `1px solid ${slide.accent}` }}
          >
            {slide.ctaSecondary.label}
          </Link>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="rounded-full transition-all"
            style={{
              width: i === current ? "28px" : "10px",
              height: "10px",
              backgroundColor: i === current ? slide.accent : "#9A7C65",
            }}
          />
        ))}
      </div>
    </section>
  );
}
