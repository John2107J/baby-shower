/** Shared SVG filters (watercolour look) and the small bow used in the celebration. */
export function WatercolorDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="watercolor" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves={3}
            seed={4}
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale={7}
            result="edges"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.09"
            numOctaves={2}
            seed={9}
            result="grain"
          />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.15"
            result="mottle"
          />
          <feComposite in="edges" in2="mottle" operator="in" result="pigment" />
          <feGaussianBlur in="pigment" stdDeviation={0.4} />
        </filter>
        <filter
          id="watercolor-soft"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves={2}
            seed={2}
            result="warp"
          />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={4} />
        </filter>
        <g id="mini-bow">
          <path d="M13 9 C 6 1, 0 3, 1 9 C 0 15, 6 17, 13 9 Z" fill="#ebc3be" />
          <path
            d="M13 9 C 20 1, 26 3, 25 9 C 26 15, 20 17, 13 9 Z"
            fill="#e3b4ae"
          />
          <circle cx="13" cy="9" r="2.6" fill="#d6a19b" />
        </g>
      </defs>
    </svg>
  );
}
