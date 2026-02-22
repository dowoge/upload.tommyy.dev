import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "upload.tommyy.dev",
  description: "Content management dashboard for upload.tommyy.dev",
  icons: {
    icon: "/favicon.ico",
  },
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