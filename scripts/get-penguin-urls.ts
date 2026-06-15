import * as https from "https";

function fetchPage(url: string, depth = 0): Promise<string> {
  if (depth > 3) return Promise.reject(new Error("redirects"));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Encoding": "identity" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) { resolve(fetchPage(res.headers.location!, depth + 1)); return; }
      let b = ""; res.on("data", c => b += c); res.on("end", () => resolve(b));
    }).on("error", reject);
  });
}

async function main() {
  const html = await fetchPage("https://penguinpeptides.com/lab-results/");
  // Extract all Purity.png URLs, dedupe, drop resized variants
  const all = [...html.matchAll(/https?:[^"'<>\s\\]+Purity\.png/gi)].map(m => m[0]);
  const unique = [...new Set(all)].filter(u => !/-\d+x\d+\.png$/.test(u));
  console.log(JSON.stringify(unique, null, 2));
  console.log("Total:", unique.length);
}

main().catch(console.error);
