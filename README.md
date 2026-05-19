# TrustToken + Conexion TrustWallet

Proyecto minimo con dos piezas:

1. `contracts/TrustToken.sol` - Smart contract ERC20 desplegable en cualquier red EVM (Ethereum, BSC, Polygon, etc.).
2. `index.html` - dApp de una sola pagina que permite conectar **TrustWallet** (y cualquier wallet EIP-1193 como MetaMask).

## 1. Desplegar el smart contract

Opcion rapida sin instalar nada: usar **Remix IDE**.

1. Abre https://remix.ethereum.org
2. Crea un archivo `TrustToken.sol` y pega el contenido de `contracts/TrustToken.sol`.
3. Compila con Solidity `0.8.20` (o superior compatible).
4. En la pestana **Deploy & Run**:
   - Environment: `Injected Provider - TrustWallet` (o MetaMask).
   - En el constructor pasa el `initialSupply` (ej: `1000000` para 1M tokens).
   - Pulsa **Deploy** y firma en TrustWallet.
5. Copia la direccion del contrato desplegado.

> Para BSC Mainnet usa chainId `56`, para BSC Testnet `97`, para Polygon `137`.

## 2. Conectar TrustWallet desde la dApp

### En movil
- Abre TrustWallet -> pestana **Browser** (o **Discover** segun version).
- Pega la URL donde sirvas `index.html` (puede ser GitHub Pages, Netlify, Vercel, IPFS, etc.).
- Pulsa **Conectar Wallet**. TrustWallet inyecta `window.ethereum` automaticamente.

### En escritorio
- Si no tienes extension, el boton intentara abrir el deep link `link.trustwallet.com` para abrir la dApp en el navegador interno de TrustWallet en tu movil.
- Tambien funciona con cualquier extension EIP-1193 (MetaMask, Rabby, etc.).

## 3. Servir localmente

Cualquier servidor estatico vale. Por ejemplo con Python:

```
python -m http.server 8080
```

Y abre `http://localhost:8080` desde el navegador del movil con TrustWallet (mismo wifi) o desde el dApp browser.

## Estructura

```
TRusConeccion/
  contracts/
    TrustToken.sol     # ERC20 sin dependencias externas
  index.html           # Frontend con boton "Conectar TrustWallet"
  README.md
```

## Notas de seguridad
- El contrato no usa OpenZeppelin a proposito para ser autocontenido. Para produccion se recomienda auditar y/o migrar a `@openzeppelin/contracts`.
- El `owner` puede mintear tokens sin limite. Si no lo necesitas, elimina la funcion `mint` antes de desplegar.
- `receive()` revierte cualquier envio de ETH/BNB al contrato.
