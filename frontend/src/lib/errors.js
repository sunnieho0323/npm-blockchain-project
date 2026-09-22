const KNOWN = [
  "Not authorized",
  "Not owner",
  "Package version already registered",
  "Package version not registered",
  "Package name required",
  "Version required",
  "Package hash required",
  "Source required",
  "Zero address",
  "Already authorized",
  "Cannot revoke owner",
];

export function parseRevert(error) {
  const text = [
    error?.reason,
    error?.revert?.args?.[0],
    error?.shortMessage,
    error?.info?.error?.message,
    error?.message,
  ]
    .filter(Boolean)
    .join(" | ");

  for (const needle of KNOWN) {
    if (text.includes(needle)) return needle;
  }

  if (!text) return "Transaction failed";
  if (text.includes("could not detect network") || text.includes("ECONNREFUSED")) {
    return "Cannot reach the local Hardhat node. Start it with: npx hardhat node";
  }
  return error?.shortMessage || error?.message || "Transaction failed";
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatTimestamp(value) {
  const seconds = Number(value);
  if (!seconds) return "—";
  return new Date(seconds * 1000).toUTCString();
}
