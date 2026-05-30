// Inline SVG pitch diagrams for the run/pitch sessions, recreating the
// diagrams from the club PDF. Each function returns an <svg> string.

function pitch(overlay) {
  return `<svg class="pitch" viewBox="0 0 300 200" role="img" aria-label="Pitch diagram">
    <defs>
      <marker id="ah" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
        <path d="M0,0 L7,3 L0,6 Z" fill="#10233a"/>
      </marker>
      <marker id="ahr" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
        <path d="M0,0 L7,3 L0,6 Z" fill="#d22"/>
      </marker>
    </defs>
    <rect x="0" y="0" width="300" height="200" rx="8" fill="#2f8f43"/>
    <g stroke="#ffffff" stroke-width="2" fill="none" opacity="0.85">
      <rect x="12" y="12" width="276" height="176" rx="3"/>
      <line x1="150" y1="12" x2="150" y2="188"/>
      <circle cx="150" cy="100" r="22"/>
      <rect x="12" y="62" width="40" height="76"/>
      <rect x="12" y="82" width="16" height="36"/>
      <rect x="248" y="62" width="40" height="76"/>
      <rect x="272" y="82" width="16" height="36"/>
    </g>
    <circle cx="150" cy="100" r="2" fill="#fff"/>
    <g stroke="#10233a" stroke-width="3" fill="none" stroke-linecap="round">${overlay}</g>
  </svg>`;
}

const DIAGRAMS = {
  // 1a — straight-line sprints of increasing length
  run1a: () => pitch(`
    <line x1="250" y1="45"  x2="206" y2="45"  marker-end="url(#ah)"/>
    <line x1="250" y1="78"  x2="180" y2="78"  marker-end="url(#ah)"/>
    <line x1="250" y1="122" x2="148" y2="122" marker-end="url(#ah)"/>
    <line x1="250" y1="155" x2="108" y2="155" marker-end="url(#ah)"/>
  `),

  // 1b — perimeter intervals (loop around the pitch)
  run1b: () => pitch(`
    <rect x="40" y="40" width="220" height="120" rx="8"/>
    <line x1="140" y1="40"  x2="166" y2="40"  marker-end="url(#ah)"/>
    <line x1="260" y1="96"  x2="260" y2="122" marker-end="url(#ah)"/>
    <line x1="160" y1="160" x2="134" y2="160" marker-end="url(#ah)"/>
    <line x1="40"  y1="104" x2="40"  y2="78"  marker-end="url(#ah)"/>
  `),

  // 2 — penalty-box run: increasing-length runs in & out of the box
  run2: () => pitch(`
    <line x1="258" y1="138" x2="258" y2="120" marker-end="url(#ah)"/>
    <line x1="268" y1="138" x2="268" y2="96"  marker-end="url(#ah)"/>
    <line x1="278" y1="138" x2="278" y2="66"  marker-end="url(#ah)"/>
    <text x="230" y="40" fill="#10233a" font-size="13" font-weight="700">Fast</text>
  `),

  // 3a — slalom sprints + a curved run around half the centre circle
  run3a: () => pitch(`
    <polyline points="252,28 272,52 252,76 272,100 252,124 272,148" marker-end="url(#ah)"/>
    <path d="M150,78 A22,22 0 0,1 150,122" marker-end="url(#ah)"/>
  `),

  // 3b — saltire run: diagonals with light-jog recovery down the ends
  run3b: () => pitch(`
    <line x1="44" y1="46" x2="256" y2="154" marker-end="url(#ah)"/>
    <line x1="256" y1="46" x2="44" y2="154" marker-end="url(#ah)"/>
    <line x1="44"  y1="150" x2="44"  y2="50"  stroke="#d22" stroke-dasharray="4 4" marker-end="url(#ahr)"/>
    <line x1="256" y1="150" x2="256" y2="50"  stroke="#d22" stroke-dasharray="4 4" marker-end="url(#ahr)"/>
    <text x="120" y="98" fill="#10233a" font-size="12" font-weight="700">80%</text>
  `),

  // 4 — every line and back: shuttles of increasing length
  run4: () => pitch(`
    <line x1="16" y1="44"  x2="60"  y2="44"  marker-end="url(#ah)"/>
    <line x1="16" y1="72"  x2="110" y2="72"  marker-end="url(#ah)"/>
    <line x1="16" y1="100" x2="158" y2="100" marker-end="url(#ah)"/>
    <line x1="16" y1="128" x2="210" y2="128" marker-end="url(#ah)"/>
    <line x1="16" y1="156" x2="284" y2="156" marker-end="url(#ah)"/>
  `),
};

export function pitchDiagram(key) {
  const fn = DIAGRAMS[key];
  return fn ? fn() : '';
}
