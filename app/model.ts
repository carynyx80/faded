export const domains = ["HyperCore", "HyperEVM", "Elysium"] as const;
export type Domain = (typeof domains)[number];
export const balances = { HYPE: 124.8, kHYPE: 42.5, USDC: 2500 };
export type Asset = keyof typeof balances;
export const stages = [
  "Shielding Deposit",
  "TEE Enclave Match",
  "Solver Inventory Fill",
  "Zero-Link Delivered",
];

export type Receipt = {
  id: string;
  from: Domain;
  to: Domain;
  asset: Asset;
  amount: number;
  delivered: number;
  timestamp: string;
  commitment: string;
  sender: string;
  split: boolean;
  fragments: number;
  score: number;
  fee: number;
};

export const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value);

export function hex(bytes: number) {
  return (
    "0x" +
    Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("")
  );
}

export function privacyScore(
  split: boolean,
  fragments: number,
  jitter: number,
) {
  return split
    ? Math.min(100, 77 + fragments * 3 + Math.round(jitter * 0.35))
    : 63;
}

export function seedReceipts(): Receipt[] {
  const examples: Pick<Receipt, "from" | "to" | "asset" | "amount">[] = [
    { from: "HyperCore", to: "Elysium", asset: "HYPE", amount: 32 },
    { from: "Elysium", to: "HyperEVM", asset: "USDC", amount: 240 },
    { from: "HyperEVM", to: "HyperCore", asset: "kHYPE", amount: 12.5 },
  ];
  return examples.map((row, index) => ({
    ...row,
    id: hex(8),
    delivered: row.amount * 0.9988,
    timestamp: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
    commitment: hex(32),
    sender: "0x7E••••9A41",
    split: true,
    fragments: 3,
    score: 93,
    fee: 0.12,
  }));
}

export const solvers = [
  {
    id: "NIGHTFALL-07",
    domains,
    hype: 1840,
    usdc: 83500,
    speed: "9.8s",
    uptime: "99.99%",
  },
  {
    id: "OBSIDIAN-12",
    domains: ["HyperCore", "Elysium"],
    hype: 1240,
    usdc: 64700,
    speed: "11.4s",
    uptime: "99.96%",
  },
  {
    id: "CIPHER-04",
    domains: ["HyperEVM", "Elysium"],
    hype: 960,
    usdc: 47100,
    speed: "12.1s",
    uptime: "99.97%",
  },
  {
    id: "SPECTER-09",
    domains: ["HyperCore", "HyperEVM"],
    hype: 720,
    usdc: 31500,
    speed: "14.2s",
    uptime: "99.92%",
  },
  {
    id: "UMBRA-03",
    domains,
    hype: 1420,
    usdc: 72900,
    speed: "10.7s",
    uptime: "99.98%",
  },
];
