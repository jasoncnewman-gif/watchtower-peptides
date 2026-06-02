/**
 * scripts/run-all.ts
 * Master script — runs all data collection scripts in the correct order.
 *
 * Order:
 *   1. seed-vendors        — insert/upsert all 44 vendors
 *   2. scrape-finnrick     — fetch Finnrick ratings
 *   3. scrape-peptide-critic — fetch Peptide Critic ratings + reviews
 *   4. scrape-vendor-products — fetch product catalogs → vendor_peptides
 *   5. scrape-vendor-coas  — fetch COA pages → lab_tests + has_coa flag
 *
 * Each stage runs to completion (or failure) before the next begins.
 * A stage failure is logged but does not abort subsequent stages.
 *
 * Run: npm run scrape:all
 */

import { log, sleep } from "./lib/scraper.js";

const SCRIPT = "run-all";

type StageResult = { stage: string; ok: boolean; durationMs: number };

async function runStage(name: string, modulePath: string): Promise<StageResult> {
  log(SCRIPT, `\n${"─".repeat(50)}`);
  log(SCRIPT, `Starting: ${name}`);
  const start = Date.now();

  try {
    await import(modulePath);
    // Dynamic import executes the module's top-level main() call.
    // Give the module a moment to fully complete its async work.
    await sleep(500);
    const durationMs = Date.now() - start;
    log(SCRIPT, `Completed: ${name} (${(durationMs / 1000).toFixed(1)}s)`);
    return { stage: name, ok: true, durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    log(SCRIPT, `FAILED: ${name} — ${(err as Error).message}`);
    return { stage: name, ok: false, durationMs };
  }
}

async function main() {
  log(SCRIPT, "Watchtower Peptides — full data collection run");
  const totalStart = Date.now();

  const stages = [
    { name: "1. seed-vendors",          path: "./seed-vendors.js" },
    { name: "2. scrape-finnrick",        path: "./scrape-finnrick.js" },
    { name: "3. scrape-peptide-critic",  path: "./scrape-peptide-critic.js" },
    { name: "4. scrape-vendor-products", path: "./scrape-vendor-products.js" },
    { name: "5. scrape-vendor-coas",     path: "./scrape-vendor-coas.js" },
  ];

  const results: StageResult[] = [];
  for (const stage of stages) {
    const result = await runStage(stage.name, stage.path);
    results.push(result);
  }

  const totalMs = Date.now() - totalStart;
  const passed  = results.filter((r) => r.ok).length;
  const failed  = results.filter((r) => !r.ok).length;

  log(SCRIPT, `\n${"═".repeat(50)}`);
  log(SCRIPT, `Run complete: ${passed} passed, ${failed} failed  (${(totalMs / 1000).toFixed(0)}s total)`);
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    log(SCRIPT, `  ${icon} ${r.stage} (${(r.durationMs / 1000).toFixed(1)}s)`);
  }

  if (failed > 0) process.exit(1);
}

main();
