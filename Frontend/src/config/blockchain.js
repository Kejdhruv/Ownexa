const DEFAULT_SMART_CONTRACT = "0x5B61c458Ea3cE4abdD8657012A38c23Fb17ba281";

const normalizeEnvAddress = (value) => {
  if (!value) return "";

  const address = String(value).trim();
  if (!address || address === "null" || address === "undefined") return "";

  return address;
};

export const CONTRACT_ADDRESS =
  normalizeEnvAddress(import.meta.env.VITE_SMART_CONTRACT) ||
  DEFAULT_SMART_CONTRACT;

export const assertContractAddress = () => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
    throw new Error("Invalid smart contract address. Check VITE_SMART_CONTRACT in Vercel.");
  }

  return CONTRACT_ADDRESS;
};
