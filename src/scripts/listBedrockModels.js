const { BedrockClient, ListFoundationModelsCommand } = require('@aws-sdk/client-bedrock');

// Hardcoded credentials for the script execution since @env won't work in standalone node script easily
// We'll read them from the process env if running in the app context, but here we'll just use the ones we know are in the project
// Actually, I'll just use the AWS SDK's default credential provider chain or pass them if I can read the .env file.
// Let's try to read the .env file manually.

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
let region = 'us-east-1';
let accessKeyId = '';
let secretAccessKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('AWS_REGION=')) region = line.split('=')[1].trim();
        if (line.startsWith('AWS_ACCESS_KEY_ID=')) accessKeyId = line.split('=')[1].trim();
        if (line.startsWith('AWS_SECRET_ACCESS_KEY=')) secretAccessKey = line.split('=')[1].trim();
    }
} catch (e) {
    console.error('Could not read .env file', e);
}

const client = new BedrockClient({
    region: region,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    }
});

async function listModels() {
    try {
        const command = new ListFoundationModelsCommand({});
        const response = await client.send(command);

        console.log('Available Image Models:');
        response.modelSummaries.forEach(model => {
            if (model.outputModalities.includes('IMAGE')) {
                console.log(`- ${model.modelName} (ID: ${model.modelId}) - Status: ${model.modelLifecycle.status}`);
            }
        });
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
