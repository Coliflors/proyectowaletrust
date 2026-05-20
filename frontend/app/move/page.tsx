"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { ArrowRightLeft, Send, Coins, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ERC20_ABI } from "@/lib/abi";
import { useVaultWrite } from "@/lib/useVaultWrite";
import { isAddress, parseUnits } from "@/lib/utils";
import type { Address } from "viem";

export default function MovePage() {
  return (
    <div>
      <PageHeader
        module="Módulo 1"
        icon={ArrowRightLeft}
        title="Mover activos"
        description="Retirá ETH o ERC-20 de la bóveda hacia donde quieras. También podés ejecutar un batch de llamadas atómicamente."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WithdrawETHCard />
        <WithdrawERC20Card />
      </div>

      <div className="mt-6">
        <BatchCard />
      </div>
    </div>
  );
}

function WithdrawETHCard() {
  const { call, isPending, isMining } = useVaultWrite();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Retirar</div>
          <h3 className="h-section">ETH</h3>
        </div>
        <Send className="size-5 text-gold-400" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Destino</label>
          <input className="input mt-1.5" placeholder="0x…" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">Monto (ETH)</label>
          <input
            className="input mt-1.5"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          className="btn-primary flex-1"
          disabled={!isAddress(to) || !amount || isPending || isMining}
          onClick={() => call("withdrawETH", [to as Address, parseUnits(amount, 18)])}
        >
          {isPending || isMining ? "Procesando…" : "Retirar monto"}
        </button>
        <button
          className="btn-ghost"
          disabled={!isAddress(to) || isPending || isMining}
          onClick={() => call("withdrawETHAll", [to as Address])}
        >
          Todo
        </button>
      </div>
    </div>
  );
}

function WithdrawERC20Card() {
  const { call, isPending, isMining } = useVaultWrite();
  const [token, setToken] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const meta = useReadContract({
    abi: ERC20_ABI,
    address: isAddress(token) ? (token as Address) : undefined,
    functionName: "decimals",
    query: { enabled: isAddress(token) },
  });
  const sym = useReadContract({
    abi: ERC20_ABI,
    address: isAddress(token) ? (token as Address) : undefined,
    functionName: "symbol",
    query: { enabled: isAddress(token) },
  });
  const decimals = (meta.data as number | undefined) ?? 18;

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Retirar</div>
          <h3 className="h-section">ERC-20</h3>
        </div>
        <Coins className="size-5 text-gold-400" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Token</label>
          <input
            className="input mt-1.5"
            placeholder="0x… (contract address)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          {sym.data ? (
            <div className="mt-1 text-[11px] text-ink-400">
              Detectado: <span className="text-gold-400">{sym.data as string}</span> · {decimals} decimals
            </div>
          ) : null}
        </div>
        <div>
          <label className="label">Destino</label>
          <input className="input mt-1.5" placeholder="0x…" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">Monto</label>
          <input
            className="input mt-1.5"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          className="btn-primary flex-1"
          disabled={!isAddress(token) || !isAddress(to) || !amount || isPending || isMining}
          onClick={() => call("withdrawERC20", [token as Address, to as Address, parseUnits(amount, decimals)])}
        >
          {isPending || isMining ? "Procesando…" : "Retirar"}
        </button>
        <button
          className="btn-ghost"
          disabled={!isAddress(token) || !isAddress(to) || isPending || isMining}
          onClick={() => call("withdrawERC20All", [token as Address, to as Address])}
        >
          Todo
        </button>
      </div>
    </div>
  );
}

type CallRow = { target: string; value: string; data: string };

function BatchCard() {
  const { call, isPending, isMining } = useVaultWrite();
  const [rows, setRows] = useState<CallRow[]>([{ target: "", value: "0", data: "0x" }]);

  const valid = rows.every(
    (r) => isAddress(r.target) && /^0x[0-9a-fA-F]*$/.test(r.data) && /^[0-9]*\.?[0-9]*$/.test(r.value)
  );

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Avanzado</div>
          <h3 className="h-section">Batch · executeBatch</h3>
          <p className="text-xs text-ink-400 mt-1">
            Ejecuta varias llamadas atómicamente. Útil para approvals + swaps + claims.
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={() => setRows((r) => [...r, { target: "", value: "0", data: "0x" }])}
        >
          <Plus className="size-4" /> Añadir
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input
              className="input col-span-4"
              placeholder="target 0x…"
              value={r.target}
              onChange={(e) => updateRow(setRows, i, { target: e.target.value })}
            />
            <input
              className="input col-span-2"
              placeholder="value (ETH)"
              value={r.value}
              onChange={(e) => updateRow(setRows, i, { value: e.target.value })}
            />
            <input
              className="input col-span-5"
              placeholder="data 0x…"
              value={r.data}
              onChange={(e) => updateRow(setRows, i, { data: e.target.value })}
            />
            <button
              className="btn-ghost col-span-1 !px-0"
              onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              disabled={rows.length === 1}
              aria-label="Eliminar"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <button
          className="btn-primary"
          disabled={!valid || isPending || isMining}
          onClick={() => {
            const totalValue = rows.reduce((acc, r) => acc + parseUnits(r.value || "0", 18), 0n);
            const calls = rows.map((r) => ({
              target: r.target as Address,
              value: parseUnits(r.value || "0", 18),
              data: r.data as `0x${string}`,
            }));
            call("executeBatch", [calls], totalValue);
          }}
        >
          {isPending || isMining ? "Procesando…" : "Ejecutar batch"}
        </button>
      </div>
    </div>
  );
}

function updateRow(
  setRows: (fn: (rs: CallRow[]) => CallRow[]) => void,
  i: number,
  patch: Partial<CallRow>
) {
  setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
}
