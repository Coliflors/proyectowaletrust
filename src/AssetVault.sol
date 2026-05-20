// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IERC20Permit, IDaiLikePermit} from "./interfaces/IERC20Permit.sol";
import {IPermit2} from "./interfaces/IPermit2.sol";
import {IERC721, IERC1155} from "./interfaces/IERC721.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";

/*//////////////////////////////////////////////////////////////
                            AssetVault
    Boveda personal de un solo dueno (vos) con 4 modulos:

    [1] MOVE     -> retirar ETH/ERC20/ERC721/ERC1155 + ejecutar calls
    [2] PERMIT   -> jalar tokens via EIP-2612 y Uniswap Permit2
    [3] CHARGE   -> crear/cobrar invoices (pagos firmados)
    [4] SPLIT    -> dividir fondos entre N destinos con shares en bps

    Todas las acciones sensibles requieren la firma del OWNER.
//////////////////////////////////////////////////////////////*/
contract AssetVault {
    using SafeTransferLib for IERC20;

    /*//////////////////////////////////////////////////////////////
                            Owner & errores
    //////////////////////////////////////////////////////////////*/
    address public owner;
    address public pendingOwner;

    error NotOwner();
    error NotPendingOwner();
    error ZeroAddress();
    error LengthMismatch();
    error InvalidBps();
    error NoSplits();
    error InvoiceExists();
    error InvoiceMissing();
    error InvoicePaid();
    error InvoiceCancelled();
    error WrongToken();
    error WrongAmount();
    error CallFailed(uint256 index, bytes data);

    event OwnershipTransferStarted(address indexed previous, address indexed pending);
    event OwnershipTransferred(address indexed previous, address indexed current);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              Permit2
    //////////////////////////////////////////////////////////////*/
    IPermit2 public immutable PERMIT2;

    /*//////////////////////////////////////////////////////////////
                              Splits
    //////////////////////////////////////////////////////////////*/
    struct Recipient {
        address to;
        uint96 bps; // base 10_000
    }

    uint96 public constant BPS_DENOM = 10_000;
    Recipient[] private _splits;

    event SplitsUpdated(uint256 count);
    event SplitDistributedETH(uint256 total);
    event SplitDistributedERC20(address indexed token, uint256 total);

    /*//////////////////////////////////////////////////////////////
                              Invoices
    //////////////////////////////////////////////////////////////*/
    struct Invoice {
        address token;   // address(0) = ETH
        uint256 amount;
        address payer;   // 0 = abierto a cualquiera
        uint64 deadline; // 0 = sin vencimiento
        bool paid;
        bool cancelled;
    }

    mapping(bytes32 => Invoice) public invoices;

    event InvoiceCreated(bytes32 indexed id, address indexed token, uint256 amount, address payer, uint64 deadline);
    event InvoicePaidEvt(bytes32 indexed id, address indexed payer, uint256 amount);
    event InvoiceCancelledEvt(bytes32 indexed id);

    /*//////////////////////////////////////////////////////////////
                            Movimientos
    //////////////////////////////////////////////////////////////*/
    event Received(address indexed from, uint256 amount);
    event WithdrawETH(address indexed to, uint256 amount);
    event WithdrawERC20(address indexed token, address indexed to, uint256 amount);
    event WithdrawERC721(address indexed token, address indexed to, uint256 tokenId);
    event WithdrawERC1155(address indexed token, address indexed to, uint256 id, uint256 amount);
    event Executed(address indexed target, uint256 value, bytes data, bytes result);

    /*//////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/
    constructor(address _owner, address _permit2) {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;
        // Si pasas address(0) deshabilita Permit2 (las funciones que lo usen revertiran)
        PERMIT2 = IPermit2(_permit2);
        emit OwnershipTransferred(address(0), _owner);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /*//////////////////////////////////////////////////////////////
                         Ownership (2-pasos)
    //////////////////////////////////////////////////////////////*/
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        address prev = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(prev, owner);
    }

    function renounceOwnership() external onlyOwner {
        address prev = owner;
        owner = address(0);
        pendingOwner = address(0);
        emit OwnershipTransferred(prev, address(0));
    }

    /*//////////////////////////////////////////////////////////////
                  [1] MODULO MOVE: retirar / ejecutar
    //////////////////////////////////////////////////////////////*/

    function withdrawETH(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        SafeTransferLib.safeTransferETH(to, amount);
        emit WithdrawETH(to, amount);
    }

    function withdrawETHAll(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = address(this).balance;
        SafeTransferLib.safeTransferETH(to, bal);
        emit WithdrawETH(to, bal);
    }

    function withdrawERC20(IERC20 token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        token.safeTransfer(to, amount);
        emit WithdrawERC20(address(token), to, amount);
    }

    function withdrawERC20All(IERC20 token, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = token.balanceOf(address(this));
        token.safeTransfer(to, bal);
        emit WithdrawERC20(address(token), to, bal);
    }

    function withdrawERC721(IERC721 token, address to, uint256 tokenId) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        token.safeTransferFrom(address(this), to, tokenId);
        emit WithdrawERC721(address(token), to, tokenId);
    }

    function withdrawERC1155(IERC1155 token, address to, uint256 id, uint256 amount, bytes calldata data)
        external
        onlyOwner
    {
        if (to == address(0)) revert ZeroAddress();
        token.safeTransferFrom(address(this), to, id, amount, data);
        emit WithdrawERC1155(address(token), to, id, amount);
    }

    /// @notice Ejecutar una llamada arbitraria (aprobar, swap, etc.)
    function execute(address target, uint256 value, bytes calldata data)
        external
        onlyOwner
        returns (bytes memory result)
    {
        bool ok;
        (ok, result) = target.call{value: value}(data);
        if (!ok) revert CallFailed(0, result);
        emit Executed(target, value, data, result);
    }

    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    /// @notice Ejecutar batch de llamadas atomicamente
    function executeBatch(Call[] calldata calls) external onlyOwner returns (bytes[] memory results) {
        results = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; ++i) {
            (bool ok, bytes memory res) = calls[i].target.call{value: calls[i].value}(calls[i].data);
            if (!ok) revert CallFailed(i, res);
            results[i] = res;
            emit Executed(calls[i].target, calls[i].value, calls[i].data, res);
        }
    }

    /*//////////////////////////////////////////////////////////////
              [2] MODULO PERMIT: EIP-2612 + Permit2
    //////////////////////////////////////////////////////////////*/

    /// @notice Aplica una firma EIP-2612 desde `from` y trae los tokens a la boveda.
    function pullWithPermit(
        IERC20Permit token,
        address from,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner {
        // El permit autoriza a este contrato como spender
        try token.permit(from, address(this), value, deadline, v, r, s) {} catch {}
        IERC20(address(token)).safeTransferFrom(from, address(this), value);
    }

    /// @notice Variante DAI-style permit (allowed bool).
    function pullWithDaiPermit(
        IDaiLikePermit token,
        address from,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 amount
    ) external onlyOwner {
        try token.permit(from, address(this), nonce, expiry, true, v, r, s) {} catch {}
        IERC20(address(token)).safeTransferFrom(from, address(this), amount);
    }

    /// @notice Permit2 - SignatureTransfer (firma de 1 solo uso).
    function pullWithPermit2(
        IPermit2.PermitTransferFrom calldata permitMsg,
        address from,
        uint256 amount,
        bytes calldata signature
    ) external onlyOwner {
        PERMIT2.permitTransferFrom(
            permitMsg,
            IPermit2.SignatureTransferDetails({to: address(this), requestedAmount: amount}),
            from,
            signature
        );
    }

    /// @notice Permit2 - Batch SignatureTransfer.
    function pullWithPermit2Batch(
        IPermit2.PermitBatchTransferFrom calldata permitMsg,
        address from,
        uint256[] calldata amounts,
        bytes calldata signature
    ) external onlyOwner {
        if (amounts.length != permitMsg.permitted.length) revert LengthMismatch();
        IPermit2.SignatureTransferDetails[] memory details =
            new IPermit2.SignatureTransferDetails[](amounts.length);
        for (uint256 i = 0; i < amounts.length; ++i) {
            details[i] = IPermit2.SignatureTransferDetails({to: address(this), requestedAmount: amounts[i]});
        }
        PERMIT2.permitTransferFrom(permitMsg, details, from, signature);
    }

    /// @notice Permit2 - AllowanceTransfer (registra la allowance y luego se puede transferir varias veces).
    function permit2AllowanceSet(
        address from,
        IPermit2.PermitSingle calldata permitSingle,
        bytes calldata signature
    ) external onlyOwner {
        PERMIT2.permit(from, permitSingle, signature);
    }

    function permit2AllowanceSetBatch(
        address from,
        IPermit2.PermitBatch calldata permitBatch,
        bytes calldata signature
    ) external onlyOwner {
        PERMIT2.permit(from, permitBatch, signature);
    }

    /// @notice Despues de fijar la allowance, tirar de los fondos a `to` (default: this vault).
    function permit2TransferFrom(address from, address to, uint160 amount, address token) external onlyOwner {
        PERMIT2.transferFrom(from, to == address(0) ? address(this) : to, amount, token);
    }

    function permit2TransferFromBatch(IPermit2.AllowanceTransferDetails[] calldata details) external onlyOwner {
        PERMIT2.transferFrom(details);
    }

    /*//////////////////////////////////////////////////////////////
                    [3] MODULO CHARGE: invoices
    //////////////////////////////////////////////////////////////*/

    function createInvoice(bytes32 id, address token, uint256 amount, address payer, uint64 deadline)
        external
        onlyOwner
    {
        if (invoices[id].amount != 0) revert InvoiceExists();
        if (amount == 0) revert WrongAmount();
        invoices[id] = Invoice({
            token: token,
            amount: amount,
            payer: payer,
            deadline: deadline,
            paid: false,
            cancelled: false
        });
        emit InvoiceCreated(id, token, amount, payer, deadline);
    }

    function cancelInvoice(bytes32 id) external onlyOwner {
        Invoice storage inv = invoices[id];
        if (inv.amount == 0) revert InvoiceMissing();
        if (inv.paid) revert InvoicePaid();
        inv.cancelled = true;
        emit InvoiceCancelledEvt(id);
    }

    /// @notice Pagar invoice en ETH (cualquiera puede llamar si payer==0).
    function payInvoiceETH(bytes32 id) external payable {
        Invoice storage inv = invoices[id];
        _checkInvoice(inv);
        if (inv.token != address(0)) revert WrongToken();
        if (msg.value != inv.amount) revert WrongAmount();
        if (inv.payer != address(0) && msg.sender != inv.payer) revert NotOwner();
        inv.paid = true;
        emit InvoicePaidEvt(id, msg.sender, msg.value);
    }

    /// @notice Pagar invoice en ERC20 (requiere allowance previa del payer hacia este contrato).
    function payInvoiceERC20(bytes32 id) external {
        Invoice storage inv = invoices[id];
        _checkInvoice(inv);
        if (inv.token == address(0)) revert WrongToken();
        if (inv.payer != address(0) && msg.sender != inv.payer) revert NotOwner();
        inv.paid = true;
        IERC20(inv.token).safeTransferFrom(msg.sender, address(this), inv.amount);
        emit InvoicePaidEvt(id, msg.sender, inv.amount);
    }

    /// @notice Cobrar una invoice via EIP-2612 (el owner ejecuta con la firma del payer).
    function chargeInvoiceWithPermit(
        bytes32 id,
        address payer,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external onlyOwner {
        Invoice storage inv = invoices[id];
        _checkInvoice(inv);
        if (inv.token == address(0)) revert WrongToken();
        if (inv.payer != address(0) && inv.payer != payer) revert NotOwner();
        inv.paid = true;

        try IERC20Permit(inv.token).permit(payer, address(this), inv.amount, deadline, v, r, s) {} catch {}
        IERC20(inv.token).safeTransferFrom(payer, address(this), inv.amount);
        emit InvoicePaidEvt(id, payer, inv.amount);
    }

    /// @notice Cobrar una invoice via Permit2 SignatureTransfer.
    function chargeInvoiceWithPermit2(
        bytes32 id,
        IPermit2.PermitTransferFrom calldata permitMsg,
        address payer,
        bytes calldata signature
    ) external onlyOwner {
        Invoice storage inv = invoices[id];
        _checkInvoice(inv);
        if (inv.token == address(0)) revert WrongToken();
        if (permitMsg.permitted.token != inv.token) revert WrongToken();
        if (permitMsg.permitted.amount < inv.amount) revert WrongAmount();
        if (inv.payer != address(0) && inv.payer != payer) revert NotOwner();
        inv.paid = true;

        PERMIT2.permitTransferFrom(
            permitMsg,
            IPermit2.SignatureTransferDetails({to: address(this), requestedAmount: inv.amount}),
            payer,
            signature
        );
        emit InvoicePaidEvt(id, payer, inv.amount);
    }

    function _checkInvoice(Invoice storage inv) internal view {
        if (inv.amount == 0) revert InvoiceMissing();
        if (inv.paid) revert InvoicePaid();
        if (inv.cancelled) revert InvoiceCancelled();
        if (inv.deadline != 0 && block.timestamp > inv.deadline) revert InvoiceCancelled();
    }

    /*//////////////////////////////////////////////////////////////
                  [4] MODULO SPLIT: division de fondos
    //////////////////////////////////////////////////////////////*/

    function setSplits(Recipient[] calldata recipients) external onlyOwner {
        delete _splits;
        uint256 total;
        for (uint256 i = 0; i < recipients.length; ++i) {
            if (recipients[i].to == address(0)) revert ZeroAddress();
            if (recipients[i].bps == 0) revert InvalidBps();
            total += recipients[i].bps;
            _splits.push(recipients[i]);
        }
        if (total != BPS_DENOM) revert InvalidBps();
        emit SplitsUpdated(recipients.length);
    }

    function getSplits() external view returns (Recipient[] memory) {
        return _splits;
    }

    function distributeETH(uint256 amount) public onlyOwner {
        uint256 len = _splits.length;
        if (len == 0) revert NoSplits();
        uint256 distributed;
        for (uint256 i = 0; i < len; ++i) {
            uint256 share = i == len - 1 ? amount - distributed : (amount * _splits[i].bps) / BPS_DENOM;
            distributed += share;
            SafeTransferLib.safeTransferETH(_splits[i].to, share);
        }
        emit SplitDistributedETH(amount);
    }

    function distributeAllETH() external onlyOwner {
        distributeETH(address(this).balance);
    }

    function distributeERC20(IERC20 token, uint256 amount) public onlyOwner {
        uint256 len = _splits.length;
        if (len == 0) revert NoSplits();
        uint256 distributed;
        for (uint256 i = 0; i < len; ++i) {
            uint256 share = i == len - 1 ? amount - distributed : (amount * _splits[i].bps) / BPS_DENOM;
            distributed += share;
            token.safeTransfer(_splits[i].to, share);
        }
        emit SplitDistributedERC20(address(token), amount);
    }

    function distributeAllERC20(IERC20 token) external onlyOwner {
        distributeERC20(token, token.balanceOf(address(this)));
    }

    /*//////////////////////////////////////////////////////////////
                       Receivers ERC721 / ERC1155
    //////////////////////////////////////////////////////////////*/

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return this.onERC1155BatchReceived.selector;
    }
}
