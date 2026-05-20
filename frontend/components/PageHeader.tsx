import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  module,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  module?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-6">
      <div>
        {module && (
          <div className="mb-2 inline-flex items-center gap-2 pill !bg-gold-500/10 !border-gold-500/20 !text-gold-400">
            {Icon && <Icon className="size-3" />}
            {module}
          </div>
        )}
        <h1 className="h-display">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-ink-300 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
