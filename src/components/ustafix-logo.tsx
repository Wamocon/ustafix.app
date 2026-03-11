import { SVGProps } from "react";

/** Ustafix logo: hard hat with safety goggles on gradient background. */
export function UstafixLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="100%"
      height="100%"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="ustafixBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#E8870E" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="112" fill="url(#ustafixBg)" />

      {/* Helmet dome: elliptical arc for proper hard hat shape */}
      <path
        d="M 92 225 A 164 145 0 0 1 420 225"
        fill="none" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round"
      />

      {/* Ridge / vent capsule on dome top */}
      <rect
        x="234" y="54" width="44" height="130" rx="22"
        fill="url(#ustafixBg)" stroke="#FFFFFF" strokeWidth="14"
      />

      {/* Helmet brim */}
      <rect
        x="76" y="226" width="360" height="22" rx="11"
        fill="none" stroke="#FFFFFF" strokeWidth="14"
        strokeLinecap="round" strokeLinejoin="round"
      />

      <g fill="none" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
        {/* Goggles */}
        <path d="
          M 130 278
          Q 256 266 382 278
          Q 424 278 424 318
          L 424 344
          Q 424 382 386 382
          L 314 382
          C 282 382 282 342 256 342
          C 230 342 230 382 198 382
          L 126 382
          Q 88 382 88 344
          L 88 318
          Q 88 278 130 278
          Z
        " />

        {/* Goggle side arms */}
        <line x1="74" y1="310" x2="74" y2="348" />
        <line x1="438" y1="310" x2="438" y2="348" />
      </g>
    </svg>
  );
}
