import { useState } from "react";
import { parseRevert } from "../lib/errors";
import { DemoFills } from "./DemoFills";

export default function RegisterPackage({ registry }) {
  const [form, setForm] = useState({
    packageName: "",
    version: "",
    packageHash: "",
    source: "npm",
  });
  const [result, setResult] = useState(null);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setResult(null);
    if (!registry.writeContract) {
      registry.setStatus("Connect a wallet first.");
      return;
    }
    if (!form.packageName.trim() || !form.version.trim() || !form.packageHash.trim() || !form.source.trim()) {
      setResult({ ok: false, text: "Fill in package name, version, hash, and source." });
      return;
    }
    const fields = [
      form.packageName,
      form.version,
      form.packageHash,
      form.source,
    ].map((value) => value.trim());
    if (fields.some((value) => value.length > 256)) {
      setResult({ ok: false, text: "Input exceeds 256 characters." });
      return;
    }
    registry.setBusy(true);
    try {
      const tx = await registry.writeContract.registerPackage(
        form.packageName.trim(),
        form.version.trim(),
        form.packageHash.trim(),
        form.source.trim()
      );
      const receipt = await tx.wait();
      setResult({
        ok: true,
        text: `Registered ${form.packageName.trim()}@${form.version.trim()}. Tx: ${receipt.hash}`,
      });
    } catch (error) {
      setResult({ ok: false, text: parseRevert(error) });
    } finally {
      registry.setBusy(false);
    }
  }

  return (
    <section>
      <h2>Register package</h2>
      <p>Stores name, version, SHA-256 hash, and source. Publisher and timestamp come from the chain.</p>
      {!registry.isAuthorized && registry.account ? (
        <p className="warn">This wallet is not an authorized publisher.</p>
      ) : null}
      <DemoFills
        mode="register"
        onPick={(demo) =>
          setForm({
            packageName: demo.packageName,
            version: demo.version,
            packageHash: demo.hash,
            source: demo.source,
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
          Package hash
          <input value={form.packageHash} onChange={(e) => update("packageHash", e.target.value)} placeholder="SHA-256 hex" />
        </label>
        <label>
          Source
          <input value={form.source} onChange={(e) => update("source", e.target.value)} placeholder="npm" />
        </label>
        <button type="submit" disabled={registry.busy}>
          Register
        </button>
      </form>
      {result ? <p className={result.ok ? "ok" : "fail"}>{result.text}</p> : null}
    </section>
  );
}
