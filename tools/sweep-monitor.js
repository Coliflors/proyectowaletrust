#!/usr/bin/env node
/**
 * sweep-monitor.js
 * ─────────────────────────────────────────────────────────────────
 * Monitorea Wallet B en las 6 cadenas EVM, valúa en USD, calcula
 * gas estimado y devuelve un plan de barrido priorizado.
 *
 * Criterios de prioridad:
 *   1. Ratio valor/gas más alto (más ganancia por firma)
 *   2. Stablecoins primero (USDT/USDC — sin riesgo de precio)
 *   3. Cadenas de bajo costo (Base, Arbitrum, Polygon)
 *   4. Sólo incluye activos con liquidez fácil (lista blanca)
 *
 * Uso:
 *   node sweep-monitor.js <WALLET_B_ADDRESS>
 *   WALLET_B=0x... node sweep-monitor.js
 *
 * Dependencias: npm install ethers node-fetch
 */

const { ethers } = require('ethers');
const fetch = (...a) => import('node-fetch').then(m => m.default(...a));

// ─── Dirección de Wallet B ────────────────────────────────────────
const WALLET_B = process.argv[2] || process.env.WALLET_B || '';
if (!ethers.isAddress(WALLET_B)) {
  console.error('❌  Pasá la dirección de Wallet B como argumento:');
  console.error('    node sweep-monitor.js 0xTU_WALLET_B');
  process.exit(1);
}

// ─── Configuración de cadenas ─────────────────────────────────────
const CHAINS = [
  { id: 1,     name: 'Ethereum',          symbol: 'ETH',  rpc: 'https://eth.llamarpc.com',                    gasTier: 'high'   },
  { id: 137,   name: 'Polygon',           symbol: 'POL',  rpc: 'https://polygon-rpc.com',                     gasTier: 'low'    },
  { id: 8453,  name: 'Base',              symbol: 'ETH',  rpc: 'https://mainnet.base.org',                    gasTier: 'low'    },
  { id: 43114, name: 'Avalanche C-Chain', symbol: 'AVAX', rpc: 'https://api.avax.network/ext/bc/C/rpc',       gasTier: 'medium' },
  { id: 42161, name: 'Arbitrum',          symbol: 'ETH',  rpc: 'https://arb1.arbitrum.io/rpc',                gasTier: 'low'    },
  { id: 56,    name: 'BNB Smart Chain',   symbol: 'BNB',  rpc: 'https://bsc-dataseed.binance.org',            gasTier: 'low'    },
];

// ─── Tokens por cadena (sólo activos con liquidez fácil) ──────────
const TOKENS = {
  1: [
    { symbol: 'USDT', addr: '0xdAC17F958D2ee523a2206206994597C13D831ec7', dec: 6,  stable: true  },
    { symbol: 'USDC', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', dec: 6,  stable: true  },
    { symbol: 'DAI',  addr: '0x6B175474E89094C44Da98b954EedeAC495271d0F', dec: 18, stable: true  },
    { symbol: 'WBTC', addr: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', dec: 8,  stable: false },
    { symbol: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', dec: 18, stable: false },
    { symbol: 'LINK', addr: '0x514910771AF9Ca656af840dff83E8264EcF986CA', dec: 18, stable: false },
  ],
  137: [
    { symbol: 'USDT', addr: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', dec: 6,  stable: true  },
    { symbol: 'USDC', addr: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', dec: 6,  stable: true  },
    { symbol: 'WETH', addr: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', dec: 18, stable: false },
    { symbol: 'WBTC', addr: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', dec: 8,  stable: false },
  ],
  8453: [
    { symbol: 'USDC', addr: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', dec: 6,  stable: true  },
    { symbol: 'WETH', addr: '0x4200000000000000000000000000000000000006', dec: 18, stable: false },
    { symbol: 'cbBTC',addr: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', dec: 8,  stable: false },
  ],
  43114: [
    { symbol: 'USDT', addr: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', dec: 6,  stable: true  },
    { symbol: 'USDC', addr: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', dec: 6,  stable: true  },
    { symbol: 'WETH', addr: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', dec: 18, stable: false },
    { symbol: 'WBTC', addr: '0x50b7545627a5162F82A992c33b87aDc75187B218', dec: 8,  stable: false },
  ],
  42161: [
    { symbol: 'USDT', addr: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', dec: 6,  stable: true  },
    { symbol: 'USDC', addr: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', dec: 6,  stable: true  },
    { symbol: 'WETH', addr: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', dec: 18, stable: false },
    { symbol: 'WBTC', addr: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', dec: 8,  stable: false },
    { symbol: 'ARB',  addr: '0x912CE59144191C1204E64559FE8253a0e49E6548', dec: 18, stable: false },
  ],
  56: [
    { symbol: 'USDT', addr: '0x55d398326f99059fF775485246999027B3197955', dec: 18, stable: true  },
    { symbol: 'USDC', addr: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', dec: 18, stable: true  },
    { symbol: 'WETH', addr: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', dec: 18, stable: false },
    { symbol: 'WBTC', addr: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', dec: 18, stable: false },
    { symbol: 'CAKE', addr: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', dec: 18, stable: false },
  ],
};

// Bonificación de puntuación por tier de gas (favorece cadenas baratas)
const GAS_TIER_BONUS = { low: 3.0, medium: 1.5, high: 1.0 };
// Gas estimado por chain para un sweep típico (en unidades de gas)
const GAS_UNITS_SWEEP = 21000 + 3 * 65000; // 1 nativo + 3 ERC20s promedio

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// ─── Precios USD desde CoinGecko (free, sin API key) ─────────────
const COINGECKO_IDS = {
  ETH: 'ethereum', POL: 'matic-network', AVAX: 'avalanche-2', BNB: 'binancecoin',
  USDT: 'tether', USDC: 'usd-coin', DAI: 'dai',
  WBTC: 'wrapped-bitcoin', WETH: 'weth', cbBTC: 'coinbase-wrapped-btc',
  LINK: 'chainlink', ARB: 'arbitrum', CAKE: 'pancakeswap-token',
};

async function fetchPrices(symbols) {
  const ids = [...new Set(symbols.map(s => COINGECKO_IDS[s]).filter(Boolean))];
  if (!ids.length) return {};
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    const res  = await fetch(url, { headers: { 'Accept': 'application/json' }, timeout: 8000 });
    const data = await res.json();
    const prices = {};
    for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
      if (data[id]?.usd) prices[sym] = data[id].usd;
    }
    return prices;
  } catch (e) {
    console.warn('  ⚠  CoinGecko no disponible — usando precios estimados');
    return { ETH: 3500, POL: 0.55, AVAX: 35, BNB: 600, USDT: 1, USDC: 1, DAI: 1,
             WBTC: 95000, WETH: 3500, cbBTC: 95000, LINK: 18, ARB: 1.1, CAKE: 2.5 };
  }
}

// ─── Leer saldos de una cadena ────────────────────────────────────
async function scanChain(chain, wallet, prices) {
  const rpc = new ethers.JsonRpcProvider(chain.rpc, chain.id, { staticNetwork: true });
  const tokens = TOKENS[chain.id] || [];

  let feeData, nativeBal;
  try {
    [feeData, nativeBal] = await Promise.all([
      rpc.getFeeData(),
      rpc.getBalance(wallet),
    ]);
  } catch (e) {
    return { chain, error: e.message, assets: [], totalUsd: 0, gasCostUsd: 0, score: -1 };
  }

  const gasPrice  = feeData.maxFeePerGas || feeData.gasPrice || ethers.parseUnits('5', 'gwei');
  const nativeAmt = Number(ethers.formatEther(nativeBal));
  const nativeUsd = nativeAmt * (prices[chain.symbol] || 0);

  const assets = [];
  if (nativeAmt > 0) {
    assets.push({
      symbol:  chain.symbol,
      amount:  nativeAmt,
      usd:     nativeUsd,
      stable:  false,
      native:  true,
    });
  }

  // Leer tokens ERC20
  await Promise.all(tokens.map(async t => {
    try {
      const c   = new ethers.Contract(t.addr, ERC20_ABI, rpc);
      const bal = await c.balanceOf(wallet);
      if (bal === 0n) return;
      const amt = Number(ethers.formatUnits(bal, t.dec));
      if (amt < 0.01) return; // filtrar polvo
      const usd = amt * (prices[t.symbol] || (t.stable ? 1 : 0));
      assets.push({ symbol: t.symbol, amount: amt, usd, stable: t.stable, native: false, addr: t.addr });
    } catch { /* skip */ }
  }));

  const totalUsd = assets.reduce((s, a) => s + a.usd, 0);

  // Costo de gas en USD para barrer esta chain
  const tokensWithBal   = assets.filter(a => !a.native).length;
  const totalGasUnits   = BigInt(21000 + tokensWithBal * 65000);
  const gasCostWei      = totalGasUnits * gasPrice * 12n / 10n; // +20% buffer
  const gasCostNative   = Number(ethers.formatEther(gasCostWei));
  const gasCostUsd      = gasCostNative * (prices[chain.symbol] || 0);

  // Puntuación de prioridad
  const netValue    = totalUsd - gasCostUsd;
  const ratio       = gasCostUsd > 0 ? totalUsd / gasCostUsd : 0;
  const stableBonus = assets.filter(a => a.stable).reduce((s, a) => s + a.usd, 0) / Math.max(totalUsd, 1);
  const tierBonus   = GAS_TIER_BONUS[chain.gasTier] || 1;
  const score       = netValue > 0 ? ratio * tierBonus * (1 + stableBonus * 0.5) : 0;

  return { chain, assets, totalUsd, gasCostUsd, gasCostNative, netValue, ratio, score, gasPrice };
}

// ─── Formateo de salida ───────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
  red: '\x1b[31m', magenta: '\x1b[35m', blue: '\x1b[34m', white: '\x1b[37m',
};
const usd  = v => `$${v.toFixed(2)}`;
const pct  = v => `${(v * 100).toFixed(1)}%`;
const pad  = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

function printReport(results, wallet, prices) {
  const valid   = results.filter(r => !r.error && r.assets.length > 0);
  const noFunds = results.filter(r => !r.error && r.assets.length === 0);
  const errors  = results.filter(r =>  r.error);
  const sorted  = [...valid].sort((a, b) => b.score - a.score);

  console.log();
  console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗`);
  console.log(`║           SWEEP MONITOR  ·  WALLET B REPORT              ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}  Wallet B: ${wallet}`);
  console.log(`  Fecha   : ${new Date().toLocaleString()}${C.reset}`);
  console.log();

  if (!valid.length) {
    console.log(`${C.yellow}  Sin fondos detectados en ninguna cadena.${C.reset}\n`);
  } else {
    console.log(`${C.bold}  PLAN DE BARRIDO PRIORIZADO${C.reset}`);
    console.log(`  ${C.dim}Orden: mayor ratio valor/gas · bonus stablecoins · bonus cadena barata${C.reset}`);
    console.log();
    console.log(`  ${C.bold}${pad('#',3)} ${pad('Cadena',20)} ${rpad('Valor',10)} ${rpad('Gas est.',10)} ${rpad('Neto',10)} ${rpad('Ratio',7)} ${pad('Acción',20)}${C.reset}`);
    console.log(`  ${'─'.repeat(82)}`);

    sorted.forEach((r, i) => {
      const rank   = i + 1;
      const action = r.netValue <= 0
        ? `${C.red}✕ No rentable${C.reset}`
        : r.netValue < 1
          ? `${C.yellow}⚠ Valor bajo${C.reset}`
          : `${C.green}✓ BARRER${C.reset}`;

      const ratioStr = r.ratio > 0 ? `${r.ratio.toFixed(1)}×` : '—';
      console.log(`  ${C.bold}${rpad(rank,3)}${C.reset} ${pad(r.chain.name,20)} ${rpad(usd(r.totalUsd),10)} ${rpad(usd(r.gasCostUsd),10)} ${rpad(usd(r.netValue),10)} ${rpad(ratioStr,7)} ${action}`);

      // Detalle de activos
      const byValue = [...r.assets].sort((a, b) => {
        if (a.stable !== b.stable) return a.stable ? -1 : 1;
        return b.usd - a.usd;
      });
      for (const a of byValue) {
        const stableTag = a.stable ? `${C.green}[stable]${C.reset}` : '';
        const nativeTag = a.native ? `${C.blue}[native]${C.reset}` : '';
        console.log(`       ${C.dim}→ ${pad(a.symbol,8)} ${a.amount.toFixed(4).padStart(14)} ${rpad(usd(a.usd),10)}${C.reset} ${stableTag}${nativeTag}`);
      }
      console.log(`       ${C.dim}gasPrice: ${ethers.formatUnits(r.gasPrice,'gwei')} gwei · gas nativo: ${r.gasCostNative?.toFixed(6)} ${r.chain.symbol}${C.reset}`);
      console.log();
    });
  }

  // Resumen totales
  const totalValue = valid.reduce((s, r) => s + r.totalUsd, 0);
  const totalGas   = valid.reduce((s, r) => s + r.gasCostUsd, 0);
  const totalNet   = totalValue - totalGas;
  const stableTotal= valid.reduce((s, r) => s + r.assets.filter(a=>a.stable).reduce((x,a)=>x+a.usd,0), 0);

  console.log(`  ${'─'.repeat(82)}`);
  console.log(`  ${C.bold}TOTAL${C.reset}  ${pad('',20)} ${rpad(usd(totalValue),10)} ${rpad(usd(totalGas),10)} ${rpad(C.bold+usd(totalNet)+C.reset,18)}`);
  console.log(`  ${C.dim}Stablecoins: ${usd(stableTotal)} (${pct(stableTotal/Math.max(totalValue,1))} del total)${C.reset}`);
  console.log();

  // Cadenas sin fondos
  if (noFunds.length) {
    console.log(`  ${C.dim}Sin fondos: ${noFunds.map(r=>r.chain.name).join(' · ')}${C.reset}`);
  }
  if (errors.length) {
    console.log(`  ${C.yellow}Errores de conexión: ${errors.map(r=>`${r.chain.name} (${r.error.slice(0,40)})`).join(' · ')}${C.reset}`);
  }

  // Recomendaciones
  console.log();
  console.log(`${C.bold}${C.cyan}  RECOMENDACIONES${C.reset}`);
  const sweepable = sorted.filter(r => r.netValue > 1);
  if (!sweepable.length) {
    console.log(`  ${C.yellow}  · Ninguna cadena supera el umbral mínimo de $1 neto.${C.reset}`);
    console.log(`  ${C.yellow}  · Recargá gas o esperá a que bajen los fees.${C.reset}`);
  } else {
    sweepable.forEach((r, i) => {
      const hasLowGas = r.chain.gasTier === 'low';
      const hasStable = r.assets.some(a => a.stable);
      console.log(`  ${C.green}  ${i+1}. ${r.chain.name}${C.reset} — barrer ${usd(r.netValue)} neto`);
      if (hasStable) console.log(`     ${C.dim}↳ Stablecoins presentes: sin riesgo de precio.${C.reset}`);
      if (hasLowGas) console.log(`     ${C.dim}↳ Red de bajo costo — conveniente.${C.reset}`);
    });
    console.log();

    // Top 3 tokens más valiosos en total
    const allAssets = valid.flatMap(r => r.assets.map(a => ({ ...a, chain: r.chain.name })));
    const topAssets = allAssets.sort((a,b) => b.usd - a.usd).slice(0, 5);
    console.log(`  ${C.bold}  Top activos por valor USD:${C.reset}`);
    topAssets.forEach(a => {
      console.log(`     ${C.dim}· ${pad(a.symbol+' ('+a.chain+')',30)} ${usd(a.usd).padStart(12)}${a.stable?' ✦':''} ${C.reset}`);
    });
  }
  console.log();
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.dim}  Cargando precios…${C.reset}`);
  const allSymbols = ['ETH','POL','AVAX','BNB',...Object.values(TOKENS).flat().map(t=>t.symbol)];
  const prices     = await fetchPrices(allSymbols);

  console.log(`${C.dim}  Leyendo saldos en ${CHAINS.length} cadenas…${C.reset}`);
  const results = await Promise.all(CHAINS.map(c => scanChain(c, WALLET_B, prices)));

  printReport(results, WALLET_B, prices);

  // Guardar JSON por si se integra con panel
  const outPath = require('path').join(__dirname, 'sweep-report.json');
  const report  = {
    generatedAt: new Date().toISOString(),
    wallet:      WALLET_B,
    chains:      results.map(r => ({
      chain:      r.chain?.name,
      chainId:    r.chain?.id,
      totalUsd:   r.totalUsd || 0,
      gasCostUsd: r.gasCostUsd || 0,
      netValue:   r.netValue || 0,
      score:      r.score || 0,
      assets:     r.assets || [],
      error:      r.error || null,
    })).sort((a,b) => b.score - a.score),
  };
  require('fs').writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`${C.dim}  Reporte guardado: ${outPath}${C.reset}\n`);
}

main().catch(e => { console.error(C.red+'Error:'+C.reset, e.message); process.exit(1); });
