"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Cpu,
  Fingerprint,
  GitBranch,
  Layers3,
  LockKeyhole,
  ScanLine,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  balances,
  domains,
  formatAmount,
  hex,
  privacyScore,
  seedReceipts,
  solvers,
  type Asset,
  type Domain,
  type Receipt,
} from "./model";
import { Relay } from "./relay";

const tabs = ["Route", "Solvers", "Receipts", "How It Works"] as const;
const metrics = [
  { Icon: Clock3, label: "Median Fill Time", value: "11.4s" },
  { Icon: Cpu, label: "Active TEE Solvers", value: "14" },
  { Icon: Fingerprint, label: "Unlinkability Score", value: "99.4%" },
  { Icon: Zap, label: "$QUIETDESK Fee Discount", value: "Up to 60%" },
];
const storageKey = "shroud.preview.receipts.v1";
const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const shortAddress = (address: string) =>
  address.slice(0, 6) + "••••" + address.slice(-4);

function Paper() {
  return <span className="paper mono">PREVIEW · PAPER MODE</span>;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <header className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export default function Home() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Route");
  const [from, setFrom] = useState<Domain>("HyperCore");
  const [to, setTo] = useState<Domain>("Elysium");
  const [asset, setAsset] = useState<Asset>("HYPE");
  const [amount, setAmount] = useState("25");
  const [recipient, setRecipient] = useState("");
  const [split, setSplit] = useState(true);
  const [fragments, setFragments] = useState(3);
  const [jitter, setJitter] = useState(20);
  const [discount, setDiscount] = useState(false);
  const [wallet, setWallet] = useState("");
  const [walletOpen, setWalletOpen] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [proof, setProof] = useState<Receipt>();
  const [clearOpen, setClearOpen] = useState(false);
  const [domainFilter, setDomainFilter] = useState("All domains");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState(-1);
  const [relayCommitment, setRelayCommitment] = useState("0x8F••••D7A2");
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const pending = useRef(false);
  const score = privacyScore(split, fragments, jitter);
  const fee = discount ? 0.048 : 0.12;
  const fill = split ? "15–30s" : "5–15s";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const data: unknown = saved === null ? seedReceipts() : JSON.parse(saved);
      if (Array.isArray(data)) setReceipts(data);
    } catch {
      setNotice("Saved preview history could not be loaded.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(receipts));
    } catch {
      setNotice(
        "Browser storage is unavailable. Receipts are available for this session.",
      );
    }
  }, [ready, receipts]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  function swap() {
    setFrom(to);
    setTo(from);
  }
  function selectDomain(side: "from" | "to", value: Domain) {
    if ((side === "from" ? to : from) === value) {
      swap();
      return;
    }
    if (side === "from") setFrom(value);
    else setTo(value);
  }

  async function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !ready) return;
    const value = Number(amount);
    if (
      !/^\d*\.?\d+$/.test(amount.trim()) ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > balances[asset]
    ) {
      setError(
        `Enter an amount between 0 and your ${formatAmount(balances[asset])} ${asset} preview balance.`,
      );
      return;
    }
    if (!addressPattern.test(recipient.trim())) {
      setError("Enter a valid 0x address or generate a fresh stealth address.");
      return;
    }
    setError("");
    pending.current = true;
    setActive(true);
    try {
      const commitment = hex(32);
      setRelayCommitment(shortAddress(commitment));
      for (let step = 0; step < 4; step++) {
        setStage(step);
        await pause(900 + (split ? (900 * Math.random() * jitter) / 100 : 0));
      }
      const receipt: Receipt = {
        id: hex(8),
        from,
        to,
        asset,
        amount: value,
        delivered: value * (1 - fee / 100),
        timestamp: new Date().toISOString(),
        commitment,
        sender: wallet ? shortAddress(wallet) : "0x••••••••",
        split,
        fragments: split ? fragments : 1,
        score,
        fee,
      };
      setReceipts((history) => [receipt, ...history]);
      setNotice("Simulated delivery complete. Preview receipt saved.");
    } catch {
      setError("The route simulation could not finish. Try again.");
      setStage(-1);
    } finally {
      pending.current = false;
      setActive(false);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(label + " copied.");
    } catch {
      setNotice("Clipboard unavailable in this browser.");
    }
  }

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <button
            className="brand"
            onClick={() => setTab("Route")}
            aria-label="quietdesk home"
          >
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M22 8v20M22 14c0 4.4-3.4 8-7.5 8S7 18.4 7 14s3.4-8 7.5-8 7.5 3.6 7.5 8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            quietdesk
          </button>
          <nav aria-label="Main navigation">
            {tabs.map((item) => (
              <button
                key={item}
                aria-current={tab === item ? "page" : undefined}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="top-actions">
            <span className="network mono">
              <i /> ELYSIUM 99901
            </span>
            <Paper />
            <button className="wallet" onClick={() => setWalletOpen(true)}>
              <Wallet size={15} />
              <span>{wallet ? shortAddress(wallet) : "Connect Wallet"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="frame">
        {tab === "Route" && (
          <>
            <section className="hero">
              <div className="hero-tag mono">
                <ScanLine size={14} /> CONFIDENTIAL CROSS-DOMAIN ROUTER
              </div>
              <h1>
                Move in <em>silence.</em>
              </h1>
              <p>
                Simulate confidential transfers across HyperCore, HyperEVM, and
                Elysium.
              </p>
            </section>
            <div className="workspace">
              <section className="panel terminal">
                <header className="panel-head">
                  <span>
                    <ScanLine size={17} /> Transfer terminal
                  </span>
                  <span className="subtle mono">PAPER ROUTING</span>
                </header>
                <form onSubmit={simulate} noValidate>
                  <fieldset disabled={active}>
                    <div className="chain-row">
                      <label>
                        From chain
                        <div className="select-wrap chain-select">
                          <Layers3 size={16} />
                          <select
                            value={from}
                            onChange={(event) =>
                              selectDomain("from", event.target.value as Domain)
                            }
                          >
                            {domains.map((domain) => (
                              <option key={domain}>{domain}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} />
                        </div>
                      </label>
                      <button
                        className="icon-button swap"
                        type="button"
                        aria-label="Swap chains"
                        onClick={swap}
                      >
                        <ArrowDownUp size={16} />
                      </button>
                      <label>
                        To chain
                        <div className="select-wrap chain-select">
                          <Layers3 size={16} />
                          <select
                            value={to}
                            onChange={(event) =>
                              selectDomain("to", event.target.value as Domain)
                            }
                          >
                            {domains.map((domain) => (
                              <option key={domain}>{domain}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} />
                        </div>
                      </label>
                    </div>
                    <div className="field">
                      <div className="between">
                        <label htmlFor="amount">Amount</label>
                        <span className="muted mono">
                          Balance: {formatAmount(balances[asset])} {asset}
                        </span>
                      </div>
                      <div className="amount-box">
                        <input
                          id="amount"
                          inputMode="decimal"
                          pattern="[0-9]*[.]?[0-9]*"
                          placeholder="0.00"
                          value={amount}
                          onChange={(event) => {
                            setAmount(event.target.value);
                            setError("");
                          }}
                        />
                        <div className="select-wrap asset-select">
                          <select
                            aria-label="Asset"
                            value={asset}
                            onChange={(event) => {
                              setAsset(event.target.value as Asset);
                              setError("");
                            }}
                          >
                            {Object.keys(balances).map((item) => (
                              <option key={item}>{item}</option>
                            ))}
                          </select>
                          <ChevronDown size={13} />
                        </div>
                      </div>
                      <div className="quick">
                        {[25, 50, 100].map((percent) => (
                          <button
                            key={percent}
                            type="button"
                            onClick={() => {
                              setAmount(
                                String(
                                  Number(
                                    ((balances[asset] * percent) / 100).toFixed(
                                      8,
                                    ),
                                  ),
                                ),
                              );
                              setError("");
                            }}
                          >
                            {percent === 100 ? "MAX" : percent + "%"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="field">
                      <div className="between">
                        <label htmlFor="recipient">Recipient address</label>
                        <button
                          className="text-button"
                          type="button"
                          aria-label="Generate fresh stealth address"
                          onClick={() => {
                            setRecipient(hex(20));
                            setError("");
                          }}
                        >
                          <Sparkles size={13} /> Generate stealth address
                        </button>
                      </div>
                      <input
                        id="recipient"
                        className="address mono"
                        placeholder="0x…"
                        spellCheck={false}
                        value={recipient}
                        onChange={(event) => {
                          setRecipient(event.target.value);
                          setError("");
                        }}
                      />
                    </div>
                    <div className="privacy field">
                      <label id="mode-label">Privacy controls</label>
                      <div
                        className="modes"
                        role="group"
                        aria-labelledby="mode-label"
                      >
                        <button
                          type="button"
                          aria-pressed={!split}
                          onClick={() => setSplit(false)}
                        >
                          <Zap size={15} />
                          <span>
                            Direct TEE<small>5–15s</small>
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-pressed={split}
                          onClick={() => setSplit(true)}
                        >
                          <GitBranch size={15} />
                          <span>
                            Split-Hop Stealth
                            <small>15–30s · {fragments} fragments</small>
                          </span>
                        </button>
                      </div>
                      {split && (
                        <div className="tuning">
                          <label>
                            Fragments{" "}
                            <select
                              aria-label="Split fragments"
                              value={fragments}
                              onChange={(event) =>
                                setFragments(Number(event.target.value))
                              }
                            >
                              {[2, 3, 4, 5].map((value) => (
                                <option key={value}>{value}</option>
                              ))}
                            </select>
                          </label>
                          <label className="jitter">
                            Timing jitter{" "}
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={jitter}
                              onChange={(event) =>
                                setJitter(Number(event.target.value))
                              }
                            />
                            <span className="mono">{jitter}%</span>
                          </label>
                        </div>
                      )}
                      <div className="score">
                        <div className="between">
                          <span>
                            <ShieldCheck size={15} /> Privacy score
                          </span>
                          <strong className="mono">
                            {score}
                            <small>/100</small>
                          </strong>
                        </div>
                        <div
                          className="meter"
                          role="meter"
                          aria-label="Preview privacy score"
                          aria-valuenow={score}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          {Array.from({ length: 25 }, (_, index) => (
                            <i
                              key={index}
                              className={index * 4 < score ? "lit" : ""}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="quote">
                      <div>
                        <Clock3 size={14} /> Est. fill <strong>{fill}</strong>
                      </div>
                      <div>
                        Solver fee <strong>{fee}%</strong>
                      </div>
                      <label className="tier">
                        <input
                          type="checkbox"
                          checked={discount}
                          onChange={(event) =>
                            setDiscount(event.target.checked)
                          }
                        />
                        <span>$QUIETDESK tier</span>
                      </label>
                      <span className="zero">
                        <LockKeyhole size={12} /> Zero-link preview
                      </span>
                    </div>
                  </fieldset>
                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="cta" disabled={active || !ready}>
                    <ShieldCheck size={17} />
                    {active
                      ? "Simulating private route…"
                      : "Simulate Private Route"}
                  </button>
                </form>
              </section>
              <Relay
                from={from}
                to={to}
                split={split}
                fragments={fragments}
                stage={stage}
                active={active}
                commitment={relayCommitment}
              />
            </div>
            <section className="metrics" aria-label="Preview metrics">
              {metrics.map(({ Icon, label, value }) => (
                <article className="panel metric" key={label}>
                  <div className="between">
                    <Icon size={17} />
                    <span className="mono subtle">PREVIEW</span>
                  </div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </section>
          </>
        )}

        {tab === "Solvers" && (
          <>
            <section className="hero compact">
              <div className="hero-tag mono">
                <Cpu size={14} /> SOLVER NETWORK
              </div>
              <h1>
                Confidential <em>solvers.</em>
              </h1>
              <p>
                Explore simulated inventory, domain coverage, and fill
                performance.
              </p>
            </section>
            <section className="panel">
              <header className="panel-head">
                <span>
                  <Activity size={17} /> Solver inventory
                </span>
                <div className="select-wrap filter">
                  <select
                    aria-label="Filter solvers by domain"
                    value={domainFilter}
                    onChange={(event) => setDomainFilter(event.target.value)}
                  >
                    {["All domains", ...domains].map((domain) => (
                      <option key={domain}>{domain}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </div>
              </header>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Solver ID</th>
                      <th>Supported domains</th>
                      <th>HYPE inventory</th>
                      <th>USDC inventory</th>
                      <th>Median fill</th>
                      <th>Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solvers
                      .filter(
                        (solver) =>
                          domainFilter === "All domains" ||
                          solver.domains.some(
                            (domain) => domain === domainFilter,
                          ),
                      )
                      .map((solver) => (
                        <tr key={solver.id}>
                          <td className="mono lime">{solver.id}</td>
                          <td>
                            <div className="chips">
                              {solver.domains.map((domain) => (
                                <span key={domain}>{domain}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <Inventory value={solver.hype} max={2000} />
                          </td>
                          <td>
                            <Inventory value={solver.usdc} max={100000} />
                          </td>
                          <td className="mono">{solver.speed}</td>
                          <td className="mono">{solver.uptime}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        {tab === "Receipts" && (
          <>
            <section className="hero compact">
              <div className="hero-tag mono">
                <Fingerprint size={14} /> LOCAL TRANSFER HISTORY
              </div>
              <h1>
                Route <em>receipts.</em>
              </h1>
              <p>Review paper-mode transfers saved in this browser.</p>
            </section>
            <section className="panel">
              <header className="panel-head history-head">
                <span>
                  <ShieldCheck size={17} /> Preview receipts
                </span>
                <div className="history-actions">
                  <button
                    className="wallet"
                    disabled={!receipts.length}
                    onClick={() =>
                      copy(JSON.stringify(receipts, null, 2), "Receipt history")
                    }
                  >
                    <Copy size={14} /> Copy history
                  </button>
                  <button
                    className="wallet"
                    disabled={!receipts.length}
                    onClick={() => setClearOpen(true)}
                  >
                    Clear history
                  </button>
                </div>
              </header>
              {receipts.length ? (
                <div className="receipt-list">
                  {receipts.map((receipt) => (
                    <article className="receipt" key={receipt.id}>
                      <div>
                        <Paper />
                        <h3>
                          {receipt.from} <ArrowRight size={15} /> {receipt.to}
                        </h3>
                        <time dateTime={receipt.timestamp}>
                          {new Date(receipt.timestamp).toLocaleString()}
                        </time>
                      </div>
                      <div>
                        <strong className="mono lime">
                          {formatAmount(receipt.delivered)} {receipt.asset}
                        </strong>
                        <button
                          className="wallet"
                          onClick={() => setProof(receipt)}
                        >
                          View Zero-Link Proof
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty">
                  {ready
                    ? "No preview receipts. Simulate a route to create one."
                    : "Loading preview receipts…"}
                </p>
              )}
            </section>
          </>
        )}
        {tab === "How It Works" && (
          <>
            <section className="hero compact">
              <div className="hero-tag mono">
                <GitBranch size={14} /> CONFIDENTIAL ROUTING
              </div>
              <h1>
                How it <em>works.</em>
              </h1>
              <p>
                Follow the proposed route from shielded deposit to solver
                delivery in paper mode.
              </p>
            </section>
            <div className="explain">
              <article className="panel">
                <Shield size={26} />
                <h2>Shielded Deposit</h2>
                <p>
                  The preview represents a source deposit with a scrubbed
                  commitment and a fresh recipient address. Split-hop mode
                  simulates dividing the intent into fragments and applying
                  timing jitter.
                </p>
              </article>
              <article className="panel">
                <Cpu size={26} />
                <h2>TEE-Matched Confidential Intent</h2>
                <p>
                  In the proposed design, a trusted execution environment
                  matches the intent and a solver fills it from destination
                  inventory without a direct on-chain link to the deposit.
                </p>
              </article>
              <article className="panel">
                <Zap size={26} />
                <h2>$QUIETDESK Staking Fee Discounts</h2>
                <p>
                  Turn on the simulated $QUIETDESK tier in the quote to apply a 60%
                  discount to the 0.12% solver fee.
                </p>
              </article>
            </div>
          </>
        )}
        <footer>
          <span className="mono">quietdesk / CONFIDENTIAL ROUTING</span>
          <span>Client-side simulation · No mainnet transactions</span>
        </footer>
      </main>
      {walletOpen && (
        <Modal title="Preview wallet" onClose={() => setWalletOpen(false)}>
          <Paper />
          <p>
            Choose a wallet label to create a simulated address for this
            session.
          </p>
          {wallet ? (
            <>
              <p className="mono hash">{wallet}</p>
              <button
                className="wallet"
                onClick={() => {
                  setWallet("");
                  setWalletOpen(false);
                }}
              >
                Disconnect preview wallet
              </button>
            </>
          ) : (
            <div className="wallet-options">
              {["MetaMask", "Rabby", "WalletConnect"].map((name) => (
                <button
                  key={name}
                  className="wallet"
                  onClick={() => {
                    setWallet(hex(20));
                    setWalletOpen(false);
                    setNotice(name + " preview session connected.");
                  }}
                >
                  <Wallet size={17} />
                  {name}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
      {proof && (
        <Modal title="Zero-Link Proof" onClose={() => setProof(undefined)}>
          <Paper />
          <p>
            Simulated receipt metadata for {proof.from} → {proof.to}.
          </p>
          <dl className="proof">
            <dt>Commitment hash</dt>
            <dd className="mono hash">{proof.commitment}</dd>
            <dt>Redacted sender</dt>
            <dd className="mono">{proof.sender}</dd>
            <dt>Delivered amount</dt>
            <dd className="mono">
              {formatAmount(proof.delivered)} {proof.asset}
            </dd>
            <dt>Timestamp</dt>
            <dd>{new Date(proof.timestamp).toLocaleString()}</dd>
            <dt>Simulated route</dt>
            <dd>
              {proof.split ? `${proof.fragments} fragments` : "Direct TEE"} ·
              Privacy score {proof.score}/100
            </dd>
          </dl>
          <button
            className="wallet"
            onClick={() => copy(proof.commitment, "Commitment hash")}
          >
            <Copy size={14} /> Copy commitment
          </button>
        </Modal>
      )}
      {clearOpen && (
        <Modal
          title="Clear preview history?"
          onClose={() => setClearOpen(false)}
        >
          <p>This removes all saved preview receipts from this browser.</p>
          <div className="history-actions">
            <button className="wallet" onClick={() => setClearOpen(false)}>
              Cancel
            </button>
            <button
              className="wallet"
              onClick={() => {
                setReceipts([]);
                setClearOpen(false);
                setNotice("Preview history cleared.");
              }}
            >
              Clear history
            </button>
          </div>
        </Modal>
      )}
      <div className="pointer-events-none" role="status">
        {notice && (
          <div className="toast">
            <Check size={16} />
            {notice}
          </div>
        )}
      </div>
    </>
  );
}

function Inventory({ value, max }: { value: number; max: number }) {
  return (
    <div className="inventory">
      <span className="mono">{formatAmount(value)}</span>
      <div>
        <i style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
