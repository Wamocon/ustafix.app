"use client";

import { useId } from "react";
import { useTranslation } from "@/hooks/use-translations";

const STAMP_COLOR = "#1a1a1a";

interface GermanyStampProps {
  className?: string;
  size?: number;
  showLabel?: boolean;
}

/** "Entwickelt in Deutschland" stamp – arc text and label in current language (DE/RU/TR). */
export function GermanyStamp({
  className = "",
  size = 38,
  showLabel = true,
}: GermanyStampProps) {
  const t = useTranslation();
  const id = useId().replace(/:/g, "");
  const topId = `sealTextTop-${id}`;
  const botId = `sealTextBot-${id}`;

  const topText = t("landing.stampTop");
  const bottomText = t("landing.stampBottom");
  const label = t("landing.stampLabel");

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r="96"
          stroke={STAMP_COLOR}
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke={STAMP_COLOR}
          strokeWidth="2"
          fill="none"
        />
        <g opacity="0.7">
          <path
            d="M38 140 C42 128, 40 115, 35 105"
            stroke={STAMP_COLOR}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="33"
            cy="108"
            rx="6"
            ry="10"
            transform="rotate(-20 33 108)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <ellipse
            cx="36"
            cy="120"
            rx="6"
            ry="10"
            transform="rotate(-10 36 120)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <ellipse
            cx="37"
            cy="132"
            rx="6"
            ry="10"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <path
            d="M38 140 C34 128, 28 118, 22 110"
            stroke={STAMP_COLOR}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="22"
            cy="114"
            rx="5"
            ry="9"
            transform="rotate(-30 22 114)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <ellipse
            cx="27"
            cy="125"
            rx="5"
            ry="9"
            transform="rotate(-15 27 125)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
        </g>
        <g opacity="0.7" transform="scale(-1,1) translate(-200,0)">
          <path
            d="M38 140 C42 128, 40 115, 35 105"
            stroke={STAMP_COLOR}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="33"
            cy="108"
            rx="6"
            ry="10"
            transform="rotate(-20 33 108)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <ellipse
            cx="36"
            cy="120"
            rx="6"
            ry="10"
            transform="rotate(-10 36 120)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <ellipse
            cx="37"
            cy="132"
            rx="6"
            ry="10"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <path
            d="M38 140 C34 128, 28 118, 22 110"
            stroke={STAMP_COLOR}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="22"
            cy="114"
            rx="5"
            ry="9"
            transform="rotate(-30 22 114)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
          <ellipse
            cx="27"
            cy="125"
            rx="5"
            ry="9"
            transform="rotate(-15 27 125)"
            fill="none"
            stroke={STAMP_COLOR}
            strokeWidth="2"
          />
        </g>
        <polygon
          points="100,28 106,46 124,46 110,56 115,74 100,64 85,74 90,56 76,46 94,46"
          fill={STAMP_COLOR}
        />
        <path id={topId} d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
        <text
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="18"
          fontWeight="700"
          letterSpacing="4"
          fill={STAMP_COLOR}
        >
          <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">
            {topText}
          </textPath>
        </text>
        <path id={botId} d="M 28,108 A 72,72 0 0,0 172,108" fill="none" />
        <text
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="18"
          fontWeight="700"
          letterSpacing="4"
          fill={STAMP_COLOR}
        >
          <textPath href={`#${botId}`} startOffset="50%" textAnchor="middle">
            {bottomText}
          </textPath>
        </text>
        <rect x="70" y="82" width="60" height="8" rx="1" fill="#000" />
        <rect x="70" y="90" width="60" height="8" fill="#DD0000" />
        <rect x="70" y="98" width="60" height="8" rx="1" fill="#FFCC00" />
      </svg>
      {showLabel && (
        <span className="text-[13px] tracking-[0.02em] font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
