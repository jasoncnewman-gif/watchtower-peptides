import * as https from "https";

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
        resolve(fetchText(loc.startsWith("http") ? loc : new URL(loc, url).href, depth + 1));
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

  // Find all purity-like numbers (95-100.99) and dump surrounding context
  const re = /(\d{2,3}\.\d{1,2})%/g;
  const matches = [...html.matchAll(re)].filter(m => {
    const v = parseFloat(m[1]);
    return v >= 85 && v <= 100.5;
  });

  console.log(`Found ${matches.length} purity-like values`);

  // Show context around first few
  for (const m of matches.slice(0, 3)) {
    const start = Math.max(0, m.index! - 200);
    const end = Math.min(html.length, m.index! + 200);
    console.log(`\n--- ${m[1]}% ---`);
    console.log(html.slice(start, end));
  }
}

main().catch(console.error);
