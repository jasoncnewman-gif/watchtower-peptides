"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const SLIDES = [
  {
    eyebrow: "Independent Vendor Intelligence",
    headline: "Independent scoring. Transparent methodology. Zero conflicts.",
    sub: "Watchtower Peptides tracks, scores, and monitors peptide vendors so researchers can make informed decisions.",
    cta: { label: "Browse Vendors", href: "/vendors" },
    ctaSecondary: { label: "How We Score", href: "/about" },
    image: "/images/slide-1.png",
    imageAlt: "Athletic performance",
  },
  {
    eyebrow: "No Bias. No Kickbacks.",
    headline: "No affiliates. No kickbacks. No compromises.",
    sub: "Every score is based entirely on publicly verifiable data — third-party COAs, independent lab results, and verified community reviews.",
    cta: { label: "See Vendor Scores", href: "/vendors" },
    ctaSecondary: { label: "Peptide Library", href: "/peptides" },
    image: "/images/slide-2.png",
    imageAlt: "Strength and conditioning training",
  },
  {
    eyebrow: "Ongoing Monitoring",
    headline: "We monitor vendors so you don't have to.",
    sub: "Get alerted when a vendor fails a test, changes ownership, receives fraud reports, or makes misleading health claims in their advertising.",
    cta: { label: "View Vendor Directory", href: "/vendors" },
    ctaSecondary: { label: "Reconstitution Calculator", href: "/calculator" },
    image: "/images/slide-3.png",
    imageAlt: "Recovery and resilience",
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
    }, 5500);
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
      className="relative flex items-center min-h-screen overflow-hidden"
      style={{ backgroundColor: "#111111" }}
    >
      {/* Background image layers — crossfade between slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current && !fading ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt={s.imageAlt}
            fill
            priority={i === 0}
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
      ))}

      {/* Left-to-right gradient overlay — keeps text readable over any photo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.88) 28%, rgba(0,0,0,0.52) 58%, rgba(0,0,0,0.12) 100%)",
        }}
      />

      {/* Subtle bottom fade for dots */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }}
      />

      {/* Content — left-aligned, Withings style */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 pt-24 pb-28">
        <div
          className="max-w-xl"
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? "translateY(10px)" : "translateY(0)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {/* Eyebrow */}
          <p
            className="text-sm font-semibold tracking-widest uppercase mb-5"
            style={{ color: "#186784" }}
          >
            {slide.eyebrow}
          </p>

          {/* Headline */}
          <h1
            className="font-bold tracking-tight leading-tight mb-6"
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            }}
          >
            {slide.headline}
          </h1>

          {/* Sub */}
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "rgba(255,255,255,0.72)", maxWidth: "460px" }}
          >
            {slide.sub}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={slide.cta.href}
              className="font-semibold px-7 py-3.5 rounded-full transition-opacity hover:opacity-80 text-sm text-center"
              style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}
            >
              {slide.cta.label} →
            </Link>
            <Link
              href={slide.ctaSecondary.href}
              className="font-semibold px-7 py-3.5 rounded-full transition-opacity hover:opacity-80 text-sm text-center"
              style={{
                backgroundColor: "transparent",
                color: "#FFFFFF",
                border: "1.5px solid rgba(255,255,255,0.45)",
              }}
            >
              {slide.ctaSecondary.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="rounded-full transition-all"
            style={{
              width: i === current ? "24px" : "8px",
              height: "8px",
              backgroundColor:
                i === current ? "#FFFFFF" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
