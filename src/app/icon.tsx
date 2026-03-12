import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon / app icon: same logo as UstafixLogo (helmet + goggles on orange gradient).
 * Generated at build time so the tab bar shows the correct logo.
 */
export default function Icon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#F5A623"/><stop offset="100%" stop-color="#E8870E"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><path d="M 92 225 A 164 145 0 0 1 420 225" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/><rect x="234" y="54" width="44" height="130" rx="22" fill="url(#g)" stroke="#fff" stroke-width="14"/><rect x="76" y="226" width="360" height="22" rx="11" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M 130 278 Q 256 266 382 278 Q 424 278 424 318 L 424 344 Q 424 382 386 382 L 314 382 C 282 382 282 342 256 342 C 230 342 230 382 198 382 L 126 382 Q 88 382 88 344 L 88 318 Q 88 278 130 278 Z" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><line x1="74" y1="310" x2="74" y2="348" stroke="#fff" stroke-width="14" stroke-linecap="round"/><line x1="438" y1="310" x2="438" y2="348" stroke="#fff" stroke-width="14" stroke-linecap="round"/></svg>`;
  const src = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "22%",
          overflow: "hidden",
          background: "linear-gradient(to bottom, #F5A623, #E8870E)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={32} height={32} style={{ display: "block" }} />
      </div>
    ),
    { ...size }
  );
}
