import { useState } from "react";
import { useRegistry } from "./hooks/useRegistry";
import WalletBar from "./components/WalletBar";
import Dashboard from "./components/Dashboard";
import RegisterPackage from "./components/RegisterPackage";
import SearchPackage from "./components/SearchPackage";
import VerifyPackage from "./components/VerifyPackage";

import HowItWorks from "./components/HowItWorks";

const PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "register", label: "Register" },
  { id: "search", label: "Search" },
  { id: "verify", label: "Verify" },
  { id: "guide", label: "How it works" },
];

export default function App() {
  const registry = useRegistry();
  const [page, setPage] = useState("dashboard");

  return (
    <div className="shell">
      <WalletBar registry={registry} />
      <nav className="tabs" aria-label="Main">
        {PAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={page === item.id ? "tab active" : "tab"}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main>
        {page === "dashboard" ? <Dashboard registry={registry} /> : null}
        {page === "register" ? <RegisterPackage registry={registry} /> : null}
        {page === "search" ? <SearchPackage registry={registry} /> : null}
        {page === "verify" ? <VerifyPackage registry={registry} /> : null}
        {page === "guide" ? <HowItWorks /> : null}
      </main>
    </div>
  );
}
