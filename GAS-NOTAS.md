# 💸 Plan de recarga de gas para mover $20.000 USD

---

## ⚡ Resumen ultra-rápido

| Plan | Total a recargar | Cuándo conviene |
|------|------------------|-----------------|
| 🟢 **PLAN A — Solo Base** | **~$15 USD** | Si todos los $20k pasan por Base. **Recomendado.** |
| 🔵 **PLAN B — Las 6 EVM + Tron** | **~$135 USD** | Si vas a operar en varias redes / no sabés en cuál caerán |

> El **monto que movés** ($20k) **NO afecta** el gas. Mover $20 cuesta lo mismo
> que mover $20k. Lo que cobra es la operación, no el valor.

---

## 📍 Tus direcciones de recarga

> Las 6 redes EVM **comparten la misma dirección**. Tron es distinta.
> Editá este bloque pegando tu dirección donde dice `[PEGAR ACÁ]` y guardás el archivo.

### Dirección EVM (sirve para Ethereum, Polygon, Base, Avalanche, Arbitrum, BNB)

```
[PEGAR ACÁ TU DIRECCIÓN EVM 0x...]
```

📲 **Cómo sacarla**: Trust Wallet → Recibir → Ethereum → Copiar.
La copiás una sola vez, sirve para las 6 redes EVM.

### Dirección Tron

```
[PEGAR ACÁ TU DIRECCIÓN TRON TR...]
```

📲 **Cómo sacarla**: Trust Wallet → Recibir → Tron (TRX) → Copiar.

---

## 🟢 PLAN A — Solo Base · TOTAL: ~$15 USD

> Lo más barato y simple. Mandás $20k a Base, gas para 50+ operaciones.

| ✓ | Red | Token | Monto | USD aprox | Dirección |
|---|-----|-------|-------|-----------|-----------|
| ☐ | **Base** | ETH | **0.005 ETH** | **~$15** | `[TU DIRECCIÓN EVM]` |

### Cómo cargarlo

- **Desde Binance/Bybit/Kraken**: retirás 0.005 ETH eligiendo la red **"Base"** (no Ethereum).
- **Desde otra wallet con ETH en Base**: transferencia directa.
- **Desde Ethereum mainnet**: bridge oficial → https://bridge.base.org (paga gas extra ~$10-20 una vez).

> Una vez que tenés 0.005 ETH en Base, podés hacer **decenas de transferencias**
> sin volver a recargar.

---

## 🔵 PLAN B — Todas las redes · TOTAL: ~$135 USD

> Si querés flexibilidad para mover desde/hacia cualquier red.

| ✓ | Red | Token | Monto | USD aprox | Dirección |
|---|-----|-------|-------|-----------|-----------|
| ☐ | **Ethereum** | ETH | 0.025 ETH | ~$80 | `[TU DIRECCIÓN EVM]` |
| ☐ | **Polygon** | POL | 2 POL | ~$1 | `[TU DIRECCIÓN EVM]` |
| ☐ | **Base** | ETH | 0.005 ETH | ~$15 | `[TU DIRECCIÓN EVM]` |
| ☐ | **Arbitrum** | ETH | 0.005 ETH | ~$15 | `[TU DIRECCIÓN EVM]` |
| ☐ | **Avalanche** | AVAX | 0.15 AVAX | ~$5 | `[TU DIRECCIÓN EVM]` |
| ☐ | **BNB Smart Chain** | BNB | 0.015 BNB | ~$10 | `[TU DIRECCIÓN EVM]` |
| ☐ | **Tron** | TRX | 80 TRX | ~$10 | `[TU DIRECCIÓN TRON]` |
|   |   |   | **TOTAL** | **~$136 USD** |   |

### Si querés ahorrar más, sacá Ethereum del plan

Sin Ethereum mainnet: **~$56 USD total**. Ethereum solo lo necesitás si los fondos
ya están en mainnet sí o sí.

---

## ⚠️ Reglas importantes

1. **NO mandes el gas al `AssetVault`** — el vault no paga gas, lo paga quien firma la tx.
   El gas va a **tu wallet conectada (A)**, en cada red.

2. **Verificá la red al retirar** desde Binance/Bybit. "ETH (Ethereum)" cuesta 50x
   más que "ETH (Base)". Asegurate de elegir la red correcta.

3. **Hacé un test antes** con $5-10 para confirmar que todo el flujo anda.

4. **Polygon**: el ticker oficial cambió de MATIC → POL. Misma cosa.

5. **Tron USDT (TRC-20)**: si tenés energía/bandwidth en Tron por staking, las
   transferencias son **gratis**. Sin staking, ~$1-4 por tx.

---

## 🧭 ¿Cómo decido qué plan elegir?

```
¿Sabés en qué red están los fondos hoy?
│
├── No / Varias redes → PLAN B (~$135)
│
└── Sí, en una sola red
    │
    ├── Ethereum mainnet → bridgealos a Base primero, después PLAN A (~$15 + bridge $10)
    ├── Base / Arbitrum / Polygon → PLAN A directo (~$15)
    └── Tron (USDT TRC-20) → solo recargá Tron (~$10)
```

---

## 📊 Información de referencia

### Costo típico por transacción (orden de magnitud)

| Red | Costo por tx |
|-----|--------------|
| Ethereum | $5–25 (varía con congestión) |
| Polygon | $0.005–0.03 |
| Base | $0.05–0.30 |
| Arbitrum | $0.10–0.50 |
| Avalanche | $0.10–0.40 |
| BNB | $0.10–0.30 |
| Tron USDT | $0–4 (depende de staking) |

### Dónde mirar el gas en vivo

- Ethereum: https://etherscan.io/gastracker
- Polygon: https://polygonscan.com/gastracker
- Base: https://basescan.org/gastracker
- Arbitrum: https://arbiscan.io/gastracker
- Avalanche: https://snowtrace.io/gastracker
- BNB: https://bscscan.com/gastracker
- Tron: https://tronscan.org

---

## Flujo de gas (recordatorio)

```
Tu otra wallet B  ──(1) Depósito──►  AssetVault  ──(2) Retiro──►  Wallet A (panel)
       paga gas                          —                              paga gas
```

Son **2 transacciones por red** que pagás. Si vas directo B → A sin vault, es **1 sola tx**.

---

## Cómo cargar gas (paso a paso)

1. Abrí Trust → Wallet A (la que conectaste al panel) → **Recibir**
2. Elegí la red que querés cargar (ej: Base)
3. Copiá la dirección (en EVM es siempre la misma para las 6 redes)
4. Desde Binance/Bybit/Kraken: retirás el monto **eligiendo la red correcta**
   (ej: ETH (Base), no ETH (Ethereum) — son redes distintas con costos muy distintos)
5. Esperás 1-3 confirmaciones (segundos en L2s, ~30 seg en mainnet)

---

## Para test gratis antes de tocar dinero real

Recargá **Sepolia (testnet)** con ETH gratis:
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

Probás todo el flujo sin costo y después aplicás con dinero real.
