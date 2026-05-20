# MyPersonWallets — dApp

Consola corporativa para tu bóveda personal `AssetVault`. Te permite operar los
4 módulos del contrato desde el navegador, conectándote con cualquier wallet
EVM.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (tema oscuro · navy + gold)
- wagmi v2 + viem + RainbowKit
- @tanstack/react-query
- lucide-react · react-hot-toast

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# editá .env.local con:
#   NEXT_PUBLIC_VAULT_ADDRESS=<la addr del AssetVault desplegado>
#   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<de cloud.walletconnect.com>
npm run dev
```

Abrí http://localhost:3000

## Estructura

```
frontend/
  app/
    layout.tsx          shell + Sidebar + Topbar + Providers
    providers.tsx       wagmi + RainbowKit + QueryClient
    page.tsx            Dashboard
    move/page.tsx       Módulo 1 — retirar / batch
    permit/page.tsx     Módulo 2 — EIP-2612 + Permit2 SignatureTransfer
    charge/page.tsx     Módulo 3 — invoices ETH/ERC-20
    splits/page.tsx     Módulo 4 — recipients + distribuir
    owner/page.tsx      Gobernanza (transferOwnership / acceptOwnership)
    globals.css
  components/
    Brand.tsx           Logo y wordmark
    Sidebar.tsx · Topbar.tsx · ChainBadge.tsx
    PageHeader.tsx · StatCard.tsx · AddressPill.tsx
  lib/
    abi.ts              ABI subset de AssetVault + ERC-20
    contracts.ts        Direcciones (env)
    wagmi.ts            Config de chains + transports
    useVaultWrite.ts    Hook para escribir al contrato (toasts incluidos)
    utils.ts            cn, fmt, parseUnits, isAddress, toBytes32
```

## Cadenas soportadas (por defecto)

Mainnet, Sepolia (default), Base, Arbitrum, Polygon, Optimism. Editá
`@/lib/wagmi.ts` para añadir o quitar.

## Notas

- Permit2 canónico (todas las EVM principales): `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- La página **Permit** firma localmente (`useSignTypedData`). El owner usa esa
  firma para que la bóveda jale los tokens del pagador.
- La página **Charge** genera el `bytes32` de la invoice a partir de un label
  legible (utf-8 → 32 bytes). Para producción, considerá usar `keccak256`.
- Tema visual configurable en `tailwind.config.ts` (paleta `navy` + `gold`).
