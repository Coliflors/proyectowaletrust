import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className={cn("card card-pad", accent && "shadow-glow border-gold-500/20")}>
      <div className="flex items-center justify-between mb-3">
        <span className="label">{label}</span>
        {Icon && <Icon className={cn("size-4", accent ? "text-gold-400" : "text-ink-400")} />}
      </div>
      <div className="font-display text-3xl tracking-tight text-ink-100 break-all">{value}</div>
      {hint && <div className="mt-2 text-xs text-ink-400">{hint}</div>}
    </div>
  );
}
