import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { SerwistProvider } from "./serwist";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Ustafix.app",
  description:
    "Mängel erfassen, verwalten und verfolgen – direkt von der Baustelle.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ustafix",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${font.className} antialiased`}>
        <SerwistProvider swUrl="/serwist/sw.js">
        {children}
        </SerwistProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "text-sm font-medium rounded-xl shadow-lg",
            duration: 2500,
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
