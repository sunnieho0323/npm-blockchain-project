import { useEffect, useState } from "react";
import { parseRevert, shortenAddress } from "../lib/errors";

export default function Dashboard({ registry }) {
  const [stats, setStats] = useState({ packages: 0, versions: 0 });
  const [publisher, setPublisher] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    async function loadStats() {
      if (!registry.readContract) return;
      try {
        const logs = await registry.readContract.queryFilter(
          registry.readContract.filters.PackageRegistered()
        );
        const names = new Set(logs.map((log) => log.args.packageName));
        setStats({ packages: names.size, versions: logs.length });
      } catch (error) {
        setStats({ packages: 0, versions: 0 });
      }
    }
    loadStats();
  }, [registry.readContract, registry.status]);

  async function runAdmin(action) {
    if (!registry.writeContract) {
      registry.setStatus("Connect a wallet first.");
      return;
    }
    if (!publisher.trim()) {
      setAdminNote("Enter a wallet address.");
      return;
    }
    setAdminNote("");
    registry.setBusy(true);
    try {
      const tx = await registry.writeContract[action](publisher.trim());
      await tx.wait();
      setAdminNote(`${action} confirmed.`);
      await registry.refreshRole(registry.writeContract, registry.account);
    } catch (error) {
      setAdminNote(parseRevert(error));
    } finally {
      registry.setBusy(false);
    }
  }

  return (
    <section>
      <div className="hero">
        <h2>NPM Package Provenance DApp</h2>
        <p className="tagline">Track. Verify. Protect Open-Source Packages.</p>
        <p>
          This prototype records npm package hashes on a local Ethereum chain.
          Matching a download against that record shows whether the artifact
          changed. It does not prove the package is safe.
        </p>
      </div>
      <div className="stat-grid">
        <article>
          <h3>Registered packages</h3>
          <p className="stat">{stats.packages}</p>
        </article>
        <article>
          <h3>Registered versions</h3>
          <p className="stat">{stats.versions}</p>
        </article>
        <article>
          <h3>Blockchain network</h3>
          <p className="stat network">{registry.networkLabel}</p>
        </article>
      </div>
      {registry.isOwner ? (
        <div className="panel">
          <h3>Authorize publisher</h3>
          <p>Only the contract owner can grant or revoke register permission.</p>
          <label>
            Wallet address
            <input
              value={publisher}
              onChange={(event) => setPublisher(event.target.value)}
              placeholder="0x…"
            />
          </label>
          <div className="row">
            <button type="button" disabled={registry.busy} onClick={() => runAdmin("authorizePublisher")}>
              Authorize
            </button>
            <button type="button" className="ghost" disabled={registry.busy} onClick={() => runAdmin("revokePublisher")}>
              Revoke
            </button>
          </div>
          {adminNote ? <p className="note">{adminNote}</p> : null}
          <p className="hint">Owner: {shortenAddress(registry.account)}</p>
        </div>
      ) : null}
    </section>
  );
}
