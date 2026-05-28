"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SLIDES = [
  {
    headline: "Independent scoring. Transparent methodology. Zero conflicts.",
    sub: "Watchtower Peptides tracks, scores, and monitors peptide vendors so researchers can make informed decisions. No affiliate bias. No paid placements.",
    cta: { label: "Browse Vendors →", href: "/vendors" },
    ctaSecondary: { label: "How We Score", href: "/about" },
  },
  {
    headline: "No affiliates. No kickbacks. No compromises.",
    sub: "Every score is based entirely on publicly verifiable data — third-party COAs, independent lab results, and verified community reviews.",
    cta: { label: "See Vendor Scores →", href: "/vendors" },
    ctaSecondary: { label: "Peptide Library", href: "/peptides" },
  },
  {
    headline: "We monitor vendors so you don't have to.",
    sub: "Get alerted when a vendor fails a test, changes ownership, receives fraud reports, or makes misleading health claims in their advertising.",
    cta: { label: "View Vendor Directory →", href: "/vendors" },
    ctaSecondary: { label: "Reconstitution Calculator", href: "/calculator" },
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
      style={{ background: "linear-gradient(160deg, #000101 0%, #0C2E3D 55%, #000101 100%)" }}
    >
      {/* Subtle dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #18678422 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        className="relative max-w-4xl mx-auto text-center px-4"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full mb-8"
          style={{ backgroundColor: "#0C2E3D", border: "1px solid #186784", color: "#FFFCF2" }}
        >
          <span>⚑</span>
          <span>Independent. Unbiased. Verified.</span>
        </div>

        {/* Headline — no forced line breaks */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
          style={{ color: "#FFFCF2" }}
        >
          {slide.headline}
        </h1>

        {/* Subtext */}
        <p
          className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#FFFCF2" }}
        >
          {slide.sub}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={slide.cta.href}
            className="font-semibold px-8 py-4 rounded-lg transition-opacity hover:opacity-90 text-lg"
            style={{ backgroundColor: "#186784", color: "#FFFCF2" }}
          >
            {slide.cta.label}
          </Link>
          <Link
            href={slide.ctaSecondary.href}
            className="font-semibold px-8 py-4 rounded-lg transition-opacity hover:opacity-90 text-lg"
            style={{ backgroundColor: "#0C2E3D", color: "#FFFCF2", border: "1px solid #186784" }}
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
              backgroundColor: i === current ? "#186784" : "#9A7C65",
            }}
          />
        ))}
      </div>
    </section>
  );
}
