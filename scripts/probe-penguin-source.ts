import * as https from "https";

function fetchUrl(url: string, depth = 0): Promise<string> {
  if (depth > 3) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36", "Accept-Encoding": "identity" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) {
        const loc = res.headers.location ?? "";
        const next = loc.startsWith("http") ? loc : `https://penguinpeptides.com${loc}`;
        resolve(fetchUrl(next, depth + 1));
        return;
      }
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

async function main() {
  const html = await fetchUrl("https://penguinpeptides.com/lab-results/");

  // Look for any PDF, image, or COA-related URLs
  const pdfs = [...html.matchAll(/https?:[^\s"'<>]+\.pdf/gi)].map(m => m[0]);
  const coaImgs = [...html.matchAll(/https?:[^\s"'<>]*(coa|lab.result|certificate)[^\s"'<>]*(webp|jpg|jpeg|png|pdf)/gi)].map(m => m[0]);
  const wpUploads = [...html.matchAll(/https?:[^\s"'<>]*wp-content\/uploads[^\s"'<>]*(webp|jpg|jpeg|png|pdf)/gi)].map(m => m[0]);
  
  console.log("PDFs found:", pdfs.slice(0, 20));
  console.log("COA imgs:", coaImgs.slice(0, 20));
  console.log("WP uploads:", [...new Set(wpUploads)].slice(0, 30));

  // Look for data attributes that might hold COA info
  const dataAttrs = [...html.matchAll(/data-[a-z-]+=["']([^"']*(?:coa|pdf|lab)[^"']*)/gi)].map(m => m[0]);
  console.log("COA data attrs:", dataAttrs.slice(0, 10));

  // Look for any JS variables that might hold COA URLs
  const jsVars = [...html.matchAll(/(coa|certificate|lab.result)[^\n]{0,200}/gi)].map(m => m[0].trim().slice(0, 120));
  console.log("JS COA references:", jsVars.slice(0, 10));
  
  // Check total page size
  console.log("Page size:", html.length, "chars");
}

main().catch(console.error);
