"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { ASSET_VAULT_ABI } from "./abi";
import { VAULT_ADDRESS } from "./contracts";

export function useVaultWrite() {
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (receipt.isSuccess) toast.success("Confirmado en cadena");
    if (receipt.isError) toast.error("La transacción falló");
  }, [receipt.isSuccess, receipt.isError]);

  function call(functionName: string, args: readonly unknown[], value?: bigint) {
    if (!VAULT_ADDRESS || VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      toast.error("Configurá NEXT_PUBLIC_VAULT_ADDRESS");
      return;
    }
    toast.loading("Firmá la transacción…", { id: "tx" });
    writeContract(
      {
        address: VAULT_ADDRESS,
        abi: ASSET_VAULT_ABI,
        functionName: functionName as never,
        args: args as never,
        value,
      },
      {
        onSettled: () => toast.dismiss("tx"),
        onError: (e) => toast.error(e.message.slice(0, 120)),
      }
    );
  }

  return { call, hash, isPending, isMining: receipt.isLoading, reset };
}
