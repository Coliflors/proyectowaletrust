"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useSignTypedData, useChainId } from "wagmi";
import { PenLine, FileSignature, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import type { Address } from "viem";
import { PageHeader } from "@/components/PageHeader";
import { ERC20_ABI } from "@/lib/abi";
import { useVaultWrite } from "@/lib/useVaultWrite";
import { isAddress, parseUnits } from "@/lib/utils";
import { VAULT_ADDRESS, PERMIT2_ADDRESS } from "@/lib/contracts";

export default function PermitPage() {
  return (
    <div>
      <PageHeader
        module="Módulo 2"
        icon={PenLine}
        title="Permit & Permit2"
        description="Pedile al pagador una firma EIP-2612 (en el token) o Uniswap Permit2 (canónico) y la bóveda jala los tokens en una sola tx, sin allowance previa."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Eip2612Card />
        <Permit2SignatureCard />
      </div>

      <div className="mt-6 card card-pad">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="size-4 text-gold-400" />
          <span className="label">Notas</span>
        </div>
        <ul className="text-sm text-ink-300 space-y-1.5 list-disc list-inside">
          <li>Permit2 canónico: <code className="mono text-gold-400">{PERMIT2_ADDRESS}</code> (mismo en todas las EVM principales).</li>
          <li>El usuario firma off-chain. La firma se la pasás al owner del vault y este la usa al cobrar.</li>
          <li>EIP-2612 sólo funciona en tokens que lo implementan nativamente (DAI, USDC, etc.).</li>
          <li>Permit2 funciona con cualquier ERC-20 (requiere approve único de Permit2 por parte del usuario).</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------------- EIP-2612 ---------------- */

function Eip2612Card() {
  const { address: me } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { signTypedDataAsync, isPending: signing } = useSignTypedData();
  const { call, isPending, isMining } = useVaultWrite();

  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");
  const [deadlineMin, setDeadlineMin] = useState("60");
  const [sig, setSig] = useState<{ v: number; r: `0x${string}`; s: `0x${string}`; deadline: bigint; value: bigint } | null>(null);

  async function sign() {
    try {
      if (!me || !publicClient || !isAddress(token)) return;
      const dec = (await publicClient.readContract({
        abi: ERC20_ABI,
        address: token as Address,
        functionName: "decimals",
      })) as number;
      const name = (await publicClient.readContract({
        abi: ERC20_ABI,
        address: token as Address,
        functionName: "name",
      })) as string;
      const nonce = (await publicClient.readContract({
        abi: ERC20_ABI,
        address: token as Address,
        functionName: "nonces",
        args: [me],
      })) as bigint;

      const value = parseUnits(amount, dec);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineMin) * 60);

      const signature = await signTypedDataAsync({
        domain: {
          name,
          version: "1",
          chainId,
          verifyingContract: token as Address,
        },
        types: {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "Permit",
        message: {
          owner: me,
          spender: VAULT_ADDRESS,
          value,
          nonce,
          deadline,
        },
      });

      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const v = parseInt(signature.slice(130, 132), 16);
      setSig({ v, r, s, deadline, value });
      toast.success("Firma EIP-2612 generada");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error firmando";
      toast.error(msg.slice(0, 120));
    }
  }

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Firma</div>
          <h3 className="h-section">EIP-2612</h3>
        </div>
        <FileSignature className="size-5 text-gold-400" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Token</label>
          <input className="input mt-1.5" value={token} onChange={(e) => setToken(e.target.value)} placeholder="0x… ERC-20 con permit" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Monto</label>
            <input className="input mt-1.5" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
          </div>
          <div>
            <label className="label">Vence en (min)</label>
            <input className="input mt-1.5" value={deadlineMin} onChange={(e) => setDeadlineMin(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button className="btn-ghost flex-1" disabled={!me || !isAddress(token) || !amount || signing} onClick={sign}>
          {signing ? "Firmando…" : "1) Firmar como pagador"}
        </button>
        <button
          className="btn-primary flex-1"
          disabled={!sig || isPending || isMining}
          onClick={() =>
            sig &&
            me &&
            call("pullWithPermit", [token as Address, me, sig.value, sig.deadline, sig.v, sig.r, sig.s])
          }
        >
          {isPending || isMining ? "Procesando…" : "2) Cobrar al vault"}
        </button>
      </div>

      {sig && (
        <div className="mt-4 p-3 rounded-lg border border-white/5 bg-navy-950/60 mono text-[11px] text-ink-300 break-all">
          <div><span className="text-gold-400">v:</span> {sig.v}</div>
          <div><span className="text-gold-400">r:</span> {sig.r}</div>
          <div><span className="text-gold-400">s:</span> {sig.s}</div>
          <div><span className="text-gold-400">deadline:</span> {sig.deadline.toString()}</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Permit2 SignatureTransfer ---------------- */

function Permit2SignatureCard() {
  const { address: me } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync, isPending: signing } = useSignTypedData();
  const { call, isPending, isMining } = useVaultWrite();

  const [token, setToken] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [decimals, setDecimals] = useState("18");
  const [nonceStr, setNonceStr] = useState(String(BigInt(Date.now())));
  const [deadlineMin, setDeadlineMin] = useState("60");
  const [sig, setSig] = useState<{ signature: `0x${string}`; nonce: bigint; deadline: bigint; amount: bigint } | null>(null);

  async function sign() {
    try {
      if (!me || !isAddress(token)) return;
      const amount = parseUnits(amountStr, Number(decimals));
      const nonce = BigInt(nonceStr);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineMin) * 60);

      const signature = await signTypedDataAsync({
        domain: {
          name: "Permit2",
          chainId,
          verifyingContract: PERMIT2_ADDRESS,
        },
        types: {
          PermitTransferFrom: [
            { name: "permitted", type: "TokenPermissions" },
            { name: "spender", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
          TokenPermissions: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
          ],
        },
        primaryType: "PermitTransferFrom",
        message: {
          permitted: { token: token as Address, amount },
          spender: VAULT_ADDRESS,
          nonce,
          deadline,
        },
      });
      setSig({ signature, nonce, deadline, amount });
      toast.success("Firma Permit2 generada");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error firmando";
      toast.error(msg.slice(0, 120));
    }
  }

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label">Firma</div>
          <h3 className="h-section">Permit2 · SignatureTransfer</h3>
        </div>
        <FileSignature className="size-5 text-gold-400" />
      </div>

      <div className="space-y-3">
        <div>
          <label className="label">Token</label>
          <input className="input mt-1.5" value={token} onChange={(e) => setToken(e.target.value)} placeholder="0x…" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Monto</label>
            <input className="input mt-1.5" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} placeholder="0.0" />
          </div>
          <div>
            <label className="label">Decimales</label>
            <input className="input mt-1.5" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
          </div>
          <div>
            <label className="label">Vence en (min)</label>
            <input className="input mt-1.5" value={deadlineMin} onChange={(e) => setDeadlineMin(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Nonce</label>
          <input className="input mt-1.5" value={nonceStr} onChange={(e) => setNonceStr(e.target.value)} />
          <div className="mt-1 text-[11px] text-ink-400">Cualquier número no usado por este firmante en Permit2.</div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button className="btn-ghost flex-1" disabled={!me || !isAddress(token) || !amountStr || signing} onClick={sign}>
          {signing ? "Firmando…" : "1) Firmar"}
        </button>
        <button
          className="btn-primary flex-1"
          disabled={!sig || isPending || isMining}
          onClick={() => {
            if (!sig || !me) return;
            const permitMsg = {
              permitted: { token: token as Address, amount: sig.amount },
              nonce: sig.nonce,
              deadline: sig.deadline,
            };
            call("pullWithPermit2", [permitMsg, me, sig.amount, sig.signature]);
          }}
        >
          {isPending || isMining ? "Procesando…" : "2) Cobrar al vault"}
        </button>
      </div>

      {sig && (
        <div className="mt-4 p-3 rounded-lg border border-white/5 bg-navy-950/60 mono text-[11px] text-ink-300 break-all">
          <div><span className="text-gold-400">signature:</span> {sig.signature}</div>
          <div><span className="text-gold-400">nonce:</span> {sig.nonce.toString()}</div>
          <div><span className="text-gold-400">deadline:</span> {sig.deadline.toString()}</div>
        </div>
      )}
    </div>
  );
}
