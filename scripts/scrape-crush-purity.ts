import * as https from "https";
import { db } from "./lib/client.js";

function fetchText(url: string, depth = 0): Promise<string> {
  if (depth > 5) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Encoding": "identity",
      }
    }, res => {
      if ([301,302,307,308].includes(res.statusCode!)) {
        const loc = res.headers.location || "";
        const next = loc.startsWith("http") ? loc : new URL(loc, url).href;
        resolve(fetchText(next, depth + 1));
        return;
      }
      let body = "";
      res.on("data", (c: any) => body += c);
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

async function main() {
  const html = await fetchText("https://crushresearch.shop/testing");

  // Find the JSON data blob — Next.js embeds data in __NEXT_DATA__ or self.__next_f
  // Look for the array of products with purity data
  const jsonMatch = html.match(/self\.__next_f\.push\((\[.*?\])\)/gs);
  if (!jsonMatch) {
    console.log("No __next_f data found, trying __NEXT_DATA__");
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (nextDataMatch) console.log("Found __NEXT_DATA__, length:", nextDataMatch[1].length);
    return;
  }

  // Dump a chunk of page text around purity values to understand structure
  const text = html.replace(/\\n/g, " ").replace(/\\t/g, " ");

  // Find purity patterns with surrounding context
  const purityRe = /"purity":\s*"?([\d.]+)/g;
  const matches = [...text.matchAll(purityRe)];
  console.log(`Found ${matches.length} "purity": fields`);
  if (matches.length > 0) {
    console.log("Sample:", text.slice(matches[0].index! - 100, matches[0].index! + 200));
  }

  // Try peptide name + purity pattern
  const productRe = /"(?:name|product|peptide)":\s*"([^"]+)"[^}]*"purity":\s*"?([\d.]+)/g;
  const products = [...text.matchAll(productRe)];
  console.log(`\nProduct+purity pairs: ${products.length}`);
  products.slice(0, 5).forEach(m => console.log(`  ${m[1]}: ${m[2]}%`));

  // Dump 2000 chars around first purity value to see full structure
  const firstPurity = text.indexOf('"purity"');
  if (firstPurity >= 0) {
    console.log("\n--- Context around first purity field ---");
    console.log(text.slice(Math.max(0, firstPurity - 300), firstPurity + 500));
  }
}

main().catch(console.error);
