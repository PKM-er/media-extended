import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version,
  manifestPath = "../manifest.json",
  versionsPath = "../versions.json";

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync(versionsPath, "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync(versionsPath, JSON.stringify(versions, null, "\t"));
