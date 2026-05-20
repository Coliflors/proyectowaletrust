"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChainBadge } from "./ChainBadge";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-900/60 backdrop-blur">
      <div className="px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="label">Consola</span>
          <span className="text-ink-500">/</span>
          <span className="text-sm text-ink-200">Bóveda Personal</span>
        </div>
        <div className="flex items-center gap-3">
          <ChainBadge />
          <ConnectButton
            showBalance={{ smallScreen: false, largeScreen: true }}
            chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </div>
      </div>
    </header>
  );
}
