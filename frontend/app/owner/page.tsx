"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ShieldCheck, KeyRound, UserCheck, AlertTriangle } from "lucide-react";
import type { Address } from "viem";
import { PageHeader } from "@/components/PageHeader";
import { AddressPill } from "@/components/AddressPill";
import { ASSET_VAULT_ABI } from "@/lib/abi";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { useVaultWrite } from "@/lib/useVaultWrite";
import { isAddress } from "@/lib/utils";

export default function OwnerPage() {
  const { address: me } = useAccount();
  const { call, isPending, isMining } = useVaultWrite();

  const owner = useReadContract({ abi: ASSET_VAULT_ABI, address: VAULT_ADDRESS, functionName: "owner" });
  const pending = useReadContract({ abi: ASSET_VAULT_ABI, address: VAULT_ADDRESS, functionName: "pendingOwner" });

  const [newOwner, setNewOwner] = useState("");
  const isOwner = me && owner.data && me.toLowerCase() === (owner.data as string).toLowerCase();
  const isPendingMe = me && pending.data && me.toLowerCase() === (pending.data as string).toLowerCase();

  return (
    <div>
      <PageHeader
        module="Gobernanza"
        icon={ShieldCheck}
        title="Owner"
        description="Transferencia de ownership en dos pasos. La firma sigue siendo siempre tuya hasta que el nuevo owner acepte explícitamente."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="card card-pad">
          <div className="label mb-2">Owner actual</div>
          <div className="font-display text-2xl text-ink-100 break-all">
            <AddressPill address={(owner.data as string) ?? null} />
          </div>
          {isOwner && (
            <div className="mt-3 inline-flex items-center gap-2 text-emerald-300 text-xs">
              <UserCheck className="size-3.5" /> Sos vos
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="label mb-2">Pendiente de aceptación</div>
          <div className="font-display text-2xl text-ink-100 break-all">
            <AddressPill address={(pending.data as string) ?? null} />
          </div>
          {isPendingMe && (
            <div className="mt-3 inline-flex items-center gap-2 text-gold-400 text-xs">
              <KeyRound className="size-3.5" /> Podés aceptar el ownership
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card card-pad">
          <h3 className="h-section">Transferir ownership</h3>
          <p className="text-xs text-ink-400 mt-1">El nuevo owner deberá aceptar para que el cambio surta efecto.</p>
          <div className="mt-4">
            <label className="label">Nueva dirección</label>
            <input
              className="input mt-1.5"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="0x…"
            />
          </div>
          <button
            className="btn-primary mt-4 w-full"
            disabled={!isOwner || !isAddress(newOwner) || isPending || isMining}
            onClick={() => call("transferOwnership", [newOwner as Address])}
          >
            {isPending || isMining ? "Procesando…" : "Iniciar transferencia"}
          </button>
        </div>

        <div className="card card-pad">
          <h3 className="h-section">Aceptar ownership</h3>
          <p className="text-xs text-ink-400 mt-1">Sólo la dirección pendiente puede ejecutar esta acción.</p>
          <button
            className="btn-primary mt-4 w-full"
            disabled={!isPendingMe || isPending || isMining}
            onClick={() => call("acceptOwnership", [])}
          >
            {isPending || isMining ? "Procesando…" : "Aceptar"}
          </button>

          <div className="mt-6 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-2 text-xs text-red-200">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong>Atención:</strong> el dueño tiene control total de los fondos y de la
                ejecución arbitraria. Considerá usar una hardware wallet o un multisig.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
