import { useState } from "react";
import { formatTimestamp, parseRevert, shortenAddress } from "../lib/errors";

export default function SearchPackage({ registry }) {
  const [name, setName] = useState("");
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setRecords(null);
    if (!registry.readContract) {
      registry.setStatus("Connect a wallet first.");
      return;
    }
    const packageName = name.trim();
    if (!packageName) {
      setError("Enter a package name.");
      return;
    }
    registry.setBusy(true);
    try {
      const versions = [...(await registry.readContract.getPackageHistory(packageName))];
      if (versions.length === 0) {
        setRecords([]);
        return;
      }
      const rows = [];
      for (const version of versions) {
        const record = await registry.readContract.getPackage(packageName, version);
        rows.push({
          packageName: record.packageName,
          version: record.version,
          packageHash: record.packageHash,
          source: record.source,
          publisher: record.publisher,
          timestamp: record.timestamp,
        });
      }
      setRecords(rows);
    } catch (err) {
      setError(parseRevert(err));
    } finally {
      registry.setBusy(false);
    }
  }

  return (
    <section>
      <h2>Search package</h2>
      <p>Look up every registered version for a package name.</p>
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Package name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="express" />
        </label>
        <button type="submit" disabled={registry.busy}>
          Search
        </button>
      </form>
      {error ? <p className="fail">{error}</p> : null}
      {records && records.length === 0 ? <p className="note">No versions registered for this name.</p> : null}
      {records && records.length > 0 ? (
        <div className="history">
          {records.map((record) => (
            <article key={record.version} className="record-card">
              <h3>
                {record.packageName} <span>{record.version}</span>
              </h3>
              <dl>
                <div>
                  <dt>Publisher</dt>
                  <dd>{shortenAddress(record.publisher)}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{record.source}</dd>
                </div>
                <div>
                  <dt>Recorded</dt>
                  <dd>{formatTimestamp(record.timestamp)}</dd>
                </div>
                <div className="wide">
                  <dt>Hash</dt>
                  <dd className="mono">{record.packageHash}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
