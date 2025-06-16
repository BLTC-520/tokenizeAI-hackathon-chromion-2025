// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * GetSkillPrice Contract - Fixed Version
 * Matches your actual Supabase database structure
 */
contract GetSkillPrice is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    string public skillsData;
    mapping(address => bool) private allowList;
    mapping(bytes32 => address) private reqIdToAddr;
    mapping(bytes32 => string) private reqIdToRequestType;

    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);
    event SkillDataUpdated(uint256 timestamp, string queryType);

    // Hardcode for Avalanche Fuji testnet
    address public constant ROUTER_ADDR =
        0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    bytes32 public constant DON_ID =
        0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    uint32 public constant CALLBACK_GAS_LIMIT = 300_000;

    // Fixed JavaScript code - matches your actual database structure
    string public constant SOURCE =
        'if(!secrets.apikey) { throw Error("Error: Supabase API Key is not set!") };'
        "const apikey = secrets.apikey;"
        
        // Determine query type
        "let isDetailedQuery = false;"
        "let targetSkill = '';"
        "if (args && args.length >= 2) {"
        "for (let i = 0; i < args.length; i += 2) {"
        "if (args[i] === 'detail' && args[i + 1]) {"
        "isDetailedQuery = true;"
        "targetSkill = args[i + 1];"
        "break;"
        "}"
        "}"
        "}"
        
        // Build query URL - using correct table and column names
        "let query, selectFields;"
        "if (isDetailedQuery) {"
        // Detailed query: get all fields for specific skill
        "selectFields = 'skill,average_hourly_rate,demand_level,market_trend,competition_level,project_volume,region_multiplier';"
        "query = `https://wtsruzsccudercdaxbmp.supabase.co/rest/v1/skill_market_data?select=${selectFields}&skill=ilike.*${targetSkill}*&limit=1`;"
        "} else {"
        // List query: use compressed format
        "selectFields = 'skill,average_hourly_rate';"
        "query = `https://wtsruzsccudercdaxbmp.supabase.co/rest/v1/skill_market_data?select=${selectFields}`;"
        
        // Parse query parameters
        "let conditions = [];"
        "let orderClause = '';"
        "let limitClause = '';"
        
        "if (args && args.length >= 2) {"
        "for (let i = 0; i < args.length; i += 2) {"
        "const key = args[i];"
        "const value = args[i + 1];"
        "if (!value || key === 'detail') continue;"
        
        "switch(key) {"
        "case 'limit': "
        "const limitNum = parseInt(value);"
        "if (limitNum > 0 && limitNum <= 20) limitClause = `&limit=${limitNum}`;"
        "break;"
        "case 'min_rate': "
        "const minRate = parseFloat(value);"
        "if (minRate >= 0) conditions.push(`average_hourly_rate=gte.${minRate}`);"
        "break;"
        "case 'max_rate': "
        "const maxRate = parseFloat(value);"
        "if (maxRate > 0) conditions.push(`average_hourly_rate=lte.${maxRate}`);"
        "break;"
        "case 'trend': "
        "if (value.length > 0) conditions.push(`market_trend=eq.${value}`);"
        "break;"
        "case 'demand_min': "
        "const demandMin = parseFloat(value);"
        "if (demandMin >= 0) conditions.push(`demand_level=gte.${demandMin}`);"
        "break;"
        "case 'sort': "
        "if (value === 'desc') orderClause = '&order=average_hourly_rate.desc';"
        "else if (value === 'asc') orderClause = '&order=average_hourly_rate.asc';"
        "break;"
        "case 'skill': "
        "if (value.length > 0) conditions.push(`skill=ilike.*${value}*`);"
        "break;"
        "}"
        "}"
        "}"
        
        // Build final query URL
        "if (conditions.length > 0) {"
        "query += '&' + conditions.join('&');"
        "}"
        "query += orderClause + limitClause;"
        "}"
        
        // Add debug logging
        "console.log('Query URL:', query);"
        
        // Send HTTP request to Supabase
        "const apiResponse = await Functions.makeHttpRequest({"
        "url: query,"
        'method: "GET",'
        'headers: { '
        '"apikey": apikey,'
        '"Authorization": "Bearer " + apikey,'
        '"Content-Type": "application/json"'
        '}'
        "});"
        
        // Enhanced error handling
        "if (apiResponse.error) {"
        'console.log("HTTP Error:", apiResponse.error);'
        'throw Error("Request failed: " + JSON.stringify(apiResponse.error));'
        "};"
        
        "if (!apiResponse.data) {"
        'console.log("No data in response");'
        'throw Error("No data received from Supabase");'
        "};"
        
        // Process response data
        "const data = apiResponse.data;"
        'console.log("Data received:", JSON.stringify(data));'
        
        'if(!data || data.length === 0) {'
        'console.log("Empty data array");'
        'return Functions.encodeString("no data");'
        '};'
        
        // Format output based on query type
        "if (isDetailedQuery && data.length > 0) {"
        // Return detailed information
        "const skill = data[0];"
        "const detailInfo = {"
        'name: skill.skill || "Unknown",'
        'rate: skill.average_hourly_rate || 0,'
        'demand: skill.demand_level || 0,'
        'trend: skill.market_trend || "stable",'
        'competition: skill.competition_level || 0,'
        'volume: skill.project_volume || 0,'
        'multiplier: skill.region_multiplier || 1.0'
        "};"
        'console.log("Returning detailed info:", JSON.stringify(detailInfo));'
        "return Functions.encodeString(JSON.stringify(detailInfo));"
        "} else {"
        // Return compressed list format
        "const result = data.map(item => {"
        'const name = item.skill ? item.skill.substring(0,12) : "Unknown";'
        'const rate = item.average_hourly_rate || 0;'
        "return name + '|' + rate;"
        "}).join(',');"
        'console.log("Returning compressed list:", result);'
        "return Functions.encodeString(result);"
        "}";

    constructor() FunctionsClient(ROUTER_ADDR) {
        allowList[msg.sender] = true;
    }

    /**
     * @notice Send flexible request to get skill market data
     * @param donHostedSecretsSlotID DON hosted secrets slot ID (usually 0)
     * @param donHostedSecretsVersion DON hosted secrets version
     * @param args Query parameter key-value pairs
     * @param subscriptionId Chainlink Functions subscription ID
     * 
     * @dev Args format: ["key1", "value1", "key2", "value2", ...]
     * Supported keys:
     * - "detail": skill name (to get detailed information)
     * - "limit": number of results (1-20, optional)
     * - "min_rate": minimum hourly rate filter
     * - "max_rate": maximum hourly rate filter  
     * - "trend": market trend filter (stable/growing/surging)
     * - "demand_min": minimum demand level filter
     * - "sort": sorting method (desc/asc)
     * - "skill": search skill name (fuzzy matching)
     */
    function sendRequest(
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        string[] memory args,
        uint64 subscriptionId
    ) external onlyAllowList returns (bytes32 requestId) {
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);
        
        if (donHostedSecretsVersion > 0)
            req.addDONHostedSecrets(
                donHostedSecretsSlotID,
                donHostedSecretsVersion
            );
            
        if (args.length > 0) req.setArgs(args);
            
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            CALLBACK_GAS_LIMIT,
            DON_ID
        );

        reqIdToAddr[s_lastRequestId] = msg.sender;
        
        string memory queryType = _buildQueryDescription(args);
        reqIdToRequestType[s_lastRequestId] = queryType;
        
        return s_lastRequestId;
    }

    /**
     * @notice Store latest result/error
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

        if (keccak256(response) == keccak256(bytes("no data"))) return;

        if (err.length == 0 && response.length > 0) {
            skillsData = string(response);
            string memory queryType = reqIdToRequestType[requestId];
            emit SkillDataUpdated(block.timestamp, queryType);
        }
    }

    /**
     * @notice Get the latest skill market data
     */
    function getSkillsData() external view returns (string memory) {
        return skillsData;
    }

    /**
     * @notice Get detailed information guidance for a specific skill
     */
    function getSkillDetailInstructions(string memory skillName) external pure returns (string memory) {
        return string(abi.encodePacked(
            "To get detailed info for '", skillName, "', call: sendRequest(slotId, version, ['detail', '", skillName, "'], subscriptionId)"
        ));
    }

    /**
     * @notice Get query help information
     */
    function getQueryHelp() external pure returns (string memory) {
        return "Args examples: "
               "For detailed info: ['detail','blockchain'] "
               "For all skills sorted: ['sort','desc'] "
               "For filtered lists: ['trend','surging','min_rate','100'] "
               "Keys: detail(skill_name), limit(1-20), min_rate/max_rate(number), "
               "trend(stable/growing/surging), demand_min(number), sort(desc/asc), skill(partial_name)";
    }

    /**
     * @notice Add address to allow list
     */
    function addToAllowList(address addrToAdd) external onlyAllowList {
        allowList[addrToAdd] = true;
    }

    /**
     * @notice Remove caller from allow list
     */
    function removeFromAllowList() external onlyAllowList {
        allowList[msg.sender] = false;
    }

    /**
     * @notice Check if address is in the allow list
     */
    function isAllowListed(address addr) external view returns (bool) {
        return allowList[addr];
    }

    /**
     * @notice Build query description
     */
    function _buildQueryDescription(string[] memory args) internal pure returns (string memory) {
        if (args.length == 0) {
            return "default_query";
        }
        
        for (uint i = 0; i < args.length; i += 2) {
            if (i + 1 < args.length && 
                keccak256(bytes(args[i])) == keccak256(bytes("detail"))) {
                return string(abi.encodePacked("detail_query:", args[i + 1]));
            }
        }
        
        string memory description = "list_query";
        for (uint i = 0; i < args.length && i < 6; i += 2) {
            if (i + 1 < args.length) {
                description = string(abi.encodePacked(description, "_", args[i], ":", args[i+1]));
            }
        }
        return description;
    }

    modifier onlyAllowList() {
        require(
            allowList[msg.sender],
            "you do not have permission to call the function"
        );
        _;
    }
}