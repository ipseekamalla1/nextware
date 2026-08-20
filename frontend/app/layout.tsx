import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextWare",
  description: "NextWare ERP & Warehouse Management System",
};

const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("nextware-theme");
    var theme = stored === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
