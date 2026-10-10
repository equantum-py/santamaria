import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Materiales Santa María | Tu obra empieza acá",
  description:
    "Ferretería y materiales para construcción en Limpio. Explorá el catálogo de demostración de Materiales Santa María.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3e2a23",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PY">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
