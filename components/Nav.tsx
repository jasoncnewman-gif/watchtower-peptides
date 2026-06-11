"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vendors", label: "Vendor Reviews" },
  { href: "/peptides", label: "Peptide Library" },
  { href: "/calculator", label: "Tools" },
  { href: "/about", label: "Methodology" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop — closes menu on tap outside */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6"
        style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E5E7" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" onClick={() => setOpen(false)}>
            <Image
              src="/images/logo-nav.png"
              alt="Watchtower Peptides"
              width={260}
              height={52}
              priority
            />
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
            className="lg:hidden flex flex-col justify-center gap-1.5 w-10 h-10 -mr-2"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span
              className="block w-5 h-0.5 mx-auto transition-all duration-200"
              style={{
                backgroundColor: "#1D1D1F",
                transform: open ? "translateY(6px) rotate(45deg)" : undefined,
              }}
            />
            <span
              className="block w-5 h-0.5 mx-auto transition-all duration-200"
              style={{ backgroundColor: "#1D1D1F", opacity: open ? 0 : 1 }}
            />
            <span
              className="block w-5 h-0.5 mx-auto transition-all duration-200"
              style={{
                backgroundColor: "#1D1D1F",
                transform: open ? "translateY(-6px) rotate(-45deg)" : undefined,
              }}
            />
          </button>
        </div>

        {/* Mobile menu — smooth slide */}
        <div
          className="lg:hidden overflow-hidden transition-all duration-200"
          style={{ maxHeight: open ? "300px" : "0px" }}
        >
          <div className="flex flex-col gap-1 pb-4" style={{ borderTop: "1px solid #E5E5E7", paddingTop: "0.75rem" }}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  color: pathname === l.href ? "#1D1D1F" : "#6E6E73",
                  fontWeight: pathname === l.href ? 600 : 400,
                  backgroundColor: pathname === l.href ? "#F5F5F7" : "transparent",
                }}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
