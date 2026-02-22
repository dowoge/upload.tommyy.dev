import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "upload.tommyy.dev",
  description: "Content management dashboard for upload.tommyy.dev",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="vignette" />
        {children}
      </body>
    </html>
  );
}