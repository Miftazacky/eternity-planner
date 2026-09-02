import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eternity Planner",
  description: "Wedding Management SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#FDFBF7] text-[#2C3E50]`}>
        <div className="flex min-h-screen">
          {/* Sidebar Samping */}
          <Sidebar />
          
          {/* Area Konten Utama (Diberi margin-left 64 agar tidak tertutup Sidebar) */}
          <main className="flex-1 ml-64 p-8 bg-[#FDFBF7]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}