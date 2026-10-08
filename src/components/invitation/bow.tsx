/** Hand-drawn watercolour bow. When `untied`, its loops drift apart (guest cannot come). */
export function Bow({ untied }: { untied: boolean }) {
  return (
    <svg
      className={`bow w-[210px] overflow-visible ${untied ? "untied" : ""}`}
      viewBox="0 0 220 170"
      role="img"
      aria-label={untied ? "Moño desatado" : "Moño rosa"}
    >
      <g filter="url(#watercolor-soft)">
        <g className="tail l">
          <path
            d="M104 74 C 96 104, 82 132, 66 160 L 80 156 L 88 166 C 100 136, 108 106, 110 78 Z"
            fill="#e8bcb6"
            filter="url(#watercolor)"
          />
          <path
            d="M100 86 C 94 108, 86 128, 76 150"
            fill="none"
            stroke="#d6a19b"
            strokeWidth="1.2"
            opacity="0.6"
          />
        </g>
        <g className="tail r">
          <path
            d="M116 74 C 124 104, 138 132, 154 160 L 140 156 L 132 166 C 120 136, 112 106, 110 78 Z"
            fill="#e8bcb6"
            filter="url(#watercolor)"
          />
          <path
            d="M120 86 C 126 108, 134 128, 144 150"
            fill="none"
            stroke="#d6a19b"
            strokeWidth="1.2"
            opacity="0.6"
          />
        </g>
        <g className="half left">
          <path
            d="M108 66 C 84 34, 34 14, 16 38 C 2 58, 22 92, 58 90 C 80 89, 98 80, 108 70 Z"
            fill="#ebc3be"
            filter="url(#watercolor)"
          />
          <path
            d="M104 66 C 82 44, 48 34, 34 46"
            fill="none"
            stroke="#d6a19b"
            strokeWidth="1.4"
            opacity="0.55"
          />
          <path
            d="M100 72 C 80 80, 52 84, 36 74"
            fill="none"
            stroke="#d6a19b"
            strokeWidth="1.1"
            opacity="0.45"
          />
        </g>
        <g className="half right">
          <path
            d="M112 66 C 136 34, 186 14, 204 38 C 218 58, 198 92, 162 90 C 140 89, 122 80, 112 70 Z"
            fill="#ebc3be"
            filter="url(#watercolor)"
          />
          <path
            d="M116 66 C 138 44, 172 34, 186 46"
            fill="none"
            stroke="#d6a19b"
            strokeWidth="1.4"
            opacity="0.55"
          />
          <path
            d="M120 72 C 140 80, 168 84, 184 74"
            fill="none"
            stroke="#d6a19b"
            strokeWidth="1.1"
            opacity="0.45"
          />
        </g>
        <g className="knot">
          <ellipse
            cx="110"
            cy="70"
            rx="13"
            ry="15"
            fill="#e3b0aa"
            filter="url(#watercolor)"
          />
          <path
            d="M102 62 C 106 66, 106 76, 102 80"
            fill="none"
            stroke="#c9928b"
            strokeWidth="1.1"
            opacity="0.6"
          />
        </g>
      </g>
    </svg>
  );
}
