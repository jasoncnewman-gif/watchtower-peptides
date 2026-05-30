"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SLIDES = [
  {
    eyebrow: "Independent Vendor Intelligence",
    headline: "Independent scoring. Transparent methodology. Zero conflicts.",
    sub: "Watchtower Peptides tracks, scores, and monitors peptide vendors so researchers can make informed decisions.",
    cta: { label: "Browse Vendors", href: "/vendors" },
    ctaSecondary: { label: "How We Score", href: "/about" },
  },
  {
    eyebrow: "No Bias. No Kickbacks.",
    headline: "No affiliates. No kickbacks. No compromises.",
    sub: "Every score is based entirely on publicly verifiable data — third-party COAs, independent lab results, and verified community reviews.",
    cta: { label: "See Vendor Scores", href: "/vendors" },
    ctaSecondary: { label: "Peptide Library", href: "/peptides" },
  },
  {
    eyebrow: "Ongoing Monitoring",
    headline: "We monitor vendors so you don't have to.",
    sub: "Get alerted when a vendor fails a test, changes ownership, receives fraud reports, or makes misleading health claims in their advertising.",
    cta: { label: "View Vendor Directory", href: "/vendors" },
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
      }, 350);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => {
    if (i === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(i);
      setFading(false);
    }, 350);
  };

  const slide = SLIDES[current];

  return (
    <section
      className="relative flex items-center justify-center min-h-screen px-6 pt-20"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div
        className="relative max-w-3xl mx-auto text-center"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Eyebrow */}
        <p
          className="text-sm font-semibold tracking-widest uppercase mb-6"
          style={{ color: "#186784" }}
        >
          {slide.eyebrow}
        </p>

        {/* Headline */}
        <h1
          className="font-bold tracking-tight leading-tight mb-6"
          style={{ color: "#1D1D1F", fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}
        >
          {slide.headline}
        </h1>

        {/* Sub */}
        <p
          className="text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#6E6E73" }}
        >
          {slide.sub}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={slide.cta.href}
            className="font-semibold px-8 py-3.5 rounded-full transition-opacity hover:opacity-80 text-base"
            style={{ backgroundColor: "#1D1D1F", color: "#FFFFFF" }}
          >
            {slide.cta.label} →
          </Link>
          <Link
            href={slide.ctaSecondary.href}
            className="font-semibold px-8 py-3.5 rounded-full transition-opacity hover:opacity-80 text-base"
            style={{ backgroundColor: "transparent", color: "#1D1D1F", border: "1.5px solid #1D1D1F" }}
          >
            {slide.ctaSecondary.label}
          </Link>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="rounded-full transition-all"
            style={{
              width: i === current ? "24px" : "8px",
              height: "8px",
              backgroundColor: i === current ? "#1D1D1F" : "#D1D1D6",
            }}
          />
        ))}
      </div>
    </section>
  );
}
