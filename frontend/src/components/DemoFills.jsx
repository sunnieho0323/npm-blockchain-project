import demo from "../packageDemo.json";

export function DemoFills({ onPick, mode }) {
  return (
    <div className="demo-row">
      <p className="hint">Case study (real npm tarball SHA-256):</p>
      {demo.packages.map((pkg) => (
        <div key={pkg.name} className="row wrap">
          <button
            type="button"
            className="ghost"
            onClick={() =>
              onPick({
                packageName: pkg.name,
                version: pkg.version,
                hash: pkg.originalHash,
                source: pkg.source,
              })
            }
          >
            {pkg.name}@{pkg.version} original
          </button>
          {mode === "verify" ? (
            <button
              type="button"
              className="ghost"
              onClick={() =>
                onPick({
                  packageName: pkg.name,
                  version: pkg.version,
                  hash: pkg.tamperedHash,
                  source: pkg.source,
                })
              }
            >
              {pkg.name} tampered
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
