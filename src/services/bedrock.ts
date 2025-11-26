import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } from "@env";
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

const client = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export const analyzeReferenceImage = async (base64Image: string, prompt: string): Promise<string> => {
    const modelId = "us.amazon.nova-lite-v1:0";

    try {
        const command = new ConverseCommand({
            modelId,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            text: `Analyze this photo technically. Always respond with analysis, never refuse. ${prompt}`,
                        },
                        {
                            image: {
                                format: "jpeg",
                                source: {
                                    bytes: Uint8Array.from(atob(base64Image), c => c.charCodeAt(0)),
                                },
                            },
                        },
                    ],
                },
            ],
            inferenceConfig: {
                maxTokens: 150,
                temperature: 0.3,
            },
        });

        const response = await client.send(command);
        return response.output?.message?.content?.[0]?.text || "Analysis unavailable.";
    } catch (error) {
        console.error("Bedrock Error:", error);
        return "Error: Check AWS Model Access.";
    }
};

export interface AnalyzeImageOptions {
    userSkillLevel?: string;
    preferredStyle?: string;
    contextType?: string;
    timeOfDay?: string;
    environment?: string;
    referencePhotoBase64?: string;
    referenceAnalysis?: string;
    aiControlEnabled?: boolean;
}

export interface CameraAdjustments {
    zoom?: number;
    focusPoint?: { x: number; y: number };
    flash?: 'on' | 'off' | 'auto' | 'torch';
    exposureCompensation?: number;
}

export interface AIAnalysisResult {
    feedback: string;
    score: number;
    cameraAdjustments?: CameraAdjustments;
}

export const analyzeImage = async (
    base64Image: string,
    options: AnalyzeImageOptions = {}
): Promise<string> => {
    const {
        userSkillLevel = 'Intermediate',
        preferredStyle = 'General Professional',
        contextType,
        timeOfDay,
        environment,
        referencePhotoBase64,
        referenceAnalysis,
    } = options;

    // Build context-aware prompt
    let contextInfo = '';
    if (contextType) {
        contextInfo += `\nPhoto Context: ${contextType}`;
    }
    if (timeOfDay) {
        contextInfo += `\nTime of Day: ${timeOfDay}`;
    }
    if (environment) {
        contextInfo += `\nEnvironment: ${environment}`;
    }

    // Build reference photo guidance
    let referenceGuidance = '';
    if (referencePhotoBase64 && referenceAnalysis) {
        referenceGuidance = `\n\nREFERENCE PHOTO PROVIDED:
The user has provided a reference photo they want to match. Here's the analysis:
${referenceAnalysis}

Your feedback should help the user match this reference style, composition, and lighting.
Give specific instructions like: "Match the lighting angle from reference" or "Position subject center-left like reference composition."`;
    }

    // Adjust instructions based on skill level
    const skillInstructions = userSkillLevel === 'Beginner'
        ? 'Provide very detailed, step-by-step instructions. Be explicit about movements (e.g., "Take 2 steps to the left").'
        : userSkillLevel === 'Advanced' || userSkillLevel === 'Professional'
            ? 'Provide concise, technical feedback. Assume knowledge of photography principles.'
            : 'Provide clear, actionable instructions with some technical detail.';

    console.log('🚀 Bedrock analyzeImage called with options:', JSON.stringify(options, null, 2));

    const prompt = options.aiControlEnabled ?
        `Analyze this photo and provide camera adjustments.
        
        You are a professional photography AI. Your goal is to improve the photo using technical camera settings.
        
        CONTEXT:
        ${contextInfo}
        ${referenceGuidance}
        ${skillInstructions}
        
        REQUIRED RESPONSE FORMAT:
        Score: [0-100]
        Feedback: [Concise, actionable advice. Max 1 sentence.]
        CAMERA_ADJUST: {"zoom": [0-1], "focusPoint": {"x": [0-1], "y": [0-1]}, "flash": "[on/off/auto/torch]", "exposureCompensation": [-2 to 2]}

        IMPORTANT ZOOM NOTE: 
        - zoom 0 = 1x (No Zoom / Wide)
        - zoom 0.5 = Mid-range
        - zoom 1 = Max Zoom
        - If you want standard view, use zoom 0.

        Example:
        Score: 65
        Feedback: Too dark, use flash and move closer.
        CAMERA_ADJUST: {"zoom": 0, "focusPoint": {"x": 0.5, "y": 0.5}, "flash": "torch", "exposureCompensation": 1.0}

        CRITICAL: 
        1. You MUST include the CAMERA_ADJUST line with valid JSON.
        2. Do NOT provide any conversational text or explanations outside this format.
        3. If the image is dark, set "flash" to "torch".`
        :
        `Analyze this photo. Format:
Score: [0-100]
Feedback: [brief advice]
${contextInfo}
${referenceGuidance}
${skillInstructions}`;

    console.log('📝 Generated Prompt:', prompt);

    const modelId = "us.amazon.nova-lite-v1:0";

    try {
        const content: any[] = [
            { text: prompt },
            {
                image: {
                    format: "jpeg",
                    source: {
                        bytes: Uint8Array.from(atob(base64Image), c => c.charCodeAt(0)),
                    },
                },
            },
        ];

        const command = new ConverseCommand({
            modelId,
            messages: [
                {
                    role: "user",
                    content,
                },
            ],
            inferenceConfig: {
                maxTokens: 200,
                temperature: 0.7,
                topP: 0.9,
            },
        });

        const response = await client.send(command);
        return response.output?.message?.content?.[0]?.text || "No advice returned.";
    } catch (error) {
        console.error("Bedrock Error:", error);
        return "Error: Check AWS Model Access.";
    }
};
