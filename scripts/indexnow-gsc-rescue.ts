// HCU 2026-04-24 GSC rescue resubmit.
//
// 앞서 제출한 KILLED sample (random 2,500 non-keep) 이후에 keep-set에 GSC
// evidence 4개 URL을 union 으로 추가했음. 그 4개가 어쩌다 random sample 에
// 섞였을 가능성 (~8%) 있어서 KEPT 신호로 덮어씀. 같은 slug 의 forward +
// reverse 양쪽 다 제출 (Google 은 별개 URL 로 봄).

const HOST = 'propertytaxpeek.com';
const KEY = 'fcde58c0f1de4143aca0ba3877d679dd';

const gscEvidence = [
  'allegheny-county-pa-vs-washington-county-pa',
  'montgomery-county-al-vs-harris-county-tx',
  'lake-county-il-vs-sumter-county-fl',
  'st-louis-city-mo-vs-st-louis-county-mo',
];

const urls: string[] = [];
for (const slug of gscEvidence) {
  urls.push(`https://${HOST}/county-compare/${slug}/`);
  const m = slug.match(/^(.+)-vs-(.+)$/);
  if (m) urls.push(`https://${HOST}/county-compare/${m[2]}-vs-${m[1]}/`);
}

(async () => {
  console.log(`[GSC-RESCUE] submitting ${urls.length} URLs as KEPT...`);
  urls.forEach((u) => console.log(`  ${u}`));
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  console.log(`status ${res.status} ${await res.text()}`);
})();
