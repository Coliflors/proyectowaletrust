// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrustToken
 * @notice Token ERC20 minimo compatible con TrustWallet, MetaMask y cualquier
 *         wallet que soporte EIP-1193 / WalletConnect.
 * @dev    No depende de librerias externas. Listo para desplegar en cualquier
 *         red EVM (Ethereum, BSC, Polygon, etc.). Ideal para conectar desde
 *         TrustWallet usando el dApp browser o WalletConnect v2.
 */
contract TrustToken {
    // --------- Metadatos ERC20 ---------
    string public name = "Trust Connect Token";
    string public symbol = "TCT";
    uint8  public constant decimals = 18;
    uint256 public totalSupply;

    // --------- Estado ---------
    address public owner;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // --------- Eventos estandar ERC20 ---------
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // --------- Modificadores ---------
    modifier onlyOwner() {
        require(msg.sender == owner, "TrustToken: caller is not the owner");
        _;
    }

    // --------- Constructor ---------
    /**
     * @param initialSupply Cantidad inicial (en unidades enteras, sin decimales).
     *                      El contrato la multiplica por 10**decimals.
     */
    constructor(uint256 initialSupply) {
        owner = msg.sender;
        uint256 supply = initialSupply * (10 ** uint256(decimals));
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // --------- Logica ERC20 ---------
    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        require(spender != address(0), "TrustToken: approve to zero address");
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= value, "TrustToken: insufficient allowance");
        unchecked {
            allowance[from][msg.sender] = currentAllowance - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "TrustToken: transfer to zero address");
        uint256 fromBalance = balanceOf[from];
        require(fromBalance >= value, "TrustToken: balance insufficient");
        unchecked {
            balanceOf[from] = fromBalance - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    // --------- Funciones del owner ---------
    function mint(address to, uint256 value) external onlyOwner {
        require(to != address(0), "TrustToken: mint to zero address");
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function burn(uint256 value) external {
        uint256 bal = balanceOf[msg.sender];
        require(bal >= value, "TrustToken: burn exceeds balance");
        unchecked {
            balanceOf[msg.sender] = bal - value;
            totalSupply -= value;
        }
        emit Transfer(msg.sender, address(0), value);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TrustToken: new owner is zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // --------- Recepcion / fallback ---------
    receive() external payable {
        revert("TrustToken: does not accept ETH");
    }
}
