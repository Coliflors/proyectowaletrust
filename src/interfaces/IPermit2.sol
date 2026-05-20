// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Interfaz minima de Uniswap Permit2
/// Direccion canonica (todas las chains): 0x000000000022D473030F116dDEE9F6B43aC78BA3
interface IPermit2 {
    // ---------- AllowanceTransfer (permit firmado + transferFrom) ----------
    struct PermitDetails {
        address token;
        uint160 amount;
        uint48 expiration;
        uint48 nonce;
    }

    struct PermitSingle {
        PermitDetails details;
        address spender;
        uint256 sigDeadline;
    }

    struct PermitBatch {
        PermitDetails[] details;
        address spender;
        uint256 sigDeadline;
    }

    struct AllowanceTransferDetails {
        address from;
        address to;
        uint160 amount;
        address token;
    }

    function permit(address owner, PermitSingle memory permitSingle, bytes calldata signature) external;
    function permit(address owner, PermitBatch memory permitBatch, bytes calldata signature) external;

    function transferFrom(address from, address to, uint160 amount, address token) external;
    function transferFrom(AllowanceTransferDetails[] calldata transferDetails) external;

    function allowance(address user, address token, address spender)
        external
        view
        returns (uint160 amount, uint48 expiration, uint48 nonce);

    // ---------- SignatureTransfer (firma de 1 solo uso) ----------
    struct TokenPermissions {
        address token;
        uint256 amount;
    }

    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }

    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }

    struct PermitBatchTransferFrom {
        TokenPermissions[] permitted;
        uint256 nonce;
        uint256 deadline;
    }

    function permitTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;

    function permitTransferFrom(
        PermitBatchTransferFrom memory permit,
        SignatureTransferDetails[] calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;
}
