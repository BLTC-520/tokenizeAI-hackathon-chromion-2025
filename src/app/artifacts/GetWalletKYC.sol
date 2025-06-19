// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ERC721} from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.5/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title KYCAccessNFT
 * @notice This contract verifies wallet KYC status and mints access NFTs
 * WARNING: This is an example contract that uses un-audited code. Do not use in production.
 */
contract KYCAccessNFT is FunctionsClient, ERC721URIStorage {
    using FunctionsRequest for FunctionsRequest.Request;

    // Chainlink Functions variables
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    
    // NFT and KYC tracking
    uint256 public tokenIdCounter;
    mapping(address => bool) public hasMinted;
    mapping(address => uint256) public walletToTokenId;
    mapping(uint256 => uint8) public tokenKYCLevel;
    mapping(bytes32 => address) private requestIdToWallet;
    
    // Access control
    mapping(address => bool) private operators;
    
    // Events
    event KYCVerificationRequested(bytes32 indexed requestId, address indexed wallet);
    event KYCVerificationCompleted(bytes32 indexed requestId, address indexed wallet, bool isVerified, uint8 kycLevel);
    event NFTMinted(address indexed recipient, uint256 tokenId, uint8 kycLevel);
    event Response(bytes32 indexed requestId, bytes response, bytes err);

    error UnexpectedRequestID(bytes32 requestId);
    error WalletAlreadyMinted(address wallet);
    error KYCNotVerified(address wallet);
    error Unauthorized();

    // KYC Level metadata URIs (stored on IPFS)
    mapping(uint8 => string) public kycLevelToTokenUri;
    string constant KYC_LEVEL_1_METADATA = "https://gateway.pinata.cloud/ipfs/bafkreicz2b6j5t3lzo5lpqohfrcza2isbcplzy7htorm3zmyuc2ra7yxee";
    string constant KYC_LEVEL_2_METADATA = "https://gateway.pinata.cloud/ipfs/bafkreigrn7oxcjgdhwu744ontri3ojtu6kxes7bx5u37y2ho3zyabxayfa";
    string constant KYC_LEVEL_3_METADATA = "https://gateway.pinata.cloud/ipfs/bafkreig3a2mzqcrt3o5v6xxdp5h4hlnovcysg5dsq4qphgpflaxbddiobe";

    // Chainlink Functions configuration for Avalanche Fuji
    address public constant ROUTER_ADDR = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    bytes32 public constant DON_ID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    uint32 public constant CALLBACK_GAS_LIMIT = 300_000;

    // JavaScript code to verify KYC status in Supabase
    // IMPORTANT: Replace <SUPABASE_URL> with your actual Supabase URL
    string public constant SOURCE =
        "const walletAddress = args[0].toLowerCase();"
        'if(!secrets.apikey) { throw Error("Error: Supabase API Key is not set!") };'
        'if(!secrets.supabaseUrl) { throw Error("Error: Supabase URL is not set!") };'
        "const apikey = secrets.apikey;"
        "const supabaseUrl = secrets.supabaseUrl;"
        "const apiResponse = await Functions.makeHttpRequest({"
        'url: `${supabaseUrl}/rest/v1/wallet_kyc?wallet_address=ilike.${walletAddress}&select=wallet_address,is_kyc_verified,kyc_level,kyc_status,nft_token_id`,'
        'method: "GET",'
        'headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` }'
        "});"
        "if (apiResponse.error) {"
        "console.error(apiResponse.error);"
        'throw Error("Request failed: " + apiResponse.message);'
        "};"
        "const { data } = apiResponse;"
        "if(data.length === 0) {"
        'return Functions.encodeString("NOT_FOUND");'
        "};"
        "const walletData = data[0];"
        "if(walletData.nft_token_id !== null) {"
        'return Functions.encodeString("ALREADY_MINTED");'
        "};"
        "if(walletData.is_kyc_verified && walletData.kyc_status === 'approved') {"
        'return Functions.encodeString(`VERIFIED:${walletData.kyc_level}`);'
        "} else {"
        'return Functions.encodeString(`NOT_VERIFIED:${walletData.kyc_status}`);'
        "}";

    constructor() FunctionsClient(ROUTER_ADDR) ERC721("KYC Access Pass", "KYCPASS") {
        operators[msg.sender] = true;
        
        // Initialize KYC level metadata
        kycLevelToTokenUri[1] = KYC_LEVEL_1_METADATA;
        kycLevelToTokenUri[2] = KYC_LEVEL_2_METADATA;
        kycLevelToTokenUri[3] = KYC_LEVEL_3_METADATA;
    }

    /**
     * @notice Request KYC verification for a wallet
     * @param walletAddress The wallet address to verify
     * @param donHostedSecretsSlotID DON hosted secrets slot ID
     * @param donHostedSecretsVersion DON hosted secrets version
     * @param subscriptionId Chainlink Functions subscription ID
     */
    function requestKYCVerification(
        address walletAddress,
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        uint64 subscriptionId
    ) external returns (bytes32 requestId) {
        // Check if NFT already minted
        if (hasMinted[walletAddress]) {
            revert WalletAlreadyMinted(walletAddress);
        }

        // Prepare arguments
        string[] memory args = new string[](1);
        args[0] = addressToString(walletAddress);

        // Build and send request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);
        
        if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(
                donHostedSecretsSlotID,
                donHostedSecretsVersion
            );
        }
        
        req.setArgs(args);
        
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            CALLBACK_GAS_LIMIT,
            DON_ID
        );

        requestIdToWallet[s_lastRequestId] = walletAddress;
        
        emit KYCVerificationRequested(s_lastRequestId, walletAddress);
        
        return s_lastRequestId;
    }

    /**
     * @notice Callback function for Chainlink Functions
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        
        s_lastResponse = response;
        s_lastError = err;
        
        emit Response(requestId, s_lastResponse, s_lastError);

        // Handle errors
        if (err.length > 0) {
            return;
        }

        address walletAddress = requestIdToWallet[requestId];
        string memory responseStr = string(response);
        
        // Parse response
        if (keccak256(response) == keccak256(bytes("NOT_FOUND"))) {
            emit KYCVerificationCompleted(requestId, walletAddress, false, 0);
            return;
        }
        
        if (keccak256(response) == keccak256(bytes("ALREADY_MINTED"))) {
            emit KYCVerificationCompleted(requestId, walletAddress, true, 0);
            return;
        }
        
        // Check if verified
        if (startsWith(responseStr, "VERIFIED:")) {
            uint8 kycLevel = parseKYCLevel(responseStr);
            if (kycLevel > 0 && kycLevel <= 3) {
                _mintKYCNFT(walletAddress, kycLevel);
                emit KYCVerificationCompleted(requestId, walletAddress, true, kycLevel);
            }
        } else {
            emit KYCVerificationCompleted(requestId, walletAddress, false, 0);
        }
    }

    /**
     * @notice Mint KYC NFT to verified wallet
     */
    function _mintKYCNFT(address to, uint8 kycLevel) internal {
        uint256 newTokenId = tokenIdCounter;
        tokenIdCounter++;
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, kycLevelToTokenUri[kycLevel]);
        
        hasMinted[to] = true;
        walletToTokenId[to] = newTokenId;
        tokenKYCLevel[newTokenId] = kycLevel;
        
        emit NFTMinted(to, newTokenId, kycLevel);
    }

    /**
     * @notice Update Supabase with NFT information
     * @dev This would be called by backend service after NFT is minted
     */
    function updateNFTInDatabase(
        address walletAddress,
        string memory transactionHash
    ) external onlyOperator {
        // This function would trigger another Chainlink Functions call
        // to update the Supabase database with NFT information
        // Implementation depends on your backend architecture
    }

    /**
     * @notice Check if wallet has KYC NFT
     */
    function hasKYCAccess(address wallet) public view returns (bool) {
        return hasMinted[wallet] && balanceOf(wallet) > 0;
    }

    /**
     * @notice Get KYC level for wallet
     */
    function getKYCLevel(address wallet) public view returns (uint8) {
        if (!hasKYCAccess(wallet)) return 0;
        uint256 tokenId = walletToTokenId[wallet];
        return tokenKYCLevel[tokenId];
    }

    /**
     * @notice Update metadata URI for KYC level
     */
    function updateKYCLevelURI(uint8 level, string memory uri) external onlyOperator {
        require(level > 0 && level <= 3, "Invalid KYC level");
        kycLevelToTokenUri[level] = uri;
    }

    /**
     * @notice Override transfer to make NFT non-transferable (Soulbound)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        require(from == address(0), "KYC NFT is non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // Access control functions
    function addOperator(address operator) external onlyOperator {
        operators[operator] = true;
    }

    function removeOperator(address operator) external onlyOperator {
        operators[operator] = false;
    }

    modifier onlyOperator() {
        if (!operators[msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    // Utility functions
    function addressToString(address addr) internal pure returns (string memory) {
        bytes20 value = bytes20(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (prefixBytes.length > strBytes.length) {
            return false;
        }
        
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }
        return true;
    }

    function parseKYCLevel(string memory response) internal pure returns (uint8) {
        bytes memory responseBytes = bytes(response);
        // Response format: "VERIFIED:X" where X is the KYC level
        if (responseBytes.length > 9) {
            uint8 level = uint8(responseBytes[9]) - 48; // Convert ASCII to number
            return level;
        }
        return 0;
    }
}