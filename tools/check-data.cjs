// Fails when season data and icons disagree. Run before committing data changes:
//   node tools/check-data.cjs
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const { items } = JSON.parse(fs.readFileSync(path.join(root, "data/items.json")));
const { regions } = JSON.parse(fs.readFileSync(path.join(root, "data/regions.json")));
const sprite = fs.readFileSync(path.join(root, "data/icons.svg"), "utf8");
const keys = new Set(regions.flatMap(r => [r.id, r.band]));
const inR = (m, a, b) => (a <= b ? m >= a && m <= b : m >= a || m <= b);
const bad = [];
const ids = new Set();
for (const it of items) {
  if (ids.has(it.id)) bad.push(`${it.id}: duplicate id`);
  ids.add(it.id);
  if (!sprite.includes(`<symbol id="${it.id}"`)) bad.push(`${it.id}: no icon in data/icons.svg`);
  for (const [k, ws] of Object.entries(it.w)) {
    if (!keys.has(k)) bad.push(`${it.id}: unknown region or band "${k}"`);
    for (const w of ws) {
      if (w.length !== 4 || w.some(m => !Number.isInteger(m) || m < 1 || m > 12)) { bad.push(`${it.id}/${k}: bad window ${w}`); continue; }
      const [s, e, ps, pe] = w;
      if (!inR(ps, s, e) || !inR(pe, s, e)) bad.push(`${it.id}/${k}: peak ${ps}-${pe} outside season ${s}-${e}`);
    }
  }
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`ok: ${items.length} items, ${regions.length} regions, every item has an icon`);
