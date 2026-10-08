import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// Deliberately not using next/font/google here: it fetches the font files
// from fonts.googleapis.com at build time, which turns a blocked/offline
// network into a broken production build. globals.css already falls back
// to the system sans-serif stack. Revisit with next/font/local (bundled
// font files, no network dependency) during a later visual-design pass.

export const metadata: Metadata = {
  title: {
    default: "Immo Tunisia",
    template: "%s",
  },
  description:
    "List, search, and discover properties for sale or rent across Tunisia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
