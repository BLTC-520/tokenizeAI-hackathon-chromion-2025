// scripts/upload-secrets-fixed-cjs.js
// CommonJS version – Compatible with your GetSkillPrice contract

const { SecretsManager } = require("@chainlink/functions-toolkit");
const { ethers } = require("ethers");
const fs = require("fs");

async function uploadSecretsFixed() {
    console.log("🚀 Uploading Secrets for GetSkillPrice Contract\n");

    // Configuration
    const PRIVATE_KEY = "91221f54efb04f558c0535c80d16b28775331596606bd4526e29ca4375297fe6";
    const RPC_URL = "https://avax-fuji.g.alchemy.com/v2/ZDRXbJd_qraq5rTvWv4Qv";
    const FUNCTIONS_ROUTER_ADDRESS = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const DON_ID = "fun-avalanche-fuji-1";

    // Chainlink Gateway URLs
    const gatewayUrls = [
        "https://01.functions-gateway.testnet.chain.link/",
        "https://02.functions-gateway.testnet.chain.link/",
    ];

    const slotIdNumber = 0;
    const expirationTimeMinutes = 1440; // 24 hours

    // Your Supabase API key
    const secrets = {
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0c3J1enNjY3VkZXJjZGF4Ym1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDYwOTQsImV4cCI6MjA2NTMyMjA5NH0.bN8vI9syCe_6XkXpZ79HLyyuIhP5gXJu0K9JO_Uqr48"
    };

    try {
        console.log("🔗 Setting up connection...");

        // Handle ethers version differences
        let provider, signer;

        if (ethers.version && ethers.version.startsWith('6')) {
            // ethers v6
            provider = new ethers.JsonRpcProvider(RPC_URL);
            signer = new ethers.Wallet(PRIVATE_KEY, provider);
        } else {
            // ethers v5
            provider = new ethers.providers.JsonRpcProvider(RPC_URL);
            const wallet = new ethers.Wallet(PRIVATE_KEY);
            signer = wallet.connect(provider);
        }

        console.log("🔑 Connected wallet:", signer.address);

        // Check wallet balance
        const balance = await provider.getBalance(signer.address);
        const formatBalance = ethers.utils ?
            ethers.utils.formatEther(balance) :
            ethers.formatEther(balance);
        console.log("💰 AVAX Balance:", formatBalance);

        // Create a SecretsManager
        console.log("📦 Initializing SecretsManager...");
        const secretsManager = new SecretsManager({
            signer: signer,
            functionsRouterAddress: FUNCTIONS_ROUTER_ADDRESS,
            donId: DON_ID,
        });

        await secretsManager.initialize();
        console.log("✅ SecretsManager initialized");

        // Encrypt the secrets
        console.log("🔐 Encrypting secrets...");
        const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);
        console.log("✅ Secrets encrypted");

        // Upload secrets to DON
        console.log(`📤 Uploading to DON gateways...`);
        console.log(`📋 Slot ID: ${slotIdNumber}`);
        console.log(`⏰ Expiration: ${expirationTimeMinutes} minutes`);

        const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
            encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
            gatewayUrls: gatewayUrls,
            slotId: slotIdNumber,
            minutesUntilExpiration: expirationTimeMinutes,
        });

        if (!uploadResult.success) {
            throw new Error(`Failed to upload secrets: ${JSON.stringify(uploadResult)}`);
        }

        console.log("🎉 Secrets uploaded successfully!");
        console.log("📋 Upload result:", uploadResult);

        const donHostedSecretsVersion = parseInt(uploadResult.version);

        // Save metadata to file
        const secretsInfo = {
            slotId: slotIdNumber.toString(),
            version: donHostedSecretsVersion.toString(),
            expirationTimeMinutes: expirationTimeMinutes.toString(),
            uploadTimestamp: new Date().toISOString(),
            gatewayUrls: gatewayUrls,
            success: true,
            contractAddress: "0x5f6b3e64a1823ab48bf4acb8b3716ac7b77defb1",
            subscriptionId: "15603"
        };

        fs.writeFileSync(
            "donSecretsInfo.json",
            JSON.stringify(secretsInfo, null, 2)
        );

        console.log("💾 Secrets info saved to donSecretsInfo.json");

        return {
            success: true,
            slotId: slotIdNumber,
            version: donHostedSecretsVersion,
            expirationTime: expirationTimeMinutes,
            uploadResult: uploadResult
        };

    } catch (error) {
        console.error("❌ Error uploading secrets:", error);

        // Detailed error handling and suggestions
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes("insufficient balance") || errorMsg.includes("subscription")) {
            console.log("\n💡 Subscription troubleshooting:");
            console.log("1. Go to https://functions.chain.link");
            console.log("2. Check the LINK balance of subscription ID: 15603");
            console.log("3. Make sure it has at least 2 LINK available for uploading secrets");
            console.log("4. Ensure your wallet is the owner of the subscription");

        } else if (errorMsg.includes("signer") || errorMsg.includes("provider") || errorMsg.includes("argument")) {
            console.log("\n💡 Ethers.js compatibility fix:");
            console.log("1. Try downgrading ethers: npm install ethers@5.7.2");
            console.log("2. Or upgrade the toolkit: npm install @chainlink/functions-toolkit@latest");
            console.log("3. Clean and reinstall: rm -rf node_modules && npm install");

        } else if (errorMsg.includes("network") || errorMsg.includes("timeout")) {
            console.log("\n💡 Network issue suggestions:");
            console.log("1. Check your internet connection");
            console.log("2. Verify if the RPC URL is accessible");
            console.log("3. Try again later");

        } else if (errorMsg.includes("gateway") || errorMsg.includes("upload")) {
            console.log("\n💡 Gateway upload issue suggestions:");
            console.log("1. Check Chainlink service status");
            console.log("2. Retry uploading later");
            console.log("3. Consider using the GitHub Gist method for secrets");
        }

        throw error;
    }
}

// Run script if called directly
if (require.main === module) {
    console.log("🌟 Starting Secrets Upload for GetSkillPrice Contract");
    console.log("This will upload your Supabase API key to Chainlink DON");
    console.log("============================================================");

    uploadSecretsFixed()
        .then((result) => {
            console.log("\n🎉 SECRETS UPLOAD COMPLETED!");
            console.log("============================================================");
            console.log("📊 Summary:");
            console.log(`   ✅ Success: ${result.success}`);
            console.log(`   📋 Slot ID: ${result.slotId}`);
            console.log(`   🔢 Version: ${result.version}`);
            console.log(`   ⏰ Expires in: ${result.expirationTime} minutes`);

            console.log("\n📝 Contract Call Parameters:");
            console.log(`   donHostedSecretsSlotID: ${result.slotId}`);
            console.log(`   donHostedSecretsVersion: ${result.version}`);

            console.log("\n🔧 Example Contract Call:");
            console.log(`   await contract.sendRequest(`);
            console.log(`     ${result.slotId}, // slotId`);
            console.log(`     ${result.version}, // version`);
            console.log(`     ["limit", "10", "sort", "desc"], // args`);
            console.log(`     15603 // subscriptionId`);
            console.log(`   );`);

            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Secrets upload failed:", error.message);

            console.log("\n🔄 Alternative Solutions:");
            console.log("1. Try the GitHub Gist method (more stable)");
            console.log("2. Use a version of the contract that doesn't rely on secrets");
            console.log("3. Check your Chainlink subscription configuration");

            console.log("\n✅ Reminder: Your Supabase system is still fully usable!");

            process.exit(1);
        });
}

module.exports = { uploadSecretsFixed };
