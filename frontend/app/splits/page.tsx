"use client";

import { useEffect, useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import { Split, Plus, Trash2, Send, Coins, Save } from "lucide-react";
import type { Address } from "viem";
import { PageHeader } from "@/components/PageHeader";
import { ASSET_VAULT_ABI, ERC20_ABI } from "@/lib/abi";
import { useVaultWrite } from "@/lib/useVaultWrite";
import { isAddress, parseUnits, fmt } from "@/lib/utils";
import { VAULT_ADDRESS } from "@/lib/contracts";

type Row = { to: string; bps: string };

export default function SplitsPage() {
  return (
    <div>
      <PageHeader
        module="Módulo 4"
        icon={Split}
        title="División de fondos"
        description="Configurá hasta N destinatarios con porcentajes en bps (10000 = 100%) y distribuí ETH o ERC-20 con un solo click."
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SplitsEditor />
        </div>
        <div>
          <DistributeCard />
        </div>
      </div>
    </div>
  );
}

function SplitsEditor() {
  const { call, isPending, isMining } = useVaultWrite();
  const current = useReadContract({
    abi: ASSET_VAULT_ABI,
    address: VAULT_ADDRESS,
    functionName: "getSplits",
  });

  const [rows, setRows] = useState<Row[]>([{ to: "", bps: "10000" }]);

  useEffect(() => {
    if (Array.isArray(current.data) && current.data.length > 0) {
      setRows(
        (current.data as { to: Address; bps: bigint }[]).map((r) => ({
          to: r.to,
          bps: r.bps.toString(),
        }))
      );
    }
  }, [current.data]);

  const total = rows.reduce((acc, r) => acc + (Number(r.bps) || 0), 0);
  const valid = rows.length > 0 && rows.every((r) => isAddress(r.to) && Number(r.bps) > 0) && total === 10000;

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Destinatarios</div>
          <h3 className="h-section">Configuración de splits</h3>
          <p className="text-xs text-ink-400 mt-1">La suma de todos los bps debe ser exactamente 10000.</p>
        </div>
        <button className="btn-ghost" onClick={() => setRows((r) => [...r, { to: "", bps: "" }])}>
          <Plus className="size-4" /> Añadir
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input
              className="input col-span-7"
              placeholder="0x… destino"
              value={r.to}
              onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))}
            />
            <div className="col-span-3 relative">
              <input
                className="input pr-12"
                placeholder="bps"
                value={r.bps}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, bps: e.target.value } : x)))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">
                {((Number(r.bps) || 0) / 100).toFixed(2)}%
              </span>
            </div>
            <button
              className="btn-ghost col-span-2 !px-0 justify-center"
              onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs))}
              disabled={rows.length === 1}
              aria-label="Eliminar"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm">
          <span className="label mr-2">Total</span>
          <span className={total === 10000 ? "text-emerald-400" : "text-red-300"}>
            {total} bps · {(total / 100).toFixed(2)}%
          </span>
        </div>
        <button
          className="btn-primary"
          disabled={!valid || isPending || isMining}
          onClick={() =>
            call("setSplits", [
              rows.map((r) => ({ to: r.to as Address, bps: BigInt(r.bps) })),
            ])
          }
        >
          <Save className="size-4" />
          {isPending || isMining ? "Procesando…" : "Guardar splits"}
        </button>
      </div>
    </div>
  );
}

function DistributeCard() {
  const { call, isPending, isMining } = useVaultWrite();
  const [tab, setTab] = useState<"eth" | "erc20">("eth");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");

  const dec = useReadContract({
    abi: ERC20_ABI,
    address: tab === "erc20" && isAddress(token) ? (token as Address) : undefined,
    functionName: "decimals",
    query: { enabled: tab === "erc20" && isAddress(token) },
  });

  const decimals = useMemo(() => (dec.data as number | undefined) ?? 18, [dec.data]);

  return (
    <div className="card card-pad">
      <div className="label">Distribuir</div>
      <h3 className="h-section">Pagar a los destinos</h3>

      <div className="mt-4 inline-flex rounded-lg border border-white/10 bg-navy-950/60 p-1">
        <button
          className={`px-3 py-1.5 text-xs rounded-md transition ${tab === "eth" ? "bg-gold-500/15 text-gold-400" : "text-ink-300 hover:text-ink-100"}`}
          onClick={() => setTab("eth")}
        >
          ETH
        </button>
        <button
          className={`px-3 py-1.5 text-xs rounded-md transition ${tab === "erc20" ? "bg-gold-500/15 text-gold-400" : "text-ink-300 hover:text-ink-100"}`}
          onClick={() => setTab("erc20")}
        >
          ERC-20
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {tab === "erc20" && (
          <div>
            <label className="label">Token</label>
            <input className="input mt-1.5" value={token} onChange={(e) => setToken(e.target.value)} placeholder="0x…" />
          </div>
        )}
        <div>
          <label className="label">Monto (vacío = todo)</label>
          <input className="input mt-1.5" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          className="btn-primary"
          disabled={isPending || isMining || (tab === "erc20" && !isAddress(token))}
          onClick={() => {
            if (tab === "eth") {
              if (amount) call("distributeETH", [parseUnits(amount, 18)]);
              else call("distributeAllETH", []);
            } else {
              if (amount) call("distributeERC20", [token as Address, parseUnits(amount, decimals)]);
              else call("distributeAllERC20", [token as Address]);
            }
          }}
        >
          {tab === "eth" ? <Send className="size-4" /> : <Coins className="size-4" />}
          {amount ? "Distribuir" : "Distribuir todo"}
        </button>
        <div className="text-[11px] text-ink-400 self-center leading-tight">
          La distribución se hace según los splits guardados.
        </div>
      </div>
    </div>
  );
}

// keep fmt import used (avoid TS unused-warning)
void fmt;
