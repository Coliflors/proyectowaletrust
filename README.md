# AssetVault

Bóveda personal de **un solo dueño** (vos) con 4 módulos. Todo lo sensible lo
controla `owner` con su clave privada o billetera hardware.

## Módulos

### [1] Move – Mover activos
- `withdrawETH / withdrawETHAll`
- `withdrawERC20 / withdrawERC20All`
- `withdrawERC721`
- `withdrawERC1155`
- `execute(target, value, data)` – llamada arbitraria
- `executeBatch(Call[])` – batch atómico

### [2] Permit – EIP-2612 + Uniswap Permit2
- `pullWithPermit(...)` – EIP-2612 (DAI, USDC, etc.)
- `pullWithDaiPermit(...)` – variante DAI con `allowed` bool
- `pullWithPermit2(...)` – Permit2 SignatureTransfer (1 sólo uso)
- `pullWithPermit2Batch(...)` – batch
- `permit2AllowanceSet(...) / permit2AllowanceSetBatch(...)` – registra allowance
- `permit2TransferFrom(...) / permit2TransferFromBatch(...)` – tira de los fondos
  cuando ya hay allowance Permit2

Dirección canónica de Permit2 (mainnet, base, arbitrum, polygon, optimism…):
`0x000000000022D473030F116dDEE9F6B43aC78BA3`

### [3] Charge – Cobrar (invoices)
- `createInvoice(id, token, amount, payer, deadline)` – `token = address(0)` = ETH,
  `payer = 0` = cualquiera puede pagar.
- `payInvoiceETH(id) payable` – pago directo en ETH.
- `payInvoiceERC20(id)` – requiere allowance ERC20 al vault.
- `chargeInvoiceWithPermit(id, payer, deadline, v, r, s)` – tirás del pago con
  firma EIP-2612.
- `chargeInvoiceWithPermit2(id, permitMsg, payer, signature)` – ídem con Permit2.
- `cancelInvoice(id)`.

### [4] Split – División de fondos
- `setSplits(Recipient[])` – `bps` totales = `10_000` (100%).
- `distributeETH(amount) / distributeAllETH()`
- `distributeERC20(token, amount) / distributeAllERC20(token)`

## Ownership
2-step (`transferOwnership` + `acceptOwnership`), más `renounceOwnership`.

## Stack
- Solidity `^0.8.24`
- Foundry (Forge, Cast, Anvil)

## Setup

```bash
# 1. Instalar Foundry (si no lo tenes)
# https://book.getfoundry.sh/getting-started/installation

# 2. Instalar forge-std
forge install foundry-rs/forge-std --no-commit

# 3. Compilar
forge build

# 4. Tests
forge test -vv

# 5. Deploy (Sepolia ejemplo)
cp .env.example .env   # rellenar PRIVATE_KEY y SEPOLIA_RPC_URL
forge script script/Deploy.s.sol:Deploy \
    --rpc-url sepolia \
    --broadcast \
    --verify
```

## Notas de seguridad
- **El owner = vos.** Cualquiera con la clave del owner controla 100% del vault.
  Usá hardware wallet o multisig.
- Las funciones `execute / executeBatch` permiten llamar cualquier contrato:
  útiles para approvals, swaps, claims… pero **manejá la clave con cuidado**.
- Los `try/catch` alrededor de `permit(...)` están a propósito: si la firma fue
  front-run y aplicada por otro, igual seguimos con el `transferFrom`.
- Los splits son **sin pull**: el owner dispara la distribución. Si querés un
  sistema pull-based (`release()` por destinatario), avisame y lo agrego.

## Layout

```
src/
  AssetVault.sol
  interfaces/
    IERC20.sol
    IERC20Permit.sol
    IPermit2.sol
    IERC721.sol
  libraries/
    SafeTransferLib.sol
test/
  AssetVault.t.sol
  mocks/MockERC20.sol
script/
  Deploy.s.sol
```
