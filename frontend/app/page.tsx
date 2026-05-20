"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import {
  LayoutDashboard,
  Wallet,
  Coins,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { AddressPill } from "@/components/AddressPill";
import { ASSET_VAULT_ABI } from "@/lib/abi";
import { VAULT_ADDRESS, ZERO_ADDRESS } from "@/lib/contracts";
import { fmt } from "@/lib/utils";

export default function DashboardPage() {
  const { address: me } = useAccount();
  const vaultConfigured = VAULT_ADDRESS !== ZERO_ADDRESS;

  const ethBal = useBalance({ address: vaultConfigured ? VAULT_ADDRESS : undefined });

  const owner = useReadContract({
    abi: ASSET_VAULT_ABI,
    address: VAULT_ADDRESS,
    functionName: "owner",
    query: { enabled: vaultConfigured },
  });

  const splits = useReadContract({
    abi: ASSET_VAULT_ABI,
    address: VAULT_ADDRESS,
    functionName: "getSplits",
    query: { enabled: vaultConfigured },
  });

  const isOwner = me && owner.data && me.toLowerCase() === (owner.data as string).toLowerCase();

  return (
    <div>
      <PageHeader
        module="Resumen"
        icon={LayoutDashboard}
        title="Bóveda Personal"
        description="Tu bóveda en cadena con cuatro módulos: mover activos, autorizar con Permit/Permit2, cobrar invoices y dividir fondos. Solo vos firmás."
        actions={
          isOwner ? (
            <span className="pill !bg-emerald-500/10 !border-emerald-500/30 !text-emerald-300">
              <ShieldCheck className="size-3" />
              Sos el owner
            </span>
          ) : null
        }
      />

      {!vaultConfigured && (
        <div className="card card-pad mb-8 border-gold-500/30">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-gold-400 mt-0.5" />
            <div className="text-sm text-ink-200">
              <div className="font-medium text-ink-100 mb-1">Configurá tu bóveda</div>
              Hacé deploy del contrato <code className="mono text-gold-400">AssetVault</code> con
              el script <code className="mono text-gold-400">script/Deploy.s.sol</code> y pegá la
              dirección en{" "}
              <code className="mono text-gold-400">NEXT_PUBLIC_VAULT_ADDRESS</code> dentro de{" "}
              <code className="mono">.env.local</code>.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <StatCard
          accent
          label="Saldo ETH"
          icon={Wallet}
          value={
            ethBal.data ? `${fmt(ethBal.data.value, 18, 4)} ${ethBal.data.symbol}` : "—"
          }
          hint="Balance en la bóveda"
        />
        <StatCard
          label="Owner"
          icon={ShieldCheck}
          value={
            <span className="mono text-base">
              {owner.data ? <AddressPill address={owner.data as string} /> : "—"}
            </span>
          }
          hint="Quien firma todas las acciones"
        />
        <StatCard
          label="Destinos en split"
          icon={Coins}
          value={Array.isArray(splits.data) ? splits.data.length : 0}
          hint="Recipients configurados"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ModuleCard
          href="/move"
          tag="Módulo 1"
          title="Move"
          desc="Retirá ETH, ERC-20, NFTs o ejecutá llamadas arbitrarias en batch."
        />
        <ModuleCard
          href="/permit"
          tag="Módulo 2"
          title="Permit & Permit2"
          desc="Firmá EIP-2612 o Uniswap Permit2 para tirar de tokens sin allowance previa."
        />
        <ModuleCard
          href="/charge"
          tag="Módulo 3"
          title="Charge"
          desc="Creá invoices on-chain en ETH o ERC-20 y cobrá con firma del pagador."
        />
        <ModuleCard
          href="/splits"
          tag="Módulo 4"
          title="Splits"
          desc="Definí destinatarios y porcentajes (bps) y distribuí fondos en un click."
        />
      </div>

      <div className="mt-10 card card-pad">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="label mb-1">Dirección de la Bóveda</div>
            <div className="mono text-sm text-ink-100 break-all">{VAULT_ADDRESS}</div>
          </div>
          <AddressPill address={VAULT_ADDRESS} label="Vault" />
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  tag,
  title,
  desc,
}: {
  href: string;
  tag: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="card card-pad group hover:border-gold-500/30 transition">
      <div className="flex items-center justify-between">
        <span className="label text-gold-400/80">{tag}</span>
        <ArrowRight className="size-4 text-ink-400 group-hover:text-gold-400 group-hover:translate-x-0.5 transition" />
      </div>
      <h3 className="h-section mt-2">{title}</h3>
      <p className="mt-2 text-sm text-ink-300 leading-relaxed">{desc}</p>
    </Link>
  );
}
