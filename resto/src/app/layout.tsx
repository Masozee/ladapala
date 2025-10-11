import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ladapala POS - Sistem Kasir Restaurant",
  description: "Sistem Point of Sale untuk Restaurant Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Script
          src="https://fonts.googleapis.com/css2?family=Zalando+Sans:ital,wght@0,200..900;1,200..900&display=swap"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
