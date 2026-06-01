import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Syne, DM_Sans, Space_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import "./globals.css";

const displayFont = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monoFont = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerForge",
  description: "Discover jobs early, track them smartly, and move faster than the market."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        data-scroll-behavior="smooth"
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
      >
        <body>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-surface-2)",
                color: "var(--color-white)",
                border: "1px solid var(--color-border)",
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                borderRadius: "10px"
              },
              success: {
                style: {
                  borderLeft: "4px solid #4ade80"
                }
              },
              error: {
                style: {
                  borderLeft: "4px solid #f87171"
                }
              }
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
