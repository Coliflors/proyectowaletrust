import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Address } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr?: Address | string | null) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function isAddress(v: string): v is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(v);
}

export function fmt(value: bigint | undefined, decimals = 18, max = 6) {
  if (value === undefined) return "—";
  const s = value.toString().padStart(decimals + 1, "0");
  const intPart = s.slice(0, s.length - decimals) || "0";
  let frac = s.slice(s.length - decimals).slice(0, max);
  frac = frac.replace(/0+$/, "");
  return frac ? `${intPart}.${frac}` : intPart;
}

export function parseUnits(input: string, decimals = 18): bigint {
  if (!input) return 0n;
  const [i = "0", f = ""] = input.split(".");
  const fracPadded = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(i) * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

export function toBytes32(label: string): `0x${string}` {
  // simple keccak-less id: pad utf8 hex to 32 bytes (sufficient for app-level invoice IDs).
  // For onchain uniqueness use a real keccak in production.
  const enc = new TextEncoder().encode(label);
  let hex = "";
  for (const b of enc) hex += b.toString(16).padStart(2, "0");
  hex = hex.slice(0, 64).padEnd(64, "0");
  return `0x${hex}` as `0x${string}`;
}
