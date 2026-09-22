const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const PackageRegistry = await hre.ethers.getContractFactory("PackageRegistry");
  const registry = await PackageRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const artifact = await hre.artifacts.readArtifact("PackageRegistry");
  const network = await hre.ethers.provider.getNetwork();

  const rpcUrl = hre.network.config.url || "http://127.0.0.1:8545";
  const payload = {
    address,
    chainId: Number(network.chainId),
    rpcUrl,
    network: hre.network.name,
    abi: artifact.abi,
  };

  const outDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "PackageRegistry.json"),
    JSON.stringify(payload, null, 2)
  );

  console.log("PackageRegistry deployed to:", address);
  console.log("Network:", hre.network.name, "chainId:", Number(network.chainId));
  console.log("RPC:", rpcUrl);
  console.log("Wrote frontend/src/contracts/PackageRegistry.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
