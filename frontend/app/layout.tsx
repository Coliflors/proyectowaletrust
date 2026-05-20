import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "MyPersonWallets — Bóveda Personal",
  description:
    "Tus wallets personales bajo una sola bóveda en cadena. Mover, autorizar, cobrar y dividir. Solo vos firmás.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col">
              <Topbar />
              <main className="flex-1 px-8 py-8 max-w-[1400px] w-full mx-auto">
                {children}
              </main>
              <footer className="px-8 py-6 text-center text-[11px] uppercase tracking-[0.2em] text-ink-500">
                MyPersonWallets · Private Treasury Console
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
