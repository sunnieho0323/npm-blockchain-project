export default function HowItWorks() {
  return (
    <section className="guide">
      <h2>If you use npm but not blockchain</h2>
      <p>
        You already trust a download every time you run <code>npm install react</code>.
        This page is a simple check: did the files you got still match a record that
        cannot quietly be rewritten?
      </p>

      <h3>What is React?</h3>
      <p>
        React is an open-source UI library. People publish versions on the npm
        registry. Anyone can download them. “Open source” means you can read the
        code; it does not automatically mean a copy on your laptop is untouched.
      </p>

      <h3>Where is your security today?</h3>
      <p>
        npm can show an integrity string (a fingerprint of the tarball). That helps,
        but the fingerprint still lives in a system npm and the publisher control.
        A later change in that central place is hard for you to independently audit.
      </p>
      <p>
        This prototype does <strong>not</strong> scan for malware. A malicious but
        correctly recorded package would still “verify”. Provenance answers
        “has this artifact changed since we recorded it?”, not “is it safe?”.
      </p>

      <h3>What blockchain is doing here (no jargon required)</h3>
      <p>
        Think of a shared notebook. Once a line is written, changing it later is
        obvious to everyone who has a copy. We write one line per package version:
        name, version, SHA-256 fingerprint, who published the line, and when.
      </p>
      <ol>
        <li>
          <strong>Register</strong> — an authorized publisher writes the official
          fingerprint of <code>express</code> or <code>react</code> as downloaded from npm.
        </li>
        <li>
          <strong>Search</strong> — you look up that name and see the history of versions.
        </li>
        <li>
          <strong>Verify</strong> — you hash the tarball you actually have. If it
          matches the notebook, it is the same bytes. If someone extra-appended
          even one line, the fingerprint changes and verification fails.
        </li>
      </ol>
      <p>
        You do not need to understand mining or wallets to use Verify. The wallet
        is only the pen that writes the notebook, so random people cannot pretend
        to be the publisher.
      </p>

      <h3>What this prototype is good at</h3>
      <ul>
        <li>After a hash is registered, nobody can silently overwrite that version.</li>
        <li>A later copy that differs by even a few bytes fails Verify (tamper demo).</li>
        <li>Only authorized wallets can register, so random accounts cannot spoof a publisher.</li>
        <li>History of versions stays on chain for audit.</li>
      </ul>

      <h3>What it is bad at / who would actually do the work</h3>
      <ul>
        <li>
          Individual authors have little reason to click Register by hand. npm
          publish already exists. In a real system the registry or CI would write
          the hash automatically.
        </li>
        <li>
          A wallet is not an npm login. This DApp cannot prove “this is the React team”.
        </li>
        <li>
          Blockchain does not detect malware. A malicious package with a correctly
          stored hash still verifies.
        </li>
        <li>
          Putting every npm version on a public chain does not scale. This design
          fits high-risk or enterprise packages, not the whole registry.
        </li>
      </ul>
    </section>
  );
}
