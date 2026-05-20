"use client";

import { useChainId } from "wagmi";
import { chains } from "@/lib/wagmi";
import { Globe } from "lucide-react";

export function ChainBadge() {
  const id = useChainId();
  const c = chains.find((x) => x.id === id);
  return (
    <span className="pill">
      <Globe className="size-3 text-gold-400" />
      {c?.name ?? "Sin red"}
    </span>
  );
}
