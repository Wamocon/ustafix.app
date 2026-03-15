"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function shouldShowBadge(pathname: string): boolean {
  const path = pathname.toLowerCase();

  if (
    path.startsWith("/api") ||
    path.startsWith("/serwist") ||
    path === "/icon" ||
    path === "/_not-found" ||
    path === "/~offline"
  ) {
    return false;
  }

  return true;
}

export function DevelopedInGermanyBadge() {
  const pathname = usePathname() ?? "/";

  if (!shouldShowBadge(pathname)) return null;

  const authLikePath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/invite/");

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center",
        authLikePath
          ? "bottom-4"
          : "bottom-24 lg:bottom-4 lg:pl-64"
      )}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-background/80 px-3 py-2 backdrop-blur-sm">
        <svg
          width="72"
          height="72"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <circle cx="100" cy="100" r="96" stroke="#1a1a1a" strokeWidth="4" />
          <circle cx="100" cy="100" r="86" stroke="#1a1a1a" strokeWidth="2" />
          <polygon
            points="100,28 106,46 124,46 110,56 115,74 100,64 85,74 90,56 76,46 94,46"
            fill="#1a1a1a"
          />
          <path id="sealTextTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
          <text
            fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
            fontSize="18"
            fontWeight="700"
            letterSpacing="4"
            fill="#1a1a1a"
          >
            <textPath href="#sealTextTop" startOffset="50%" textAnchor="middle">
              ENTWICKELT IN
            </textPath>
          </text>
          <path id="sealTextBot" d="M 28,108 A 72,72 0 0,0 172,108" fill="none" />
          <text
            fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
            fontSize="18"
            fontWeight="700"
            letterSpacing="4"
            fill="#1a1a1a"
          >
            <textPath href="#sealTextBot" startOffset="50%" textAnchor="middle">
              DEUTSCHLAND
            </textPath>
          </text>
          <rect x="70" y="82" width="60" height="8" rx="1" fill="#000" />
          <rect x="70" y="90" width="60" height="8" fill="#DD0000" />
          <rect x="70" y="98" width="60" height="8" rx="1" fill="#FFCC00" />
        </svg>

        <span className="text-[18px] font-semibold tracking-[0.01em] text-muted-foreground">
          Entwickelt in Deutschland
        </span>
      </div>
    </div>
  );
}
