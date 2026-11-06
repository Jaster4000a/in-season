// Writes a content hash of every file the service worker saves into its VERSION, so any change
// to the page or data reaches visitors as one complete update. Run before deploying:
//   node tools/stamp-sw.cjs
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, "..");
function versionFor(sw) {
  const list = [...sw.matchAll(/const (?:CORE|EXTRA) = \[(.*?)\];/gs)].flatMap(m => [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]));
  const h = crypto.createHash("sha256");
  h.update(sw.replace(/const VERSION = "[^"]*";/, ""));
  for (const f of list.filter(p => p !== "./").sort()) h.update(fs.readFileSync(path.join(root, f)));
  return "in-season-" + h.digest("hex").slice(0, 12);
}
module.exports = { versionFor };
if (require.main === module) {
  const p = path.join(root, "sw.js"), sw = fs.readFileSync(p, "utf8"), v = versionFor(sw);
  fs.writeFileSync(p, sw.replace(/const VERSION = "[^"]*";/, `const VERSION = "${v}";`));
  console.log(v);
}
