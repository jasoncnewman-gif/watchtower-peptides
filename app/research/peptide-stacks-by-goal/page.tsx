import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const title = "Peptide Stacks by Goal — Muscle, Longevity, Recovery, Sleep & More";
const description =
  "The peptide (or stack) most associated with each common goal — muscle, longevity, skin, injury recovery, weight loss, fat loss, endurance, mental clarity, sleep — grounded in real mechanism data, not marketing.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/research/peptide-stacks-by-goal" },
  openGraph: { title, description, images: [{ url: "/images/research-hero.png" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/images/research-hero.png"] },
};

type Peptide = { name: string; slug: string };
type Goal = {
  label: string;
  color: string;
  peptides: Peptide[];
  addOns?: Peptide[];
  isStack: boolean;
  why: string;
  note?: string;
};

const GOALS: Goal[] = [
  {
    label: "Building Muscle",
    color: "#7B4F9E",
    peptides: [{ name: "CJC-1295", slug: "cjc-1295" }, { name: "Ipamorelin", slug: "ipamorelin" }],
    addOns: [{ name: "IGF-1 LR3", slug: "igf-1-lr3" }],
    isStack: true,
    why: "The most widely used GH secretagogue stack — CJC-1295 extends GH release duration while Ipamorelin adds a clean pulse without cortisol or prolactin elevation.",
    note: "Some protocols add IGF-1 LR3 directly for hypertrophy signaling — a stronger, less-studied addition on top of the base stack.",
  },
  {
    label: "Longevity",
    color: "#1A6B5C",
    peptides: [
      { name: "Epithalon", slug: "epithalon" },
      { name: "Humanin", slug: "humanin" },
      { name: "MOTS-c", slug: "mots-c" },
    ],
    isStack: true,
    why: "Three distinct longevity mechanisms, not three peptides doing the same thing: Epithalon (telomere/circadian), Humanin (mitochondrial/neuroprotective), MOTS-c (metabolic/exercise capacity).",
  },
  {
    label: "Skin & Hair",
    color: "#B8860B",
    peptides: [{ name: "GHK-Cu", slug: "ghk-cu" }],
    addOns: [{ name: "GLOW Blend", slug: "glow-blend" }],
    isStack: false,
    why: "Not really a stack question — GHK-Cu is the peptide for this. Copper-peptide complex with decades of collagen/wound-healing data, though almost none of it is from injectable human trials.",
    note: "Want tissue repair alongside it? GLOW Blend (GHK-Cu + TB-500 + BPC-157) is the real, documented combo vendors sell for skin + recovery together.",
  },
  {
    label: "Injury Recovery",
    color: "#186784",
    peptides: [{ name: "BPC-157", slug: "bpc-157" }, { name: "TB-500", slug: "tb-500" }],
    isStack: true,
    why: "The foundational healing stack, and the one with the clearest complementary logic on this site: BPC-157 for local tissue repair, TB-500 for systemic anti-inflammatory and cell-migration effects.",
  },
  {
    label: "Weight Loss",
    color: "#D35400",
    peptides: [{ name: "Tirzepatide", slug: "tirzepatide" }],
    addOns: [{ name: "Retatrutide", slug: "retatrutide" }],
    isStack: false,
    why: "Not a stack — GLP-1/GIP agonists aren't combined with each other. Tirzepatide has the strongest trial data of any compound sold by peptide vendors: up to 22% body weight reduction, FDA-approved as Mounjaro/Zepbound.",
    note: "Retatrutide (triple incretin agonist) shows ~24% in Phase II data and may overtake it — but it's still investigational, one phase behind.",
  },
  {
    label: "Fat Loss / Cutting",
    color: "#C0392B",
    peptides: [{ name: "Tesamorelin", slug: "tesamorelin" }, { name: "AOD-9604", slug: "aod-9604" }],
    isStack: true,
    why: "Different target than weight loss — this is visceral-fat-specific, not total body weight. Tesamorelin has actual FDA Phase 3 data for it; AOD-9604 is a lower-evidence GH fragment aimed at fat metabolism without systemic GH effects.",
  },
  {
    label: "Athletic Endurance",
    color: "#2980B9",
    peptides: [{ name: "MOTS-c", slug: "mots-c" }],
    isStack: false,
    why: "MOTS-c is the one peptide on this site whose own research is specifically framed around exercise capacity and metabolic homeostasis, not general GH elevation.",
  },
  {
    label: "Mental Clarity",
    color: "#5C4B9C",
    peptides: [{ name: "Semax", slug: "semax" }, { name: "Selank", slug: "selank" }],
    isStack: true,
    why: "A common nootropic pairing: Semax for cognitive enhancement (studied clinically in Russia, including stroke recovery), Selank for anxiolytic effects — focus plus reduced anxiety rather than stimulation.",
  },
  {
    label: "Sleep",
    color: "#34495E",
    peptides: [{ name: "DSIP", slug: "dsip" }],
    addOns: [{ name: "Pinealon", slug: "pinealon" }],
    isStack: false,
    why: "DSIP — Delta Sleep-Inducing Peptide — is named for exactly this. The evidence base is thin and mostly old, but it's the one compound on this site whose entire research history is about sleep specifically.",
    note: "Pinealon is the other sleep-adjacent option — its research leans toward increasing REM percentage rather than sleep induction itself.",
  },
];

export default function PeptideStacksByGoalPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", color: "#1D1D1F" }}>
      <Nav />

      <div className="pt-20">
        <section className="relative" style={{ minHeight: "320px" }}>
          <Image
            src="/images/research-hero.png"
            alt="Peptide Stacks by Goal"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 100%)" }} />
          <div className="relative z-10 px-6 py-24 text-center">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#5BA4C4" }}>
                Research
              </p>
              <h1 className="text-5xl font-bold mb-4" style={{ color: "#FFFFFF" }}>
                Peptide Stacks by Goal
              </h1>
              <p className="text-xl max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
                What people actually ask: what should I take for muscle, longevity, sleep, recovery? Here's what our
                own data says for each — including the two goals where "stack" is the wrong framing.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-14" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-base leading-relaxed" style={{ color: "#6E6E73" }}>
              These aren't clinically proven "best" combinations — no controlled trial has tested most peptide
              stacks against each other, let alone against a placebo. What follows is the most mechanistically
              coherent and most commonly used option per goal, drawn directly from the compound profiles and blend
              data already on this site. Where stacking two peptides doesn't actually add anything — weight loss,
              endurance, sleep — we say so instead of inventing a combo.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
            {GOALS.map((goal) => (
              <div
                key={goal.label}
                className="rounded-2xl p-6 flex flex-col"
                style={{ backgroundColor: "#FFFFFF", borderTop: `4px solid ${goal.color}` }}
              >
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: goal.color }}
                >
                  {goal.label}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {goal.peptides.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/peptides/${p.slug}`}
                      className="text-sm font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                      style={{ backgroundColor: `${goal.color}1A`, color: goal.color }}
                    >
                      {p.name}
                    </Link>
                  ))}
                  {!goal.isStack && (
                    <span
                      className="text-xs px-2 py-1.5 rounded-full self-center"
                      style={{ color: "#9A9AA0" }}
                    >
                      not a stack
                    </span>
                  )}
                </div>

                {goal.addOns && (
                  <div className="flex flex-wrap items-center gap-2 mb-4 -mt-2">
                    <span className="text-xs" style={{ color: "#9A9AA0" }}>optional:</span>
                    {goal.addOns.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/peptides/${p.slug}`}
                        className="text-xs font-medium px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                        style={{ backgroundColor: "#F5F5F7", color: "#6E6E73", border: "1px solid #E5E5E7" }}
                      >
                        {p.name}
                      </Link>
                    ))}
                  </div>
                )}

                <p className="text-sm leading-relaxed mb-3" style={{ color: "#3A3A3F" }}>
                  {goal.why}
                </p>

                {goal.note && (
                  <p className="text-sm leading-relaxed mt-auto pt-3" style={{ color: "#9A9AA0", borderTop: "1px solid #EEEEF0" }}>
                    {goal.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-12 text-center">
            <p className="text-sm" style={{ color: "#9A9AA0" }}>
              Every peptide above links to its full research profile — mechanism, dosage, safety, and evidence
              grade. For deeper reads on specific compounds, see the{" "}
              <Link href="/research" className="underline" style={{ color: "#5BA4C4" }}>
                full research library
              </Link>
              .
            </p>
          </div>
        </section>
      </div>

      <Footer verseIndex={7} />
    </div>
  );
}
