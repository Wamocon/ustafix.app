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
        {/* Construction safety glasses - bottom like L_Ʌ_⅃ (L and ⅃ have horizontal bases) */}
        <path d="M 48 128 L 152 128 L 152 166 L 140 166 L 100 152 L 60 166 L 48 166 Z" />
        <line x1="36" y1="134" x2="36" y2="158" />
        <line x1="164" y1="134" x2="164" y2="158" />
      </g>
    </svg>
  );
}
