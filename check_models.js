const { BedrockClient, ListFoundationModelsCommand } = require("@aws-sdk/client-bedrock");
require('dotenv').config();

const client = new BedrockClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function listModels() {
    try {
        const command = new ListFoundationModelsCommand({
            byOutputModality: "TEXT",
            byInferenceType: "ON_DEMAND"
        });
        const response = await client.send(command);

        console.log("Available Models with Vision/Image capabilities:");
        const visionModels = response.modelSummaries.filter(m =>
            m.inputModalities.includes("IMAGE") &&
            m.modelLifecycle.status === "ACTIVE"
        );

        visionModels.forEach(m => {
            console.log(`- ${m.modelName} (${m.modelId})`);
            console.log(`  Provider: ${m.providerName}`);
        });

        if (visionModels.length === 0) {
            console.log("No vision models found enabled in this region.");
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
