import { SVGProps } from "react";

/** Ustafix logo: hard hat with safety goggles - gradient background, white outline. */
export function UstafixLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="ustafixBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFA836" />
          <stop offset="100%" stopColor="#E86E00" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="200" height="200" rx="45" fill="url(#ustafixBgGrad)" />

      <g fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        {/* Helmet - scaled taller via CSS */}
        <g className="ustafix-helmet">
          {/* Ridge - filled to close gap at top */}
          <rect x="88" y="50" width="24" height="40" rx="10" fill="#FFFFFF" />
          {/* Dome - single path, no overlap at top */}
          <path d="M 42 100 A 68 38 0 0 1 90 58 L 110 58 A 68 38 0 0 1 158 100" />
          {/* Brim - meets dome cleanly at y=100 */}
          <rect x="35" y="100" width="130" height="12" rx="6" />
        </g>
        <path
          d="
      M 65 124
      L 135 124
      A 10 10 0 0 1 145 134
      L 145 144
      A 15 15 0 0 1 130 159
      L 115 159
      A 15 15 0 0 1 100 144
      A 15 15 0 0 1 85 159
      L 70 159
      A 15 15 0 0 1 55 144
      L 55 134
      A 10 10 0 0 1 65 124
      Z
    "
        />
        <line x1="48" y1="134" x2="48" y2="144" />
        <line x1="152" y1="134" x2="152" y2="144" />
      </g>
    </svg>
  );
}
