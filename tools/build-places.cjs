// Builds data/places.json: county names, US cities (5,000+ people) and ZIP3 prefixes,
// each resolved to a county FIPS code, so the list and search work without map geometry.
// Source: GeoNames (CC BY 4.0). Download cities5000.zip and the US postal zip, unzip, then:
//   node tools/build-places.cjs <cities5000.txt> <US.txt>
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const d3 = require(path.join(root, "vendor/d3.min.js"));
const topojson = require(path.join(root, "vendor/topojson-client.min.js"));
const [citiesFile, zipFile] = process.argv.slice(2);
if (!citiesFile || !zipFile) { console.error("usage: build-places.cjs <cities5000.txt> <US.txt>"); process.exit(1); }

const topo = JSON.parse(fs.readFileSync(path.join(root, "data/counties-10m.json")));
const { states, countyRegion } = JSON.parse(fs.readFileSync(path.join(root, "data/regions.json")));
const features = topojson.feature(topo, topo.objects.counties).features.filter(f => states[f.id.slice(0, 2)]);
const bounds = new Map(features.map(f => [f, d3.geoBounds(f)]));
const known = new Set(features.map(f => f.id));
const fipsOf = Object.fromEntries(Object.entries(states).map(([id, [abbr]]) => [abbr, id]));
const regionOf = id => countyRegion[id] || states[id.slice(0, 2)][2];

function countyAt(lon, lat) {
  for (const f of features) {
    const b = bounds.get(f);
    if (b[0][0] <= b[1][0] && (lon < b[0][0] || lon > b[1][0])) continue;
    if (lat < b[0][1] || lat > b[1][1]) continue;
    if (d3.geoContains(f, [lon, lat])) return f.id;
  }
  return null;
}
// Prefer the geometry the app itself uses, fall back to the source FIPS for points
// the simplified coastline misses.
function resolve(lon, lat, abbr, county3, tally) {
  const st = fipsOf[abbr];
  if (!st) return (tally.other++, null);
  let id = countyAt(lon, lat);
  if (id && id.slice(0, 2) !== st) id = null;
  if (id) return (tally.geo++, id);
  const fb = st + String(county3 || "").padStart(3, "0");
  if (known.has(fb)) return (tally.fips++, fb);
  return (tally.lost++, null);
}

const cTally = { geo: 0, fips: 0, lost: 0, other: 0 };
const cities = [];
for (const line of fs.readFileSync(citiesFile, "utf8").split("\n")) {
  const c = line.split("\t");
  if (c[8] !== "US") continue;
  const id = resolve(+c[5], +c[4], c[10], c[11], cTally);
  if (id) cities.push([c[1], id, +c[14] || 0]);
}
cities.sort((a, b) => b[2] - a[2]);

const zTally = { geo: 0, fips: 0, lost: 0, other: 0 };
const zipRows = [];
for (const line of fs.readFileSync(zipFile, "utf8").split("\n")) {
  const c = line.split("\t");
  if (c[0] !== "US" || !c[1]) continue;
  const id = resolve(+c[10], +c[9], c[4], c[6], zTally);
  if (id) zipRows.push([c[1], id]);
}
const byPrefix = {};
for (const [zip, id] of zipRows) ((byPrefix[zip.slice(0, 3)] ||= {})[id] = (byPrefix[zip.slice(0, 3)][id] || 0) + 1);
const zip3 = {};
for (const [p, tally] of Object.entries(byPrefix)) zip3[p] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
const zipOk = zipRows.filter(([zip, id]) => regionOf(zip3[zip.slice(0, 3)]) === regionOf(id)).length;

const counties = Object.fromEntries(features.map(f => [f.id, f.properties.name]));
fs.writeFileSync(path.join(root, "data/places.json"), JSON.stringify({ counties, cities, zip3 }));
console.log({ counties: features.length, cities: cities.length, cTally, zip3: Object.keys(zip3).length, zTally,
  zip3RegionAccuracy: (100 * zipOk / zipRows.length).toFixed(1) + "%",
  bytes: fs.statSync(path.join(root, "data/places.json")).size });
