// HCU 2026-04-24 IndexNow cleanup submission for propertytaxpeek.
// Mirrors the tariffpeek/ingredipeek pattern: reassert the keep-set +
// nudge Google on a sample of killed URLs so the 410 signal propagates
// faster than organic recrawl would achieve. GSC has ~34k discovered
// /county-compare/ URLs + ~2,780 /es/county/ URLs queued — we sample
// the tail so the crawl queue shifts toward keeping /county/* fresh.

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'taxes.db');
const HOST = 'propertytaxpeek.com';
// IndexNow key exposed at https://propertytaxpeek.com/fcde58c0f1de4143aca0ba3877d679dd.txt
const KEY = 'fcde58c0f1de4143aca0ba3877d679dd';

const countyCompareKeep: string[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'lib', 'generated', 'county-compare-keep.json'), 'utf8'),
);

const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
const countyCompareKeepSet = new Set(countyCompareKeep);

// Sample of killed /county-compare/ slugs: 2,000 random slugs NOT in keep-set
// (middleware 410s these). Plus ~500 random /es/county/ slugs to signal 410
// on the entire Spanish tree.
const killedCountyCompares = db.prepare(
  `SELECT slug FROM county_comparisons WHERE slug NOT IN (SELECT value FROM json_each(?)) ORDER BY RANDOM() LIMIT 2000`
).all(JSON.stringify(countyCompareKeep)) as { slug: string }[];

const killedEsCounties = db.prepare(
  `SELECT slug FROM counties ORDER BY RANDOM() LIMIT 500`
).all() as { slug: string }[];

// All 2,780 /county/* pages are the traffic-earning surface — reassert them.
const allCounties = db.prepare(
  `SELECT slug FROM counties`
).all() as { slug: string }[];

db.close();

const keptUrls = [
  `https://${HOST}/`,
  `https://${HOST}/es/`,
  `https://${HOST}/sitemap.xml`,
  ...allCounties.map((c) => `https://${HOST}/county/${c.slug}/`),
  // Only canonical compare direction for sitemap parity
  ...countyCompareKeep
    .filter((s) => {
      const m = s.match(/^(.+)-vs-(.+)$/);
      return m && m[1] < m[2];
    })
    .map((s) => `https://${HOST}/county-compare/${s}/`),
];

const killedUrls = [
  ...killedCountyCompares.map((p) => `https://${HOST}/county-compare/${p.slug}/`),
  ...killedEsCounties.map((c) => `https://${HOST}/es/county/${c.slug}/`),
];

async function submit(label: string, urls: string[]) {
  console.log(`[${label}] submitting ${urls.length} URLs...`);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls.slice(0, 10000),
    }),
  });
  const body = await res.text();
  console.log(`[${label}] status ${res.status} ${body ? `body="${body.slice(0, 200)}"` : ''}`);
}

(async () => {
  console.log(`kept=${keptUrls.length} killed=${killedUrls.length}`);
  // Cap kept at 3,000 so we don't exceed 10k per batch (2,780 counties +
  // 100 canonical compares + 3 static = ~2,883; well within budget).
  await submit('KEPT', keptUrls);
  await submit('KILLED', killedUrls);
})();
