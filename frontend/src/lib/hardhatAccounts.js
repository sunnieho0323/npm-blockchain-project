// Well-known Hardhat local accounts. Safe only on a local node — never use on a public network.
export const HARDHAT_ACCOUNTS = [
  {
    label: "Account #0 (owner)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  {
    label: "Account #1 (unauthorized)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
];

export const RPC_URL =
  typeof window !== "undefined" && window.location?.port === "5173"
    ? `${window.location.origin}/hardhat-rpc`
    : "http://127.0.0.1:8545";
export const EXPECTED_CHAIN_ID = 31337;
