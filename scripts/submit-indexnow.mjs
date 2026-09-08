import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = "megatools-tau.vercel.app";
const KEY = "1e7e8c110e4fbbaa65afbd80547ae803";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// Read tool hrefs from tool-data.ts
const toolDataPath = path.resolve(__dirname, "../src/lib/tool-data.ts");
const toolDataContent = fs.readFileSync(toolDataPath, "utf-8");
const hrefMatches = [...toolDataContent.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);

const staticPages = ["", "/about", "/changelog", "/privacy", "/terms"];
const allPaths = Array.from(new Set([...staticPages, ...hrefMatches]));
const urlList = allPaths.map((p) => `https://${HOST}${p}`);

console.log(`[IndexNow] Submitting ${urlList.length} URLs for host: ${HOST}...`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

async function submitIndexNow() {
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    console.log(`[IndexNow] Response status: ${res.status} ${res.statusText}`);
    if (res.ok || res.status === 200 || res.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urlList.length} URLs to IndexNow (Bing, Yandex, etc.)!`);
    } else {
      const body = await res.text();
      console.error(`[IndexNow] Submission returned warning/error:`, body);
    }
  } catch (err) {
    console.error("[IndexNow] Failed to submit to IndexNow:", err);
  }
}

submitIndexNow();
