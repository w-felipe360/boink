// Sets boink's version everywhere it's recorded, so a release only needs one command:
//
//   npm run set-version -- patch        0.1.0 -> 0.1.1
//   npm run set-version -- minor        0.1.0 -> 0.2.0
//   npm run set-version -- 1.0.0
//
// package.json is the source of truth (tauri.conf.json and the UI read it); Cargo.toml
// and the lockfiles are kept in step so nothing disagrees. Prints the new version.

import { readFileSync, writeFileSync } from "node:fs";

const arg = process.argv[2];
if (!arg) {
  console.error("usage: set-version <patch|minor|major|x.y.z>");
  process.exit(1);
}

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const write = (path, text) => writeFileSync(new URL(`../${path}`, import.meta.url), text);

const pkg = JSON.parse(read("package.json"));
const [major, minor, patch] = pkg.version.split(".").map(Number);
const next =
  arg === "major" ? `${major + 1}.0.0`
  : arg === "minor" ? `${major}.${minor + 1}.0`
  : arg === "patch" ? `${major}.${minor}.${patch + 1}`
  : arg;

if (!/^\d+\.\d+\.\d+$/.test(next)) {
  console.error(`not a version: ${next}`);
  process.exit(1);
}

pkg.version = next;
write("package.json", JSON.stringify(pkg, null, 2) + "\n");

const lock = JSON.parse(read("package-lock.json"));
lock.version = next;
lock.packages[""].version = next;
write("package-lock.json", JSON.stringify(lock, null, 2) + "\n");

// Only the [package] version, which is the first `version =` line in the file.
write("src-tauri/Cargo.toml", read("src-tauri/Cargo.toml").replace(/^version = ".*"$/m, `version = "${next}"`));
write(
  "src-tauri/Cargo.lock",
  read("src-tauri/Cargo.lock").replace(/(name = "boink"\r?\nversion = )".*"/, `$1"${next}"`)
);

console.log(next);
