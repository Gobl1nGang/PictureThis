import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } from "@env";

const client = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export interface ImageAdjustments {
    exposure?: number;      // -100 to 100
    contrast?: number;      // -100 to 100
    highlights?: number;    // -100 to 100
    shadows?: number;       // -100 to 100
    saturation?: number;    // -100 to 100
    vibrance?: number;      // -100 to 100
    warmth?: number;        // -100 to 100
    sharpness?: number;     // 0 to 100
    clarity?: number;       // -100 to 100
    grain?: number;         // 0 to 100
    vignette?: number;      // 0 to 100
}

export interface AIEnhancementResult {
    adjustments: ImageAdjustments;
    suggestions: string[];
    reasoning: string;
}

/**
 * Analyze image and generate optimal adjustment parameters
 */
export const generateAIEnhancement = async (
    base64Image: string,
    contextType?: string,
    userPreferences?: {
        colorGrading?: 'Warm' | 'Cool' | 'Neutral' | 'Vibrant';
        style?: string;
    }
): Promise<AIEnhancementResult> => {
    const colorGrading = userPreferences?.colorGrading || 'Neutral';
    const style = userPreferences?.style || 'Natural';

    const prompt = `You are a professional photo editor. Analyze this image and provide optimal adjustment parameters.

CONTEXT: ${contextType || 'General'}
USER PREFERENCES:
- Color Grading: ${colorGrading}
- Style: ${style}

Analyze the image and provide adjustment values:
1. Exposure (-100 to 100): Adjust overall brightness
2. Contrast (-100 to 100): Adjust tonal range
3. Highlights (-100 to 100): Adjust bright areas
4. Shadows (-100 to 100): Adjust dark areas
5. Saturation (-100 to 100): Adjust color intensity
6. Vibrance (-100 to 100): Adjust muted colors
7. Warmth (-100 to 100): Adjust color temperature
8. Sharpness (0 to 100): Enhance detail
9. Clarity (-100 to 100): Adjust midtone contrast
10. Grain (0 to 100): Add film grain
11. Vignette (0 to 100): Darken edges

IMPORTANT:
- Provide values that enhance the image while maintaining natural look
- Consider the context type (Portrait needs different adjustments than Landscape)
- Apply user's color grading preference
- Be subtle - most values should be between -30 and 30
- Provide 2-3 specific suggestions for further improvement

Output format (JSON):
{
  "exposure": <number>,
  "contrast": <number>,
  "highlights": <number>,
  "shadows": <number>,
  "saturation": <number>,
  "vibrance": <number>,
  "warmth": <number>,
  "sharpness": <number>,
  "clarity": <number>,
  "grain": <number>,
  "vignette": <number>,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "reasoning": "Brief explanation of the adjustments"
}`;

    const modelId = "us.amazon.nova-lite-v1:0";

    try {
        const command = new ConverseCommand({
            modelId,
            messages: [
                {
                    role: "user",
                    content: [
                        { text: prompt },
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
                maxTokens: 500,
                temperature: 0.7,
                topP: 0.9,
            },
        });

        const response = await client.send(command);
        const text = response.output?.message?.content?.[0]?.text || "{}";

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                adjustments: {
                    exposure: result.exposure || 0,
                    contrast: result.contrast || 0,
                    highlights: result.highlights || 0,
                    shadows: result.shadows || 0,
                    saturation: result.saturation || 0,
                    vibrance: result.vibrance || 0,
                    warmth: result.warmth || 0,
                    sharpness: result.sharpness || 0,
                    clarity: result.clarity || 0,
                    grain: result.grain || 0,
                    vignette: result.vignette || 0,
                },
                suggestions: result.suggestions || [],
                reasoning: result.reasoning || "AI-generated enhancement",
            };
        }

        // Fallback if parsing fails
        return getDefaultEnhancement(contextType);
    } catch (error) {
        console.error("AI Enhancement Error:", error);
        return getDefaultEnhancement(contextType);
    }
};

/**
 * Get default enhancement based on context
 */
function getDefaultEnhancement(contextType?: string): AIEnhancementResult {
    const defaults: Record<string, ImageAdjustments> = {
        Portrait: {
            exposure: 5,
            contrast: 10,
            highlights: -10,
            shadows: 15,
            saturation: -5,
            vibrance: 10,
            warmth: 5,
            sharpness: 20,
            clarity: 15,
            grain: 0,
            vignette: 15,
        },
        Landscape: {
            exposure: 0,
            contrast: 15,
            highlights: -15,
            shadows: 10,
            saturation: 10,
            vibrance: 15,
            warmth: 0,
            sharpness: 25,
            clarity: 20,
            grain: 5,
            vignette: 10,
        },
        Product: {
            exposure: 10,
            contrast: 20,
            highlights: -5,
            shadows: 5,
            saturation: 5,
            vibrance: 10,
            warmth: 0,
            sharpness: 30,
            clarity: 25,
            grain: 0,
            vignette: 0,
        },
    };

    const adjustments = defaults[contextType || 'Portrait'] || defaults.Portrait;

    return {
        adjustments,
        suggestions: [
            "Try adjusting warmth for better color tone",
            "Consider cropping to improve composition",
        ],
        reasoning: "Default enhancement based on photo type",
    };
}
