"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  PenLine,
  ReceiptText,
  Split,
  ShieldCheck,
} from "lucide-react";
import { BrandMark, BrandWord } from "./Brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, hint: "Panel general" },
  { href: "/move", label: "Move", icon: ArrowRightLeft, hint: "Mover activos" },
  { href: "/permit", label: "Permit", icon: PenLine, hint: "Firmas EIP-2612 / Permit2" },
  { href: "/charge", label: "Charge", icon: ReceiptText, hint: "Cobrar invoices" },
  { href: "/splits", label: "Splits", icon: Split, hint: "División de fondos" },
  { href: "/owner", label: "Owner", icon: ShieldCheck, hint: "Gobernanza" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/5 bg-navy-900/40 backdrop-blur">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/5">
        <BrandMark size={36} />
        <div className="flex flex-col leading-tight">
          <BrandWord className="text-lg" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink-400 mt-0.5">
            Private Treasury
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, hint }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                active
                  ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                  : "text-ink-300 hover:text-ink-100 hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className={cn("size-4", active ? "text-gold-400" : "text-ink-400 group-hover:text-ink-100")} />
              <div className="flex flex-col">
                <span className="text-sm font-medium tracking-wide">{label}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-500">{hint}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-5 border-t border-white/5">
        <div className="card card-pad !p-4 text-[11px] text-ink-300 leading-relaxed">
          <div className="label mb-2">Recordatorio</div>
          El dueño de la bóveda es <span className="text-gold-400">vos</span>. Las firmas
          se generan localmente — nunca se envían claves a ningún servidor.
        </div>
      </div>
    </aside>
  );
}
