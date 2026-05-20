"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { shortAddr } from "@/lib/utils";

export function AddressPill({ address, label }: { address?: string | null; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!address) return <span className="pill">—</span>;
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="pill hover:!bg-white/10 transition group"
      title={address}
    >
      {label && <span className="text-ink-400 normal-case tracking-normal">{label}:</span>}
      <span className="mono text-ink-100">{shortAddr(address)}</span>
      {copied ? (
        <Check className="size-3 text-gold-400" />
      ) : (
        <Copy className="size-3 text-ink-400 group-hover:text-ink-100" />
      )}
    </button>
  );
}
