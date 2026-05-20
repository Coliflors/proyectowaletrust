#!/usr/bin/env bash
# Despliega AssetVault.sol en TODAS las redes EVM que querés exponer en Trust.
# Requiere las variables RPC y API keys del .env (ver foundry.toml).
#
# Tron NO está acá: es TVM, no EVM. Para Tron usá TronBox aparte.
#
# Uso:
#   bash script/DeployMultichain.sh
#
# Después pegá las direcciones devueltas en el panel (selector de red).

set -e

CHAINS=("mainnet" "polygon" "base" "avalanche" "arbitrum" "bnb")

for chain in "${CHAINS[@]}"; do
  echo ""
  echo "========================================================"
  echo "  Desplegando AssetVault en: $chain"
  echo "========================================================"
  forge script script/Deploy.s.sol:Deploy \
    --rpc-url "$chain" \
    --broadcast \
    --verify \
    -vvv
done

echo ""
echo "✓ Listo. Las direcciones quedaron en broadcast/Deploy.s.sol/<chainId>/run-latest.json"
