import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db } from "./lib/client.js";

puppeteerExtra.use(StealthPlugin());

const VENDOR_SLUG = "peptide-crafters";
const COOKIE_VALUE =
  "info%40watchtowerpeptides.com%7C1782433494%7Cq9AauDyV8w91rLK3XFG3aXsUcEfQfrl0YSRc4X2JImd%7Cff263e702e3c9ddae11a8790a1894db05a133191db1db5ada716c3105a7f35e1";

async function main() {
  const { data: vendor } = await db.from("vendors").select("id").eq("slug", VENDOR_SLUG).single();
  const vendorId = vendor!.id;

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1400, height: 900 });
  await page.setCookie({
    name: "wordpress_logged_in_43148c1828ee2b5cc0d20048a1d82d3a",
    value: COOKIE_VALUE,
    domain: "peptidecrafters.com",
    path: "/",
    httpOnly: true,
    secure: true,
  });

  console.log("Loading lab-test-reports...");
  await page.goto("https://peptidecrafters.com/lab-test-reports/", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 3000));

  // Extract all elements that contain BATCH + PURITY data
  const records = await page.evaluate(() => {
    const results: { name: string; batch: string; date: string | null; purity: number }[] = [];
    const seen = new Set<string>();

    // Grab all elements, filter to those with batch/purity content
    const all = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    for (const el of all) {
      // Only leaf-ish nodes (innerText length < 1500 to avoid outer wrappers)
      if (el.children.length > 8) continue;
      const text = el.innerText ?? "";
      if (!text.includes("BATCH") || !text.includes("PURITY")) continue;
      if (text.length > 1500 || text.length < 40) continue;

      const normalized = text.replace(/\s+/g, " ").trim();
      // Must contain a PC- batch ID
      const batchMatch = normalized.match(/BATCH\s+(PC-[A-Z0-9-]+)/);
      if (!batchMatch) continue;
      const batch = batchMatch[1];
      if (seen.has(batch)) continue;

      // Purity: skip blends marked as "-"
      const purityMatch = normalized.match(/PURITY\s+([\d.]+)\s*%/);
      if (!purityMatch) continue;
      const purity = parseFloat(purityMatch[1]);
      if (isNaN(purity) || purity < 85) continue;

      // Date
      const dateMatch = normalized.match(/DATE\s+(\d{2}\/\d{2}\/\d{4})/);

      // Product name: everything before "BATCH"
      const nameMatch = normalized.match(/^(.+?)\s+BATCH\s/);
      if (!nameMatch) continue;

      seen.add(batch);
      results.push({
        name: nameMatch[1].trim(),
        batch,
        date: dateMatch?.[1] ?? null,
        purity,
      });
    }
    return results;
  });

  await browser.close();

  console.log(`\nParsed ${records.length} records from DOM`);
  records.forEach((r) =>
    console.log(`  ${r.name} | ${r.batch} | ${r.date ?? "no date"} | ${r.purity}%`)
  );

  if (records.length === 0) {
    console.error("No records found — aborting");
    process.exit(1);
  }

  // Strip size suffixes from product names: "BPC-157 (10mg)" → "BPC-157"
  const inserts = records.map((r) => ({
    vendor_id: vendorId,
    peptide_name: r.name.replace(/\s*\([\d.]+\s*mg\).*$/i, "").trim(),
    lab_name: "Vanguard Laboratory",
    purity_result: r.purity,
    batch_number: r.batch,
    test_date: r.date ? new Date(r.date).toISOString().split("T")[0] : null,
    test_source: "peptide-crafters-lab-reports",
    verified: true,
  }));

  // Clear old rows then insert fresh
  await db.from("lab_tests").delete().eq("vendor_id", vendorId).eq("test_source", "peptide-crafters-lab-reports");

  for (let i = 0; i < inserts.length; i += 50) {
    const { error } = await db.from("lab_tests").insert(inserts.slice(i, i + 50));
    if (error) {
      console.error("Insert error:", error.message);
      process.exit(1);
    }
  }

  const purities = inserts.map((r) => r.purity_result);
  const avg = purities.reduce((a, b) => a + b, 0) / purities.length;
  const min = Math.min(...purities);
  const max = Math.max(...purities);
  console.log(`\nInserted ${inserts.length} rows. Avg: ${avg.toFixed(2)}%, Min: ${min}%, Max: ${max}%`);

  // Update vendor_transparency
  const { error: trErr } = await db
    .from("vendor_transparency")
    .update({
      has_lab_disclosure: true,
      has_batch_numbers: true,
      has_testing_methodology: true,
    })
    .eq("vendor_id", vendorId);
  if (trErr) console.error("Transparency update error:", trErr.message);
  else console.log("Updated vendor_transparency flags");
}

main().catch(console.error);
