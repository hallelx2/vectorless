/**
 * Vectorless "document → tree → cited answer" motif.
 *
 * On-brand, hand-built SVG (no chart library): a document on the left, its
 * structure parsed into a hairline node-graph in the middle, and a cited
 * answer node on the right. Edges draw in (stroke-dashoffset) and nodes snap
 * (DESIGN.md motion). Pure light surface — hairline #E5E7EB, brand blue
 * #1456F0 on the navigated path, pink #EA5EC1 on the single cited node.
 */
export function TreewalkMotif() {
  return (
    <svg
      viewBox="0 0 720 260"
      fill="none"
      role="img"
      aria-label="A document is parsed into a hierarchical tree; an agent walks the tree to a cited answer."
      className="vl-motif h-auto w-full"
    >
      {/* ---- 1 · Document ---- */}
      <g>
        <rect
          x="40"
          y="58"
          width="116"
          height="144"
          rx="8"
          fill="#ffffff"
          stroke="#e5e7eb"
        />
        {/* page lines — the muted ones, plus two "matched" blue lines */}
        {[78, 92, 106, 134, 148, 176].map((y, i) => (
          <rect
            key={y}
            x="56"
            y={y}
            width={i % 3 === 1 ? 64 : 84}
            height="4"
            rx="2"
            fill="#eef0f3"
          />
        ))}
        <rect x="56" y="120" width="84" height="4" rx="2" fill="#1456f0" opacity="0.85" />
        <rect x="56" y="162" width="58" height="4" rx="2" fill="#1456f0" opacity="0.85" />
        <text
          x="98"
          y="222"
          textAnchor="middle"
          className="vl-motif-label"
          fill="#71717a"
          fontSize="9"
          fontFamily="var(--font-mono)"
          letterSpacing="1.4"
        >
          DOCUMENT
        </text>
      </g>

      {/* ---- connector: document → tree root ---- */}
      <path
        className="vl-edge"
        style={{ ['--vl-edge-delay' as string]: '0.35s' }}
        d="M156 130 H236"
        stroke="#cdd3dc"
        strokeWidth="1.5"
      />

      {/* ---- 2 · Parsed tree (the navigable map) ---- */}
      {/* edges — the blue ones trace the agent's walked path */}
      <g strokeWidth="1.5" fill="none">
        <path className="vl-edge" style={{ ['--vl-edge-delay' as string]: '0.5s' }} d="M260 130 C320 130, 320 70, 386 70" stroke="#e5e7eb" />
        <path className="vl-edge" style={{ ['--vl-edge-delay' as string]: '0.55s' }} d="M260 130 C320 130, 320 130, 386 130" stroke="#1456f0" />
        <path className="vl-edge" style={{ ['--vl-edge-delay' as string]: '0.6s' }} d="M260 130 C320 130, 320 190, 386 190" stroke="#e5e7eb" />
        <path className="vl-edge" style={{ ['--vl-edge-delay' as string]: '0.75s' }} d="M410 130 C452 130, 452 104, 500 104" stroke="#1456f0" />
        <path className="vl-edge" style={{ ['--vl-edge-delay' as string]: '0.8s' }} d="M410 130 C452 130, 452 156, 500 156" stroke="#e5e7eb" />
      </g>

      {/* nodes */}
      <g>
        <circle className="vl-node" style={{ ['--vl-node-delay' as string]: '0.55s' }} cx="248" cy="130" r="7" fill="#1456f0" />
        <circle className="vl-node" style={{ ['--vl-node-delay' as string]: '0.75s' }} cx="392" cy="70" r="5.5" fill="#ffffff" stroke="#cdd3dc" strokeWidth="1.5" />
        <circle className="vl-node" style={{ ['--vl-node-delay' as string]: '0.8s' }} cx="398" cy="130" r="6.5" fill="#1456f0" />
        <circle className="vl-node" style={{ ['--vl-node-delay' as string]: '0.85s' }} cx="392" cy="190" r="5.5" fill="#ffffff" stroke="#cdd3dc" strokeWidth="1.5" />
        <circle className="vl-node" style={{ ['--vl-node-delay' as string]: '1s' }} cx="506" cy="104" r="6" fill="#1456f0" />
        <circle className="vl-node" style={{ ['--vl-node-delay' as string]: '1.05s' }} cx="506" cy="156" r="5.5" fill="#ffffff" stroke="#cdd3dc" strokeWidth="1.5" />
      </g>
      <text
        x="300"
        y="232"
        textAnchor="middle"
        fill="#71717a"
        fontSize="9"
        fontFamily="var(--font-mono)"
        letterSpacing="1.4"
      >
        TREEWALK
      </text>

      {/* ---- connector: walked leaf → cited answer ---- */}
      <path
        className="vl-edge"
        style={{ ['--vl-edge-delay' as string]: '1.2s' }}
        d="M512 104 C548 104, 548 92, 584 92"
        stroke="#1456f0"
        strokeWidth="1.5"
      />

      {/* ---- 3 · Cited answer ---- */}
      <g>
        <rect
          x="584"
          y="62"
          width="96"
          height="60"
          rx="8"
          fill="#ffffff"
          stroke="#e5e7eb"
        />
        <rect x="598" y="78" width="60" height="4" rx="2" fill="#1456f0" opacity="0.85" />
        <rect x="598" y="90" width="68" height="4" rx="2" fill="#eef0f3" />
        <rect x="598" y="102" width="44" height="4" rx="2" fill="#eef0f3" />
        {/* the focal pink citation dot — the single accent */}
        <circle className="vl-node" style={{ ['--vl-node-delay' as string]: '1.4s' }} cx="676" cy="118" r="4" fill="#ea5ec1" />
        <text
          x="632"
          y="150"
          textAnchor="middle"
          fill="#71717a"
          fontSize="9"
          fontFamily="var(--font-mono)"
          letterSpacing="1.4"
        >
          CITED ANSWER
        </text>
      </g>
    </svg>
  );
}
