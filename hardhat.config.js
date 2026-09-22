require("@nomicfoundation/hardhat-toolbox");

const ganacheKey = process.env.GANACHE_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Ganache GUI default RPC. If deploy says chainId mismatch, copy Chain ID
    // from Ganache settings (often 1337 or 5777) into chainId below.
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: ganacheKey ? [ganacheKey] : undefined,
    },
  },
};
