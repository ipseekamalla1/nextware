import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextWare",
  description: "NextWare ERP & Warehouse Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}