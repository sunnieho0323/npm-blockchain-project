import { useState } from "react";
import { parseRevert } from "../lib/errors";
import { DemoFills } from "./DemoFills";

export default function VerifyPackage({ registry }) {
  const [form, setForm] = useState({
    packageName: "",
    version: "",
    currentHash: "",
  });
  const [result, setResult] = useState(null);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setResult(null);
    if (!registry.readContract) {
      registry.setStatus("Connect a wallet first.");
      return;
    }
    if (!form.packageName.trim() || !form.version.trim() || !form.currentHash.trim()) {
      setResult({ kind: "error", title: "Missing fields", text: "Enter package name, version, and hash." });
      return;
    }
    if (
      [form.packageName, form.version, form.currentHash].some(
        (value) => value.trim().length > 256
      )
    ) {
      setResult({
        kind: "error",
        title: "Input too long",
        text: "Input exceeds 256 characters.",
      });
      return;
    }
    registry.setBusy(true);
    try {
      const matches = await registry.readContract.verifyPackage(
        form.packageName.trim(),
        form.version.trim(),
        form.currentHash.trim()
      );
      if (matches) {
        setResult({
          kind: "ok",
          title: "Verified",
          text: "Package integrity matches the blockchain record.",
        });
      } else {
        setResult({
          kind: "fail",
          title: "Verification failed",
          text: "The package hash does not match the blockchain record.",
        });
      }
    } catch (error) {
      setResult({
        kind: "error",
        title: "Cannot verify",
        text: parseRevert(error),
      });
    } finally {
      registry.setBusy(false);
    }
  }

  return (
    <section>
      <h2>Verify package</h2>
      <p>Compare a current hash with the hash stored for that name and version.</p>
      <DemoFills
        mode="verify"
        onPick={(demo) =>
          setForm({
            packageName: demo.packageName,
            version: demo.version,
            currentHash: demo.hash,
          })
        }
      />
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Package name
          <input value={form.packageName} onChange={(e) => update("packageName", e.target.value)} placeholder="express" />
        </label>
        <label>
          Version
          <input value={form.version} onChange={(e) => update("version", e.target.value)} placeholder="4.21.0" />
        </label>
        <label>
          Current hash
          <input value={form.currentHash} onChange={(e) => update("currentHash", e.target.value)} placeholder="SHA-256 of the downloaded package" />
        </label>
        <button type="submit" disabled={registry.busy}>
          Verify
        </button>
      </form>
      {result ? (
        <div className={`stamp ${result.kind}`}>
          <strong>{result.title}</strong>
          <p>{result.text}</p>
        </div>
      ) : null}
    </section>
  );
}
