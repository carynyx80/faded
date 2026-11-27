import { Activity, Box, Cpu, Layers3, ShieldCheck } from "lucide-react";
import { type Domain, stages } from "./model";

const icons = [Layers3, ShieldCheck, Cpu, Box];
const roles = ["SOURCE DOMAIN", "ENCLAVE VAULT", "SOLVER POOL", "DESTINATION"];
const positions = [79, 237, 395, 553];

export function Relay({
  from,
  to,
  split,
  fragments,
  stage,
  active,
  commitment,
}: {
  from: Domain;
  to: Domain;
  split: boolean;
  fragments: number;
  stage: number;
  active: boolean;
  commitment: string;
}) {
  const names = [from, "TEE Enclave", "Solver Pool", to];
  const lanes = split
    ? Array.from(
        { length: fragments },
        (_, i) => (i - (fragments - 1) / 2) * (70 / (fragments - 1)),
      )
    : [0];
  const paths = lanes.map(
    (offset) =>
      `M79 123 H237 C290 123 280 ${123 + offset} 316 ${123 + offset} S348 123 395 123 H553`,
  );
  const logs = [
    "Deposit shielded",
    "Enclave matched the intent",
    "Preview solver filled inventory",
    "Preview delivery complete",
  ];
  return (
    <section className="panel relay">
      <header className="panel-head">
        <span>
          <Activity size={17} /> Enclave relay
        </span>
        <span className="status">
          <i />
          {active ? "RELAY ACTIVE" : "RELAY ONLINE"}
        </span>
      </header>
      <div className="relay-body">
        <div className="schematic">
          <svg
            viewBox="0 0 632 239"
            role="img"
            aria-label={`${from} through TEE Enclave and Solver Pool to ${to}, ${lanes.length} route lanes`}
          >
            <defs>
              <pattern
                id="dots"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="#b6ff00" opacity=".14" />
              </pattern>
              <radialGradient id="relay-glow">
                <stop stopColor="#83d600" stopOpacity=".18" />
                <stop offset="1" stopColor="#83d600" stopOpacity="0" />
              </radialGradient>
              <filter
                id="packet-glow"
                x="-150%"
                y="-150%"
                width="400%"
                height="400%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="632" height="239" fill="url(#dots)" />
            <ellipse
              cx="252"
              cy="123"
              rx="185"
              ry="114"
              fill="url(#relay-glow)"
            />
            <path
              d="M79 46H553 M79 196H553"
              stroke="#26321d"
              strokeDasharray="2 7"
            />
            {paths.map((path, index) => (
              <path
                key={path}
                id={`lane-${index}`}
                d={path}
                fill="none"
                stroke={active ? "#9cde28" : "#567925"}
                strokeWidth="1.4"
                strokeDasharray="4 5"
              />
            ))}
            {active && !stage && (
              <circle
                cx="79"
                cy="123"
                r="35"
                fill="none"
                stroke="#b6ff00"
                className="pulse"
              />
            )}
            {active &&
              stage >= 1 &&
              paths.map((_, index) => (
                <circle
                  key={index}
                  r="3"
                  fill="#d9ff88"
                  filter="url(#packet-glow)"
                  className="packet"
                >
                  <animateMotion
                    dur="1.8s"
                    begin={`${index * 0.09}s`}
                    repeatCount="indefinite"
                  >
                    <mpath href={`#lane-${index}`} />
                  </animateMotion>
                </circle>
              ))}
            {positions.map((x, index) => {
              const Icon = icons[index];
              return (
                <g
                  key={roles[index]}
                  transform={`translate(${x} 123)`}
                  className={
                    index === 1 || (stage >= 0 && index === stage)
                      ? "node highlight"
                      : "node"
                  }
                >
                  {index === 1 && (
                    <circle
                      r="42"
                      className="pulse"
                      fill="none"
                      stroke="#8fc726"
                      strokeDasharray="3 5"
                    />
                  )}
                  <rect
                    x="-26"
                    y="-26"
                    width="52"
                    height="52"
                    rx="10"
                    fill="#0d160b"
                    stroke="currentColor"
                  />
                  <Icon x="-12" y="-12" size={24} strokeWidth={1.6} />
                  <text y="-61" className="node-role">
                    {roles[index]}
                  </text>
                  <text y="57" className="node-name">
                    {names[index]}
                  </text>
                </g>
              );
            })}
            <text x="237" y="218" className="node-role">
              {commitment}
            </text>
          </svg>
        </div>
        <div className="legend mono">
          <span>
            <i /> Encrypted path
          </span>
          <span>
            {lanes.length} {split ? "FRAGMENTS" : "DIRECT PATH"}
          </span>
        </div>
        <div className="log">
          <div className="log-head mono">
            <span>RELAY ACTIVITY</span>
            <span>CLIENT PREVIEW</span>
          </div>
          <div aria-live="polite">
            {stage < 0 ? (
              <div className="log-row">
                <span className="log-dot" />
                <span>Enclave ready. Awaiting route intent.</span>
                <span className="mono log-stage">STANDBY</span>
              </div>
            ) : (
              stages.slice(0, stage + 1).map((item, index) => (
                <div key={item} className="log-row">
                  <span className="log-dot" />
                  <span>
                    {active && stage === index ? item + "…" : logs[index]}
                  </span>
                  <span className="mono log-stage">
                    {active && stage === index ? "RUNNING" : "OK"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
