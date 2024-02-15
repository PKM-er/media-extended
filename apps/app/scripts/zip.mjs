import { createReadStream, createWriteStream, readFileSync } from "fs";
import JSZip from "jszip";
import { join } from "path";
import { pipeline } from "stream/promises";
const assets = ["main.js", "styles.css", "manifest.json"];
const zip = new JSZip();
for (const filename of assets) {
  zip.file(filename, createReadStream(join("dist", filename)));
}
const version = JSON.parse(readFileSync(join("manifest.json"), "utf-8")).version;
const out = join("dist", `mx-${version}.zip`)
await pipeline(
  zip.generateNodeStream({ type: "nodebuffer", streamFiles: true }),
  createWriteStream(out),
);
console.log(out + " written.");
