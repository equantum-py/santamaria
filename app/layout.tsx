import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Materiales Santa María | Tu obra empieza acá",
  description:
    "Ferretería y materiales para construcción en Limpio. Explorá el catálogo de demostración de Materiales Santa María.",
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
