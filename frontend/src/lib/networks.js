import deployment from "../contracts/PackageRegistry.json";

export function hexChainId(chainId) {
  return `0x${Number(chainId).toString(16)}`;
}

export function rpcUrlForDeployment() {
  if (deployment.rpcUrl) return deployment.rpcUrl;
  if (Number(deployment.chainId) === 31337) return "http://127.0.0.1:8545";
  return "http://127.0.0.1:7545";
}

export function networkLabel(chainId) {
  const id = Number(chainId);
  if (id === 31337) return `Hardhat (${id})`;
  if (id === 1337 || id === 5777) return `Ganache (${id})`;
  return `Chain ${id}`;
}
