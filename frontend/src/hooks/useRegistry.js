import { useCallback, useMemo, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider, Wallet } from "ethers";
import deployment from "../contracts/PackageRegistry.json";
import { HARDHAT_ACCOUNTS, RPC_URL, EXPECTED_CHAIN_ID } from "../lib/hardhatAccounts";
import { hexChainId, networkLabel as chainTitle, rpcUrlForDeployment } from "../lib/networks";
import { parseRevert } from "../lib/errors";

function makeContract(runner) {
  if (!deployment.address) {
    throw new Error("Contract is not deployed. Run: npx hardhat run scripts/deploy.js --network localhost");
  }
  return new Contract(deployment.address, deployment.abi, runner);
}

export function useRegistry() {
  const [account, setAccount] = useState("");
  const [mode, setMode] = useState("");
  const [signer, setSigner] = useState(null);
  const [readProvider, setReadProvider] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [networkLabel, setNetworkLabel] = useState("Not connected");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const readContract = useMemo(() => {
    if (!readProvider || !deployment.address) return null;
    return makeContract(readProvider);
  }, [readProvider]);

  const writeContract = useMemo(() => {
    if (!signer || !deployment.address) return null;
    return makeContract(signer);
  }, [signer]);

  const refreshRole = useCallback(async (contract, address) => {
    const [owner, authorized] = await Promise.all([
      contract.owner(),
      contract.authorizedPublishers(address),
    ]);
    setIsOwner(owner.toLowerCase() === address.toLowerCase());
    setIsAuthorized(authorized);
  }, []);

  const connectHardhat = useCallback(async (index) => {
    setBusy(true);
    setStatus("");
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
        throw new Error(`Unexpected chainId ${network.chainId}. Expected ${EXPECTED_CHAIN_ID}.`);
      }
      const wallet = new Wallet(HARDHAT_ACCOUNTS[index].privateKey, provider);
      const contract = makeContract(wallet);
      await refreshRole(contract, wallet.address);
      setReadProvider(provider);
      setSigner(wallet);
      setAccount(wallet.address);
      setMode(HARDHAT_ACCOUNTS[index].label);
      setNetworkLabel(`Hardhat (${EXPECTED_CHAIN_ID})`);
      setStatus(`Connected as ${HARDHAT_ACCOUNTS[index].label}`);
    } catch (error) {
      setStatus(parseRevert(error));
    } finally {
      setBusy(false);
    }
  }, [refreshRole]);

  const connectMetaMask = useCallback(async () => {
    setBusy(true);
    setStatus("");
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Use a Hardhat account for local demo.");
      }
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const targetChainId = Number(deployment.chainId);
      const targetHex = hexChainId(targetChainId);
      const rpcUrl = rpcUrlForDeployment();
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== targetChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetHex }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: targetHex,
                  chainName: chainTitle(targetChainId),
                  rpcUrls: [rpcUrl],
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                },
              ],
            });
          } else {
            throw new Error(
              `Switch MetaMask to the same network you deployed to (chainId ${targetChainId}, RPC ${rpcUrl}).`
            );
          }
        }
      }
      const nextProvider = new BrowserProvider(window.ethereum);
      const nextSigner = await nextProvider.getSigner();
      const address = await nextSigner.getAddress();
      const contract = makeContract(nextSigner);
      await refreshRole(contract, address);
      setReadProvider(nextProvider);
      setSigner(nextSigner);
      setAccount(address);
      setMode("MetaMask");
      setNetworkLabel(chainTitle(targetChainId));
      setStatus("Connected with MetaMask");
    } catch (error) {
      setStatus(parseRevert(error));
    } finally {
      setBusy(false);
    }
  }, [refreshRole]);

  const disconnect = useCallback(() => {
    setAccount("");
    setMode("");
    setSigner(null);
    setReadProvider(null);
    setIsOwner(false);
    setIsAuthorized(false);
    setNetworkLabel("Not connected");
    setStatus("");
  }, []);

  return {
    account,
    mode,
    signer,
    readContract,
    writeContract,
    isOwner,
    isAuthorized,
    networkLabel,
    status,
    setStatus,
    busy,
    setBusy,
    connectHardhat,
    connectMetaMask,
    disconnect,
    refreshRole,
    contractAddress: deployment.address,
    deployed: Boolean(deployment.address),
  };
}
