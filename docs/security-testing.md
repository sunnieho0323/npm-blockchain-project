# Security testing

Date: 21 Sep 2026. Target: `PackageRegistry.sol` (Solidity 0.8.24) and the React UI.

## Smart contract (Slither)

Command:

```bash
python3.13 -m venv .venv-slither
.venv-slither/bin/pip install slither-analyzer
.venv-slither/bin/solc-select install 0.8.24
.venv-slither/bin/solc-select use 0.8.24
.venv-slither/bin/slither contracts/PackageRegistry.sol --solc .venv-slither/bin/solc --exclude-dependencies
```

First scan: 1 detector — `owner` could be `immutable`.

After declaring `address public immutable owner`: **0 results** (102 detectors).

Manual review mapped to the assignment themes:

| Theme | Result |
|---|---|
| Access control | `onlyOwner` on authorize/revoke; `authorizedPublishers` required to register; owner cannot revoke themselves |
| Reentrancy | No external calls, no ETH transfers |
| Unchecked calls | None |
| Timestamp | `block.timestamp` is stored as provenance metadata only, not used for access control |
| Input validation | Empty strings rejected; duplicate name+version rejected |
| Remaining limit | Publisher identity is a wallet, not an npm login. Garbage-in still possible if an authorized wallet registers a wrong hash |

Hardhat tests: **16 passing** (`npx hardhat test`).

## Front-end checks

Not a full professional pentest. Cases below are the ones the unit asked for.

| Case | Where | Result |
|---|---|---|
| Empty input | Register / Search / Verify | Blocked in UI: “Fill in…” / “Enter a package name.” |
| Invalid / wrong hash | Verify with tampered SHA-256 | `Verification failed` — hash does not match |
| Extremely long input | Register / Verify | UI rejects strings longer than 256 characters |
| Unauthorized wallet | MetaMask or Hardhat Account #1 on Register | Warning plus contract revert `Not authorized` |
| Duplicate version | Register the same name+version twice | `Package version already registered` |
| Invalid / unknown package | Search unknown name | “No versions registered”; Verify unknown → `Package version not registered` |

## Tamper demonstration

Real npm tarballs hashed with SHA-256 (`node scripts/prepare-package-data.js`):

- `express@5.2.1` original vs extra bytes appended to the `.tgz`
- `react@19.3.0` same method

Register the **original** hash, then Verify with the **tampered** hash. The chain record does not change; the UI reports a mismatch.
