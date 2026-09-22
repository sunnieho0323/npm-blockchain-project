import { shortenAddress } from "../lib/errors";
import { HARDHAT_ACCOUNTS } from "../lib/hardhatAccounts";

export default function WalletBar({ registry }) {
  return (
    <header className="topbar">
      <div>
        <p className="kicker">SIT728 · Supply-chain DApp</p>
        <h1>NPM Package Provenance</h1>
      </div>
      <div className="wallet-actions">
        <button type="button" disabled={registry.busy} onClick={registry.connectMetaMask}>
          MetaMask
        </button>
        <button type="button" className="ghost" disabled={registry.busy} onClick={() => registry.connectHardhat(0)}>
          {HARDHAT_ACCOUNTS[0].label}
        </button>
        <button type="button" className="ghost" disabled={registry.busy} onClick={() => registry.connectHardhat(1)}>
          {HARDHAT_ACCOUNTS[1].label}
        </button>
        {registry.account ? (
          <button type="button" className="ghost" onClick={registry.disconnect}>
            Disconnect
          </button>
        ) : null}
      </div>
      <dl className="wallet-meta">
        <div>
          <dt>Account</dt>
          <dd>{registry.account ? shortenAddress(registry.account) : "—"}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>
            {registry.account
              ? `${registry.isOwner ? "Owner" : "Caller"} · ${registry.isAuthorized ? "authorized" : "not authorized"}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>{registry.deployed ? shortenAddress(registry.contractAddress) : "not deployed"}</dd>
        </div>
      </dl>
      {registry.account ? (
        registry.status ? <p className="banner">{registry.status}</p> : null
      ) : (
        <div className="connect-box">
          <p>
            Having MetaMask open is not enough. Click below so <strong>this page</strong> can use your wallet.
          </p>
          <button type="button" disabled={registry.busy} onClick={registry.connectMetaMask}>
            Connect MetaMask to this page
          </button>
          {registry.status ? <p className="banner">{registry.status}</p> : null}
        </div>
      )}
      <p className="hint">
        Account #0 / #1 are only for Hardhat node (port 8545), not Ganache.
      </p>
    </header>
  );
}
