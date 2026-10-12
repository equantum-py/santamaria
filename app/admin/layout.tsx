import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./admin.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-admin-inter",
});

export const metadata: Metadata = {
  title: "Santa María Admin — Demo",
  description: "Panel administrativo de demostración de Santa María Ferretería y Materiales.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={inter.variable}>{children}</div>;
}
