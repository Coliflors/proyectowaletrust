export const ASSET_VAULT_ABI = [
  // ----- views -----
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "pendingOwner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "PERMIT2", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "function",
    name: "getSplits",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "to", type: "address" },
          { name: "bps", type: "uint96" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "invoices",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "payer", type: "address" },
      { name: "deadline", type: "uint64" },
      { name: "paid", type: "bool" },
      { name: "cancelled", type: "bool" },
    ],
  },

  // ----- ownership -----
  { type: "function", name: "transferOwnership", stateMutability: "nonpayable", inputs: [{ name: "newOwner", type: "address" }], outputs: [] },
  { type: "function", name: "acceptOwnership", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // ----- move -----
  { type: "function", name: "withdrawETH", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "withdrawETHAll", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }], outputs: [] },
  { type: "function", name: "withdrawERC20", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "withdrawERC20All", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "to", type: "address" }], outputs: [] },
  {
    type: "function",
    name: "executeBatch",
    stateMutability: "payable",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
    outputs: [{ type: "bytes[]" }],
  },

  // ----- permit -----
  {
    type: "function",
    name: "pullWithPermit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "value", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "pullWithPermit2",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "permitMsg",
        type: "tuple",
        components: [
          {
            name: "permitted",
            type: "tuple",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint256" },
            ],
          },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      { name: "from", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },

  // ----- charge -----
  {
    type: "function",
    name: "createInvoice",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "payer", type: "address" },
      { name: "deadline", type: "uint64" },
    ],
    outputs: [],
  },
  { type: "function", name: "cancelInvoice", stateMutability: "nonpayable", inputs: [{ name: "id", type: "bytes32" }], outputs: [] },
  { type: "function", name: "payInvoiceETH", stateMutability: "payable", inputs: [{ name: "id", type: "bytes32" }], outputs: [] },
  { type: "function", name: "payInvoiceERC20", stateMutability: "nonpayable", inputs: [{ name: "id", type: "bytes32" }], outputs: [] },

  // ----- splits -----
  {
    type: "function",
    name: "setSplits",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "recipients",
        type: "tuple[]",
        components: [
          { name: "to", type: "address" },
          { name: "bps", type: "uint96" },
        ],
      },
    ],
    outputs: [],
  },
  { type: "function", name: "distributeETH", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "distributeAllETH", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "distributeERC20", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "distributeAllERC20", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }], outputs: [] },

  // ----- events (subset) -----
  { type: "event", name: "WithdrawETH", inputs: [{ name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "WithdrawERC20", inputs: [{ name: "token", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
  { type: "event", name: "InvoiceCreated", inputs: [{ name: "id", type: "bytes32", indexed: true }, { name: "token", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }, { name: "payer", type: "address", indexed: false }, { name: "deadline", type: "uint64", indexed: false }] },
  { type: "event", name: "SplitsUpdated", inputs: [{ name: "count", type: "uint256", indexed: false }] },
] as const;

export const ERC20_ABI = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "nonces", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "DOMAIN_SEPARATOR", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
] as const;
