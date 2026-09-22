# NPM Package Provenance DApp

Prototype Ethereum DApp that records npm package name, version, SHA-256 hash, and source on a local blockchain so a later download can be checked against that record.

**GitHub (full source):** https://github.com/sunnieho0323/npm-blockchain-project

**OnTrack code slot:** upload `submission/PackageRegistry.txt` (Solidity source as `.txt`; OnTrack does not accept `.zip` / `.sol`).

## Requirements

- Node.js 18+
- Ganache (recommended for this unit) and MetaMask, **or** Hardhat node

## Setup

```bash
npm install
cd frontend && npm install
```

## Compile and test the contract

```bash
npx hardhat compile
npx hardhat test
```

## Recommended: Ganache + MetaMask

1. Start **Ganache**. Confirm RPC is `http://127.0.0.1:7545`. Note the **Chain ID** (often `1337`; some setups use `5777`). If it is not `1337`, set the same number in `hardhat.config.js` under `networks.ganache.chainId`.
2. In Ganache, open **Account 0**, copy its **private key**.
3. MetaMask → Import account → paste that private key. This account will be the contract **owner**.
4. MetaMask → Add network:
   - Network name: Ganache
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: same as Ganache
   - Currency: ETH
5. Deploy (replace the key with Account 0’s private key, keep `0x`):

```bash
GANACHE_PRIVATE_KEY=0xYOUR_GANACHE_ACCOUNT_0_KEY npx hardhat run scripts/deploy.js --network ganache
```

6. Frontend:

```bash
cd frontend
npm run dev
```

7. Open http://localhost:5173, click **MetaMask**, approve. Role should show **Owner · authorized**.

Import a **second** Ganache account into MetaMask to demo “Not authorized”.

## Alternative: Hardhat node (no Ganache)

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
cd frontend && npm run dev
```

Then use **Account #0 (owner)** / **Account #1 (unauthorized)** on the page, or MetaMask on chainId `31337` / `http://127.0.0.1:8545`.

## Demo hashes (express / react)

```bash
npm run prepare:data
```

This downloads the current npm tarballs, computes SHA-256, and writes a tampered copy. The UI **Register** and **Verify** pages have buttons for original vs tampered hashes. Open **How it works** for a plain-language explanation.

## Security

See [docs/security-testing.md](docs/security-testing.md). Contract tests: `npx hardhat test`. Slither: 0 findings after `owner` was made `immutable`.
