/**
 * TrustConnect - Modulo de conexion unificado
 * --------------------------------------------
 * Detecta automaticamente:
 *   - Provider inyectado (TrustWallet dApp browser, MetaMask)  -> usa window.ethereum
 *   - Cualquier otro navegador (Chrome, Safari, Firefox, etc.) -> usa WalletConnect v2
 *
 * WalletConnect v2 muestra un modal con QR (escritorio) o boton "Open TrustWallet"
 * (movil) y NO dispara el aviso legal del dApp browser de TrustWallet.
 */
import { EthereumProvider } from 'https://esm.sh/@walletconnect/ethereum-provider@2.16.1';

// ====== CONFIG ======
export const WC_PROJECT_ID = 'c1b85e8eff60dbd02663499756f49867';

export const APP_METADATA = {
  name: 'TrustConnect',
  description: 'Panel de administrador TrustConnect',
  url: location.origin && location.origin !== 'null' ? location.origin : 'https://trustconnect.app',
  icons: ['https://trustwallet.com/assets/images/favicon.png']
};

// Chains soportadas (decimal). 1=Eth, 56=BSC, 137=Polygon, 43114=Avax, 42161=Arbitrum
export const REQUIRED_CHAINS = [1];
export const OPTIONAL_CHAINS = [56, 137, 43114, 42161, 10];

// IDs de wallets recomendadas en el modal QR (TrustWallet primero)
const TRUSTWALLET_WC_ID = '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0';
const METAMASK_WC_ID    = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96';

let _wcProvider = null;
let _activeProvider = null;

/**
 * Devuelve un provider EIP-1193 listo para usar.
 * Si el usuario abrio la pagina dentro del dApp browser de TrustWallet/MetaMask,
 * usa el provider inyectado. Si no, abre WalletConnect v2 con QR.
 */
export async function getProvider({ forceWalletConnect = false } = {}) {
  if (_activeProvider) return _activeProvider;

  // 1) Provider inyectado (dApp browser interno) - opcional
  if (!forceWalletConnect && window.ethereum && (window.ethereum.isTrust || window.ethereum.isMetaMask)) {
    _activeProvider = window.ethereum;
    _activeProvider.__source = 'injected';
    return _activeProvider;
  }

  // 2) WalletConnect v2 (navegadores externos)
  if (!_wcProvider) {
    _wcProvider = await EthereumProvider.init({
      projectId: WC_PROJECT_ID,
      chains: REQUIRED_CHAINS,
      optionalChains: OPTIONAL_CHAINS,
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-accent-color': '#3375bb',
          '--wcm-background-color': '#3375bb'
        },
        explorerRecommendedWalletIds: [TRUSTWALLET_WC_ID, METAMASK_WC_ID]
      },
      metadata: APP_METADATA
    });
  }
  _wcProvider.__source = 'walletconnect';
  _activeProvider = _wcProvider;
  return _activeProvider;
}

/**
 * Solicita conexion al usuario. Lanza el modal/popup de la wallet.
 * @returns {Promise<{provider, account, chainId}>}
 */
export async function connectWallet(opts = {}) {
  const provider = await getProvider(opts);

  if (provider.__source === 'walletconnect') {
    // Si ya hay sesion activa, no hace falta reconectar
    if (!provider.session) {
      await provider.connect(); // abre el modal con QR / deep link
    }
  } else {
    // Inyectado
    await provider.request({ method: 'eth_requestAccounts' });
  }

  const accounts = await provider.request({ method: 'eth_accounts' });
  const chainId = await provider.request({ method: 'eth_chainId' });

  return { provider, account: accounts[0], chainId, source: provider.__source };
}

/**
 * Cierra la sesion (en WalletConnect realmente desconecta;
 * en injected solo limpia el estado del lado del cliente).
 */
export async function disconnectWallet() {
  if (_wcProvider && _wcProvider.session) {
    try { await _wcProvider.disconnect(); } catch {}
  }
  _activeProvider = null;
}

/**
 * Auto-restaura una sesion previa si existe (sin abrir modal).
 */
export async function restoreSession() {
  // Inyectado: si la wallet ya autorizo el sitio, eth_accounts devuelve cuentas
  if (window.ethereum && (window.ethereum.isTrust || window.ethereum.isMetaMask)) {
    const accs = await window.ethereum.request({ method: 'eth_accounts' });
    if (accs && accs.length) {
      _activeProvider = window.ethereum;
      _activeProvider.__source = 'injected';
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return { provider: _activeProvider, account: accs[0], chainId, source: 'injected' };
    }
  }
  // WalletConnect: intentar restaurar sesion previa sin mostrar modal
  try {
    const provider = await getProvider({ forceWalletConnect: true });
    if (provider.session && provider.accounts && provider.accounts.length) {
      const chainId = await provider.request({ method: 'eth_chainId' });
      return { provider, account: provider.accounts[0], chainId, source: 'walletconnect' };
    }
  } catch {}
  return null;
}

/**
 * Pide a la wallet cambiar de red. Si no la tiene, intenta agregarla.
 */
export async function switchChain(provider, chainId, chainConfig) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    });
  } catch (e) {
    if (e && e.code === 4902 && chainConfig) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [chainConfig]
      });
    } else {
      throw e;
    }
  }
}

// ============== Helpers EIP-1193 ==============
const SEL_BALANCE = '0x70a08231';
const padAddr = (a) => '000000000000000000000000' + a.toLowerCase().replace(/^0x/, '');

export async function getNativeBalance(provider, account) {
  const hex = await provider.request({ method: 'eth_getBalance', params: [account, 'latest'] });
  return BigInt(hex || '0x0');
}

export async function getErc20Balance(provider, tokenAddress, account) {
  const hex = await provider.request({
    method: 'eth_call',
    params: [{ to: tokenAddress, data: SEL_BALANCE + padAddr(account) }, 'latest']
  });
  return BigInt(hex || '0x0');
}

export function fmtUnits(value, decimals, max = 6) {
  const f = 10n ** BigInt(decimals);
  const whole = value / f;
  const frac = (value % f).toString().padStart(decimals, '0').slice(0, max).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}
