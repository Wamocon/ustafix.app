import { SVGProps } from "react";

/** Ustafix logo: hard hat, safety goggles - gradient background, white outline. */
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

      {/* Ridge - orange fill, white border (drawn first so dome connects to it) */}
      <rect x="88" y="50" width="24" height="40" rx="10" fill="url(#ustafixBgGrad)" stroke="#FFFFFF" strokeWidth="7" className="ustafix-helmet" />

      <g fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <g className="ustafix-helmet">
          {/* Dome - arcs end at ridge edges (88, 112), no line across sausage */}
          <path d="M 42 100 A 68 38 0 0 1 88 62" />
          <path d="M 112 62 A 68 38 0 0 1 158 100" />
          <rect x="35" y="100" width="130" height="12" rx="6" />
        </g>
        {/* Safety glasses - rounded frame, smooth inverted V at bottom (nose bridge) */}
        <path d="M 44 128 Q 100 124 156 128 Q 168 138 168 164 Q 140 168 100 152 Q 60 168 32 164 Q 32 138 44 128 Z" />
        <line x1="28" y1="138" x2="28" y2="158" />
        <line x1="172" y1="138" x2="172" y2="158" />
      </g>
    </svg>
  );
}
