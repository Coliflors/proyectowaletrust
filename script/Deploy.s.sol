// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {AssetVault} from "../src/AssetVault.sol";

contract Deploy is Script {
    // Direccion canonica de Uniswap Permit2 (mainnet, base, arbitrum, polygon, optimism, etc.)
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function run() external returns (AssetVault vault) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address ownerAddr = vm.addr(pk);

        vm.startBroadcast(pk);
        vault = new AssetVault(ownerAddr, PERMIT2);
        vm.stopBroadcast();

        console2.log("AssetVault deployed at:", address(vault));
        console2.log("Owner:", ownerAddr);
    }
}
