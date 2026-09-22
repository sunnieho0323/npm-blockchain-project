const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "package-data");
const FRONTEND = path.join(
  __dirname,
  "..",
  "frontend",
  "src",
  "packageDemo.json"
);

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function prepare(name) {
  const dir = path.join(ROOT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const packed = execSync(`npm pack ${name} --pack-destination "${dir}"`, {
    encoding: "utf8",
  }).trim();
  const tarballName = packed.split("\n").pop().trim();
  const originalPath = path.join(dir, tarballName);
  const originalHash = sha256File(originalPath);

  const version = tarballName
    .replace(new RegExp(`^${name}-`), "")
    .replace(/\.tgz$/, "");

  const tamperedPath = path.join(dir, tarballName.replace(/\.tgz$/, "-tampered.tgz"));
  const originalBytes = fs.readFileSync(originalPath);
  const extra = Buffer.from(
    `\n# TAMPER DEMO — extra bytes appended ${new Date().toISOString()}\n`
  );
  fs.writeFileSync(tamperedPath, Buffer.concat([originalBytes, extra]));
  const tamperedHash = sha256File(tamperedPath);

  fs.writeFileSync(
    path.join(dir, "README.txt"),
    [
      `${name}@${version}`,
      `Original tarball: ${tarballName}`,
      `Original SHA-256: ${originalHash}`,
      `Tampered SHA-256: ${tamperedHash}`,
      "",
      "Tampering method: append extra bytes to a copy of the npm tarball.",
      "Register the original hash, then Verify with the tampered hash to demo mismatch.",
    ].join("\n")
  );

  return {
    name,
    version,
    source: "npm",
    originalFile: tarballName,
    originalHash,
    tamperedFile: path.basename(tamperedPath),
    tamperedHash,
  };
}

function main() {
  fs.mkdirSync(ROOT, { recursive: true });
  const packages = ["express", "react"].map(prepare);
  const manifest = {
    generatedAt: new Date().toISOString(),
    hashAlgorithm: "SHA-256",
    packages,
  };
  fs.writeFileSync(path.join(ROOT, "manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(FRONTEND, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

main();
