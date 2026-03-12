import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { SerwistProvider } from "./serwist";
import { LanguageContextProvider } from "@/contexts/language-context";
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
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" }
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ustafix",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fafaf9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${font.className} antialiased`}>
        <LanguageContextProvider>
        <SerwistProvider swUrl="/serwist/sw.js">
        {children}
        </SerwistProvider>
        </LanguageContextProvider>
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
