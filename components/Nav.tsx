"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/vendors", label: "Supplier Reviews" },
  { href: "/peptides", label: "Peptide Library" },
  { href: "/calculator", label: "Calculator" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E5E7" }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span style={{ color: "#186784" }} className="text-xl">⚑</span>
          <span className="font-semibold text-base tracking-tight" style={{ color: "#1D1D1F" }}>
            Watchtower Peptides
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-8 text-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:opacity-80"
              style={{
                color: pathname === l.href ? "#1D1D1F" : "#6E6E73",
                fontWeight: pathname === l.href ? 600 : 400,
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-0.5 transition-all"
            style={{
              backgroundColor: "#1D1D1F",
              transform: open ? "rotate(45deg) translate(4px, 4px)" : undefined,
            }}
          />
          <span
            className="block w-5 h-0.5 transition-all"
            style={{ backgroundColor: "#1D1D1F", opacity: open ? 0 : 1 }}
          />
          <span
            className="block w-5 h-0.5 transition-all"
            style={{
              backgroundColor: "#1D1D1F",
              transform: open ? "rotate(-45deg) translate(4px, -4px)" : undefined,
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="lg:hidden mt-4 pb-4 flex flex-col gap-4 text-sm"
          style={{ borderTop: "1px solid #E5E5E7", paddingTop: "1rem" }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-2"
              style={{ color: pathname === l.href ? "#1D1D1F" : "#6E6E73", fontWeight: pathname === l.href ? 600 : 400 }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
