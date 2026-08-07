import * as https from "https";

function fetchText(url: string, depth = 0): Promise<string> {
  if (depth > 5) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Encoding": "identity" } }, res => {
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
  // Find 200 chars around first averagePurity occurrence
  const idx = html.indexOf("averagePurity");
  if (idx < 0) { console.log("averagePurity not found"); return; }
  console.log("Raw around averagePurity:");
  console.log(JSON.stringify(html.slice(idx - 50, idx + 200)));
}

main().catch(console.error);
