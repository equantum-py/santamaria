import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
