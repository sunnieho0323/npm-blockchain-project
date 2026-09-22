# Blockchain-Based NPM Package Provenance and Integrity Verification

Subtitle: A prototype using Express and React (Ganache, MetaMask, Solidity, React, ethers.js)

> SIT728 10.2HD. Paste screenshots under the Figure markers in section 12 (eight figures).
>
> Full DApp source (contract, React frontend, tests, docs): https://github.com/sunnieho0323/npm-blockchain-project  
> OnTrack code evidence file: `submission/PackageRegistry.txt`

---

## List of figures

Figure 1 — Ganache running (accounts, RPC `http://127.0.0.1:7545`, network ID)  
Figure 2 — MetaMask on Ganache Local with ETH balance  
Figure 3 — DApp after Connect MetaMask: Account, Role Owner · authorized, contract address  
Figure 4 — Register success (`react@19.3.0` original, transaction hash)  
Figure 5 — Search history (`express@5.2.1` on chain)  
Figure 6 — Verify pass (original hash matches)  
Figure 7 — Verify fail (tampered hash does not match)  
Figure 8 — Unauthorized wallet blocked from Register  

---

## 1. Introduction and position

Modern development almost always includes `npm install`. Developers can name a package such as React, yet they often cannot say where that tarball came from, whether it changed after publication, or whether “open source” means “the copy on my laptop is untouched”.

The position of this work is:

**Blockchain is suitable as a provenance layer for the software supply chain. It is not suitable as the only security scanner.**

It can answer: “Are these bytes the same as the bytes we recorded?”  
It cannot answer: “Is this package malware-free?”

That position continues the 8.2HD literature review: blockchain can improve traceability, integrity, and cross-organisation audit, but it cannot guarantee that the first write was correct, and it does not replace vulnerability scanning or build verification.

This project implements a DApp on **local Ganache**. It uses real npm tarball SHA-256 values for **express@5.2.1** and **react@19.3.0** to demonstrate registration, lookup, verification, and a hash mismatch after tampering.

---

## 2. Software supply chain problem

Provenance records where a digital object came from and how it changed. For a package that can include origin, version, dependencies, build data, hashes, time, and publisher.

Pain points include:

- Packages can be swapped on a registry, a mirror, or in transit (supply-chain attacks).
- SBOMs improve transparency but can be inaccurate, tampered with, or stored in one central system.
- A UI that only shows “installed” does not let a developer independently check “is this still the same artefact?”

This prototype narrows the problem to the part that is easy to demonstrate in npm: **artifact integrity** (a fingerprint of the tarball), not a full SBOM or reproducible-build pipeline.

---

## 3. Existing NPM integrity / provenance

npm already exposes `dist.integrity` (SRI, often SHA-512). Installers can check that a tarball matches what the registry advertised. That helps with transport corruption.

Limits:

- Fingerprints and metadata still live mainly in systems npm and the publisher control.
- Users cannot easily audit whether registry metadata was changed later.
- Passing integrity is not the same as “the package is safe”.

This project does not claim to replace npm integrity. It asks what extra assurance you get by placing the same kind of fingerprint on a ledger that one party cannot quietly rewrite.

---

## 4. Proposed blockchain solution

Each package name + version may be registered once. A record stores:

- package name, version, SHA-256 (string), source (for example `npm`)
- publisher = `msg.sender`
- timestamp = `block.timestamp`

Anyone can later call `verifyPackage` with the same name and version and a current hash. Match returns true; mismatch returns false; unknown packages revert.

Who should write the record? In a real deployment that should be a **registry, CI job, or internal publish pipeline**, not every open-source author opening a wallet by hand. This prototype uses `authorizedPublishers` to model “only approved publishers may write”.

---

## 5. System architecture

```
User (browser)
    → React UI + ethers.js
        → PackageRegistry.sol
            → Ganache (local private chain)
```

- Contract: Solidity 0.8.24, compiled and tested with Hardhat
- Frontend: React + Vite; MetaMask connected to Ganache (RPC `http://127.0.0.1:7545`; network ID / chain ID depends on the Ganache workspace, commonly `1337` or `5777`)
- Case data: `npm pack` tarballs, SHA-256; a second copy with extra bytes appended as the tampered file

UI pages: Dashboard, Register, Search, Verify, How it works (including strengths and limits).

---

## 6. Smart contract design

`PackageRecord` holds the fields above. The lookup key is:

`keccak256(abi.encodePacked(packageName, "|", version))`

The `|` separator avoids concatenation collisions.

A separate `registered[key]` flag distinguishes “never registered” from an empty struct. Each package name has a `versions` array for `getPackageHistory` in registration order.

Access control:

- `owner` is the deployer and `immutable` (response to Slither)
- The deployer is an authorized publisher
- `authorizePublisher` / `revokePublisher` are owner-only; the owner cannot revoke themselves

Functions: `registerPackage`, `getPackage`, `getPackageHistory`, `verifyPackage`.

String comparison uses `keccak256(bytes(...))` on both sides. The contract **does not** hash files; it only compares fingerprints the caller supplies.

---

## 7. Package registration

An authorized wallet submits name, version, hash, and source. Empty strings revert. The same name+version cannot be registered twice. Success emits `PackageRegistered`.

Demo values used in this submission:

- express@5.2.1  
  SHA-256: `1773a16c02b4422653479b9c4d211268f7022bdac0d817b5698535bb485dd005`
- react@19.3.0  
  SHA-256: `5a4024110c49476e1538a70fd65b9e59d038fcc280b78eb933c24e10453afbf9`

Both packages were registered on the local chain. Figure 4 shows a successful `react@19.3.0` registration as the representative screenshot.

---

## 8. Provenance tracking (Search)

Enter a package name → `getPackageHistory` → `getPackage` for each version. The UI shows publisher, source, time, and hash. Unknown names return an empty history rather than fake data. Figure 5 shows the on-chain history for `express`.

---

## 9. Integrity verification

Inputs: name, version, current hash.

- Match: Verified — same as the chain record (Figure 6)
- Mismatch: Verification failed — the file differs from what was registered (Figure 7)
- Unregistered: Cannot verify — there is no provenance row (this is not the same as “tampered”)

Tampering: extra bytes appended to the official `.tgz`. The express tampered hash is  
`ae895af34c1d38908bdda5e5562afddff95a6e47e0703dd3889188d8c00e28bb`.  
The chain still holds the original, so Verify must fail. That shows **the ledger fingerprint did not change; the file did.**

---

## 10. Security design

- Access control: only authorized addresses can register; only the owner can grant or revoke
- No ETH transfers and no external calls, so reentrancy risk is low
- Input checks: empty strings, duplicate versions
- `block.timestamp` is metadata only, not used for access control (miners can nudge time)
- Frontend: empty fields, inputs longer than 256 characters, unauthorized warning

Deliberate gap (for Limitations): an authorized wallet can still register a **wrong or malicious** hash; a wallet is not an npm identity.

---

## 11. Security testing

See `docs/security-testing.md`.

- Slither (102 detectors): first finding was that `owner` could be immutable; after the fix, **0 results**
- Hardhat: `npx hardhat test` **16 passing**
- Frontend: empty input, wrong hash, very long input, unauthorized wallet, duplicate version, unknown package

This matches the unit’s request for contract scanning and reasonable UI tests. It is not a professional penetration-test report.

---

## 12. DApp demonstration (screenshots)

Demonstration used local Ganache, MetaMask, and the React frontend at `http://localhost:5173`. Having MetaMask open is not enough; the page must explicitly connect so Account and Role update.

**Figure 1 — Ganache running**  
Paste here. Shows accounts, RPC server `HTTP://127.0.0.1:7545`, and network ID for this workspace.

**Figure 2 — MetaMask on Ganache Local**  
Paste here. Shows the imported deployer account on network “Ganache Local” with an ETH balance (gas available for transactions).

**Figure 3 — DApp connected as owner**  
Paste here. After **Connect MetaMask to this page**, the UI shows Account, Role **Owner · authorized**, and the deployed contract address.

**Figure 4 — Register success**  
Paste here. Authorized publisher registers `react@19.3.0` with the original npm SHA-256; success message includes a transaction hash. (`express@5.2.1` was also registered for Search/Verify demos.)

**Figure 5 — Search history**  
Paste here. Search for `express` returns version, publisher, source, timestamp, and stored hash from the chain.

**Figure 6 — Verify pass**  
Paste here. Verify with the original hash → **Verified** — integrity matches the blockchain record.

**Figure 7 — Verify fail**  
Paste here. Verify with the tampered hash → **Verification failed** — the file differs; the on-chain record did not change.

**Figure 8 — Unauthorized register blocked**  
Paste here. A second Ganache account is connected (Role **Caller · not authorized**). Register shows **This wallet is not an authorized publisher.** The contract rejects the write (UI may also show a low-level revert such as `missing revert data`).

Demo steps summarised:

1. Start Ganache; import Account 0 into MetaMask; use network Ganache Local.  
2. Deploy with Account 0’s key: `GANACHE_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network ganache`  
3. `cd frontend && npm run dev` → http://localhost:5173  
4. Connect MetaMask on the page (Figure 3).  
5. Register original hashes for express and react (Figure 4).  
6. Search (Figure 5); Verify original vs tampered (Figures 6–7).  
7. Switch MetaMask to Ganache Account 1, Disconnect then Connect again, Register → blocked (Figure 8).

---

## 13. Strengths, weaknesses, and limitations

### Strengths

- Once a version fingerprint is stored, it cannot be quietly overwritten on this contract; a later file change fails Verify.
- You do not have to trust a single website database; a local Ganache demo is enough to show a shared, tamper-evident notebook.
- Access control makes “fake publisher” a testable attack (Figure 8).
- Consistent with 8.2HD: provenance is not malware detection, and the UI states that honestly.

### Weaknesses

- Weak author incentive: maintainers already have `npm publish` and little reason to register by hand.
- High friction: wallets, chain IDs, gas, and contract addresses are not daily tools for most frontend developers.
- Weak identity: the chain knows an address, not “this is the React team”.
- Manual registration can store the wrong hash (garbage in, garbage out).

### Limitations

- No vulnerability scanning, no reproducible-build check, no dependency graph.
- Putting every npm version on a public chain does not scale.
- `block.timestamp` must not be the only security control.
- This is a local Ganache prototype, not a mainnet product.
- The 256-character frontend cap is UX only; the contract may still accept longer strings within gas limits.

---

## 14. Future improvements

- Auto `registerPackage` in the publish pipeline (registry or CI as authorized publisher).
- Integrate with npm provenance, Sigstore, and in-toto instead of replacing them.
- Bind wallets to npm / OIDC identity.
- On-chain hashes only for high-risk packages, with large metadata off-chain.
- A `npm` plugin for Verify so developers never open the DApp site.

---

## 15. Conclusion

This DApp shows that a smart contract can store npm package fingerprints so a user—even without blockchain knowledge—can use Register, Search, and Verify to see origin records and whether a file changed. Real Express and React tarballs plus a tampered copy turn supply-chain integrity from an abstract idea into a running result.

There is still no natural incentive for every author to write on chain, and blockchain cannot prove a package is safe. A practical path is to use the ledger as a provenance backend behind existing publish tools, together with npm integrity, SBOMs, and scanners.

---

## References (same set as 8.2HD; check the unit’s citation style)

[1] Y. Gamage et al., “Software Bills of Materials in Maven Central,” MSR 2025.  
[2] E. Bandara et al., “Vind,” Front. Blockchain, 2021.  
[3] E. Bandara et al., “Let’sTrace,” MILCOM 2021.  
[4] J. Marjanović et al., ECBS 2021.  
[5] D. E. Hyeon et al., AsiaJCIS 2023.  
[6] X. Zhou et al., J. Softw. Evol. Process, 2024.  
[7] K. Lew et al., Appl. Sci., 2024.  
[8] B. Xia et al., EnCyCriS/SVM 2024.  
[9] A. Song et al., “BC-SBOM,” ICACT 2025.  
[10] G. Cho et al., Electronics, 2026.  
[11] I. Aideyan et al., “GuixChain,” 2026.

npm registry pages and `dist.integrity` documentation can be added as web sources.
