"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { ReceiptText, Plus, X, CheckCircle2, Hourglass, Coins, Send } from "lucide-react";
import type { Address } from "viem";
import { PageHeader } from "@/components/PageHeader";
import { ASSET_VAULT_ABI, ERC20_ABI } from "@/lib/abi";
import { useVaultWrite } from "@/lib/useVaultWrite";
import { isAddress, parseUnits, toBytes32, fmt } from "@/lib/utils";
import { VAULT_ADDRESS, ZERO_ADDRESS } from "@/lib/contracts";

export default function ChargePage() {
  return (
    <div>
      <PageHeader
        module="Módulo 3"
        icon={ReceiptText}
        title="Cobrar (Invoices)"
        description="Creá facturas en cadena en ETH o ERC-20. El pagador puede liquidar directamente o vos podés cobrar con su firma de Permit."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CreateInvoiceCard />
        <LookupInvoiceCard />
      </div>
    </div>
  );
}

function CreateInvoiceCard() {
  const { call, isPending, isMining } = useVaultWrite();
  const [label, setLabel] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [hours, setHours] = useState("24");
  const isETH = !token || token.toLowerCase() === "eth";

  const decimals = useReadContract({
    abi: ERC20_ABI,
    address: !isETH && isAddress(token) ? (token as Address) : undefined,
    functionName: "decimals",
    query: { enabled: !isETH && isAddress(token) },
  });
  const dec = (decimals.data as number | undefined) ?? 18;

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Crear</div>
          <h3 className="h-section">Nueva invoice</h3>
        </div>
        <Plus className="size-5 text-gold-400" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">ID / Etiqueta</label>
          <input
            className="input mt-1.5"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ej: factura-001"
          />
          {label && (
            <div className="mt-1 mono text-[11px] text-ink-400 break-all">
              bytes32: <span className="text-gold-400">{toBytes32(label)}</span>
            </div>
          )}
        </div>
        <div>
          <label className="label">Token</label>
          <input
            className="input mt-1.5"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ETH o 0x… (vacío = ETH)"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Monto</label>
            <input className="input mt-1.5" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
          </div>
          <div>
            <label className="label">Vence en (h)</label>
            <input className="input mt-1.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0 = sin venc." />
          </div>
        </div>
        <div>
          <label className="label">Pagador (opcional)</label>
          <input
            className="input mt-1.5"
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            placeholder="0x… (vacío = abierto a cualquiera)"
          />
        </div>
      </div>

      <div className="mt-5">
        <button
          className="btn-primary w-full"
          disabled={!label || !amount || (token && !isETH && !isAddress(token)) || (payer && !isAddress(payer)) || isPending || isMining}
          onClick={() => {
            const id = toBytes32(label);
            const tokenAddr = isETH ? ZERO_ADDRESS : (token as Address);
            const value = parseUnits(amount, isETH ? 18 : dec);
            const payerAddr = payer && isAddress(payer) ? (payer as Address) : ZERO_ADDRESS;
            const dl = Number(hours) > 0 ? BigInt(Math.floor(Date.now() / 1000) + Number(hours) * 3600) : 0n;
            call("createInvoice", [id, tokenAddr, value, payerAddr, dl]);
          }}
        >
          {isPending || isMining ? "Procesando…" : "Crear invoice"}
        </button>
      </div>
    </div>
  );
}

function LookupInvoiceCard() {
  const { call, isPending, isMining } = useVaultWrite();
  const [label, setLabel] = useState("");
  const id = label ? toBytes32(label) : undefined;

  const inv = useReadContract({
    abi: ASSET_VAULT_ABI,
    address: VAULT_ADDRESS,
    functionName: "invoices",
    args: id ? [id] : undefined,
    query: { enabled: !!id },
  });

  const data = inv.data as
    | readonly [Address, bigint, Address, bigint, boolean, boolean]
    | undefined;
  const exists = data && data[1] > 0n;
  const isETH = data && data[0] === ZERO_ADDRESS;

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Consultar / Pagar</div>
          <h3 className="h-section">Buscar invoice</h3>
        </div>
        <ReceiptText className="size-5 text-gold-400" />
      </div>

      <div>
        <label className="label">ID / Etiqueta</label>
        <input className="input mt-1.5" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ej: factura-001" />
      </div>

      {!exists && label && (
        <div className="mt-4 p-3 rounded-lg border border-white/5 text-sm text-ink-400">
          No existe invoice con ese ID.
        </div>
      )}

      {exists && data && (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Token" value={isETH ? "ETH" : <span className="mono">{data[0]}</span>} />
            <Field label="Monto" value={`${fmt(data[1], 18, 6)}${isETH ? " ETH" : ""}`} />
            <Field label="Pagador" value={data[2] === ZERO_ADDRESS ? "Cualquiera" : <span className="mono">{data[2]}</span>} />
            <Field
              label="Estado"
              value={
                data[5] ? (
                  <Badge tone="red"><X className="size-3" /> Cancelada</Badge>
                ) : data[4] ? (
                  <Badge tone="emerald"><CheckCircle2 className="size-3" /> Pagada</Badge>
                ) : (
                  <Badge tone="gold"><Hourglass className="size-3" /> Pendiente</Badge>
                )
              }
            />
          </div>

          {!data[4] && !data[5] && (
            <div className="flex flex-wrap gap-2 pt-2">
              {isETH ? (
                <button
                  className="btn-primary"
                  disabled={isPending || isMining}
                  onClick={() => call("payInvoiceETH", [id!], data[1])}
                >
                  <Send className="size-4" /> Pagar en ETH
                </button>
              ) : (
                <button
                  className="btn-primary"
                  disabled={isPending || isMining}
                  onClick={() => call("payInvoiceERC20", [id!])}
                >
                  <Coins className="size-4" /> Pagar ERC-20 (necesita allowance)
                </button>
              )}
              <button
                className="btn-danger"
                disabled={isPending || isMining}
                onClick={() => call("cancelInvoice", [id!])}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/5 bg-navy-950/50 p-3">
      <div className="label mb-1">{label}</div>
      <div className="text-ink-100 text-sm break-all">{value}</div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "red" | "gold"; children: React.ReactNode }) {
  const map = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
    gold: "border-gold-500/30 bg-gold-500/10 text-gold-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider border ${map[tone]}`}>
      {children}
    </span>
  );
}
