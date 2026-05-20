// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {AssetVault} from "../src/AssetVault.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract AssetVaultTest is Test {
    AssetVault internal vault;
    MockERC20 internal token;

    address internal owner = address(0xA11CE);
    address internal alice = address(0xA1);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA40);

    // Direccion canonica de Permit2 (no se invoca en estos tests salvo deploy mock)
    address internal constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function setUp() public {
        vm.prank(owner);
        vault = new AssetVault(owner, PERMIT2);

        token = new MockERC20("Mock", "MCK", 18);
        token.mint(address(vault), 1_000 ether);
        vm.deal(address(vault), 10 ether);
        vm.deal(alice, 5 ether);
    }

    /* -------------------- MOVE -------------------- */

    function test_withdrawETH() public {
        vm.prank(owner);
        vault.withdrawETH(bob, 1 ether);
        assertEq(bob.balance, 1 ether);
    }

    function test_withdrawERC20() public {
        vm.prank(owner);
        vault.withdrawERC20(IERC20(address(token)), bob, 100 ether);
        assertEq(token.balanceOf(bob), 100 ether);
    }

    function test_withdraw_revertsIfNotOwner() public {
        vm.expectRevert(AssetVault.NotOwner.selector);
        vault.withdrawETH(bob, 1 ether);
    }

    function test_executeBatch() public {
        AssetVault.Call[] memory calls = new AssetVault.Call[](2);
        calls[0] = AssetVault.Call({
            target: address(token),
            value: 0,
            data: abi.encodeWithSignature("transfer(address,uint256)", bob, 50 ether)
        });
        calls[1] = AssetVault.Call({
            target: address(token),
            value: 0,
            data: abi.encodeWithSignature("transfer(address,uint256)", carol, 25 ether)
        });
        vm.prank(owner);
        vault.executeBatch(calls);
        assertEq(token.balanceOf(bob), 50 ether);
        assertEq(token.balanceOf(carol), 25 ether);
    }

    /* -------------------- SPLIT -------------------- */

    function test_setSplitsAndDistributeETH() public {
        AssetVault.Recipient[] memory r = new AssetVault.Recipient[](3);
        r[0] = AssetVault.Recipient({to: alice, bps: 5000});
        r[1] = AssetVault.Recipient({to: bob, bps: 3000});
        r[2] = AssetVault.Recipient({to: carol, bps: 2000});
        vm.prank(owner);
        vault.setSplits(r);

        uint256 aliceBefore = alice.balance;
        vm.prank(owner);
        vault.distributeETH(10 ether);

        assertEq(alice.balance - aliceBefore, 5 ether);
        assertEq(bob.balance, 3 ether);
        assertEq(carol.balance, 2 ether);
    }

    function test_setSplits_revertsBpsNot10000() public {
        AssetVault.Recipient[] memory r = new AssetVault.Recipient[](2);
        r[0] = AssetVault.Recipient({to: alice, bps: 5000});
        r[1] = AssetVault.Recipient({to: bob, bps: 4000});
        vm.prank(owner);
        vm.expectRevert(AssetVault.InvalidBps.selector);
        vault.setSplits(r);
    }

    function test_distributeAllERC20() public {
        AssetVault.Recipient[] memory r = new AssetVault.Recipient[](2);
        r[0] = AssetVault.Recipient({to: alice, bps: 7000});
        r[1] = AssetVault.Recipient({to: bob, bps: 3000});
        vm.prank(owner);
        vault.setSplits(r);

        vm.prank(owner);
        vault.distributeAllERC20(IERC20(address(token)));

        assertEq(token.balanceOf(alice), 700 ether);
        assertEq(token.balanceOf(bob), 300 ether);
    }

    /* -------------------- CHARGE -------------------- */

    function test_invoiceETH_paySuccess() public {
        bytes32 id = keccak256("inv1");
        vm.prank(owner);
        vault.createInvoice(id, address(0), 2 ether, address(0), 0);

        vm.prank(alice);
        vault.payInvoiceETH{value: 2 ether}(id);

        (,, address payer,, bool paid,) = vault.invoices(id);
        assertTrue(paid);
        payer; // silence unused
    }

    function test_invoiceETH_wrongAmount() public {
        bytes32 id = keccak256("inv2");
        vm.prank(owner);
        vault.createInvoice(id, address(0), 2 ether, address(0), 0);

        vm.prank(alice);
        vm.expectRevert(AssetVault.WrongAmount.selector);
        vault.payInvoiceETH{value: 1 ether}(id);
    }

    function test_invoiceERC20() public {
        bytes32 id = keccak256("inv3");
        vm.prank(owner);
        vault.createInvoice(id, address(token), 100 ether, alice, 0);

        token.mint(alice, 200 ether);
        vm.prank(alice);
        token.approve(address(vault), 100 ether);

        uint256 vaultBefore = token.balanceOf(address(vault));
        vm.prank(alice);
        vault.payInvoiceERC20(id);

        assertEq(token.balanceOf(address(vault)) - vaultBefore, 100 ether);
    }

    function test_invoice_cancel() public {
        bytes32 id = keccak256("inv4");
        vm.prank(owner);
        vault.createInvoice(id, address(0), 1 ether, address(0), 0);
        vm.prank(owner);
        vault.cancelInvoice(id);

        vm.prank(alice);
        vm.expectRevert(AssetVault.InvoiceCancelled.selector);
        vault.payInvoiceETH{value: 1 ether}(id);
    }

    /* -------------------- OWNERSHIP -------------------- */

    function test_ownership2step() public {
        vm.prank(owner);
        vault.transferOwnership(alice);

        vm.expectRevert(AssetVault.NotPendingOwner.selector);
        vault.acceptOwnership();

        vm.prank(alice);
        vault.acceptOwnership();

        assertEq(vault.owner(), alice);
    }

    receive() external payable {}
}
