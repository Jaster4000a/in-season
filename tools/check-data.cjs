// Fails when season data and icons disagree. Run before committing data changes:
//   node tools/check-data.cjs
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const { items, sources: dateSources = {} } = JSON.parse(fs.readFileSync(path.join(root, "data/items.json")));
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
      if (w.length !== 4 || w.slice(0, 2).some(m => !Number.isInteger(m) || m < 1 || m > 12) || w.slice(2).some(m => !Number.isInteger(m) || m < 0 || m > 12) || (w[2] === 0) !== (w[3] === 0)) { bad.push(`${it.id}/${k}: bad window ${w}`); continue; }
      const [s, e, ps, pe] = w;
      if (ps && s !== e && ps === pe && pe === e) bad.push(`${it.id}/${k}: best month is also the final month, so it can never show as peak`);
      if (ps && (!inR(ps, s, e) || !inR(pe, s, e))) bad.push(`${it.id}/${k}: peak ${ps}-${pe} outside season ${s}-${e}`);
    }
  }
}
for (const it of items) for (const [reg, c] of Object.entries(it.checked || {})) {
  if (!dateSources[c.src]) bad.push(`${it.id}/${reg}: unknown date source "${c.src}"`);
  const band = regions.find(r => r.id === reg)?.band;
  if (!band) bad.push(`${it.id}: checked for unknown region "${reg}"`);
  else if (!it.w[reg] && !it.w[band]) bad.push(`${it.id}/${reg}: checked, but has no season window`);
}
const { foods, sources } = JSON.parse(fs.readFileSync(path.join(root, "data/choose.json")));
let unsourced = 0;
for (const it of items) {
  const g = foods[it.id];
  if (!g || !g.tips || !g.tips.length) { bad.push(`${it.id}: no picking guidance`); continue; }
  if (!g.src) unsourced++;
  for (const x of [g, ...(g.also || [])]) if (x.src && !sources[x.src]) bad.push(`${it.id}: unknown source ${x.src}`);
  if (g.src === "purdue" && !g.page) bad.push(`${it.id}: Purdue source needs a page`);
}
for (const k of Object.keys(foods)) if (!ids.has(k)) bad.push(`${k}: guidance for an unknown item`);
console.log(`guidance: ${Object.keys(foods).length} foods, ${unsourced} not yet checked against a source`);
const swText = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const { versionFor } = require("./stamp-sw.cjs");
if (!swText.includes(`const VERSION = "${versionFor(swText)}";`)) bad.push("sw.js: VERSION is stale, run node tools/stamp-sw.cjs before deploying");
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`ok: ${items.length} items, ${regions.length} regions, every item has an icon`);
