import type { Metadata } from "next";
// TypeScript may complain about side-effect CSS imports when no
// type declarations for '*.css' are present. Ignore that error here.
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "BinMap | Public Dustbin Finder",
  description: "A community-driven map for finding and contributing public dustbin locations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
