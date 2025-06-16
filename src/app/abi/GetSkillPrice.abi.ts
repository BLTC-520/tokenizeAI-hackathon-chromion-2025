// src/app/abi/GetSkillPrice.abi.ts

export const GET_SKILL_PRICE_ABI = [
    // Constructor
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },

    // Errors
    {
        "inputs": [{ "internalType": "bytes32", "name": "requestId", "type": "bytes32" }],
        "name": "UnexpectedRequestID",
        "type": "error"
    },

    // Events
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "bytes32", "name": "requestId", "type": "bytes32" },
            { "indexed": false, "internalType": "bytes", "name": "response", "type": "bytes" },
            { "indexed": false, "internalType": "bytes", "name": "err", "type": "bytes" }
        ],
        "name": "Response",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
            { "indexed": false, "internalType": "string", "name": "queryType", "type": "string" }
        ],
        "name": "SkillDataUpdated",
        "type": "event"
    },

    // Main Functions

    /**
     * @notice Send flexible request to get skill market data
     */
    {
        "inputs": [
            { "internalType": "uint8", "name": "donHostedSecretsSlotID", "type": "uint8" },
            { "internalType": "uint64", "name": "donHostedSecretsVersion", "type": "uint64" },
            { "internalType": "string[]", "name": "args", "type": "string[]" },
            { "internalType": "uint64", "name": "subscriptionId", "type": "uint64" }
        ],
        "name": "sendRequest",
        "outputs": [{ "internalType": "bytes32", "name": "requestId", "type": "bytes32" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },

    /**
     * @notice Get the latest skill market data
     */
    {
        "inputs": [],
        "name": "getSkillsData",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },

    /**
     * @notice Get detailed information guidance for a specific skill
     */
    {
        "inputs": [{ "internalType": "string", "name": "skillName", "type": "string" }],
        "name": "getSkillDetailInstructions",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "pure",
        "type": "function"
    },

    /**
     * @notice Get query help information
     */
    {
        "inputs": [],
        "name": "getQueryHelp",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "pure",
        "type": "function"
    },

    // Access Control Functions

    /**
     * @notice Add address to allow list
     */
    {
        "inputs": [{ "internalType": "address", "name": "addrToAdd", "type": "address" }],
        "name": "addToAllowList",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },

    /**
     * @notice Remove caller from allow list
     */
    {
        "inputs": [],
        "name": "removeFromAllowList",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },

    /**
     * @notice Check if address is in the allow list
     */
    {
        "inputs": [{ "internalType": "address", "name": "addr", "type": "address" }],
        "name": "isAllowListed",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },

    // State Variable Getters

    /**
     * @notice Get the last request ID
     */
    {
        "inputs": [],
        "name": "s_lastRequestId",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    },

    /**
     * @notice Get the last response data
     */
    {
        "inputs": [],
        "name": "s_lastResponse",
        "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
        "stateMutability": "view",
        "type": "function"
    },

    /**
     * @notice Get the last error information
     */
    {
        "inputs": [],
        "name": "s_lastError",
        "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
        "stateMutability": "view",
        "type": "function"
    },

    /**
     * @notice Get stored skills data
     */
    {
        "inputs": [],
        "name": "skillsData",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Constants

    /**
     * @notice Get router address
     */
    {
        "inputs": [],
        "name": "ROUTER_ADDR",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },

    /**
     * @notice Get DON ID
     */
    {
        "inputs": [],
        "name": "DON_ID",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    },

    /**
     * @notice Get callback gas limit
     */
    {
        "inputs": [],
        "name": "CALLBACK_GAS_LIMIT",
        "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }],
        "stateMutability": "view",
        "type": "function"
    },

    /**
     * @notice Get JavaScript source code
     */
    {
        "inputs": [],
        "name": "SOURCE",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// Export type definition
export type GetSkillPriceABI = typeof GET_SKILL_PRICE_ABI;

// Export alias for backward compatibility
export const GETSKILLPRICE_ABI = GET_SKILL_PRICE_ABI;