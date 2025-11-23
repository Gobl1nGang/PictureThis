import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as FileSystem from 'expo-file-system/legacy';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '@env';

const client = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export interface FilterPreset {
    name: string;
    description: string;
}

export const FILTER_PRESETS: Record<string, FilterPreset> = {
    vivid: {
        name: 'Vivid',
        description: 'Enhance colors to be more vibrant and saturated, increase contrast slightly, make the image pop with rich, bold colors',
    },
    warm: {
        name: 'Warm',
        description: 'Add warm tones with golden and orange hues, create a cozy sunset-like atmosphere, increase warmth and reduce cool tones',
    },
    cool: {
        name: 'Cool',
        description: 'Add cool blue and cyan tones, create a crisp, fresh atmosphere, reduce warm tones and enhance blues',
    },
    bw: {
        name: 'Black & White',
        description: 'Convert to high-contrast black and white, preserve detail and texture, create a classic monochrome look',
    },
    vintage: {
        name: 'Vintage',
        description: 'Apply vintage film look with faded colors, slight grain, warm sepia tones, and reduced contrast for a nostalgic feel',
    },
    dramatic: {
        name: 'Dramatic',
        description: 'Increase contrast dramatically, deepen shadows, enhance highlights, create a bold, high-impact look',
    },
};

/**
 * Apply image filter using AWS Bedrock
 * CURRENTLY DISABLED - Bedrock image models keep changing/deprecating or have content filters
 * Returns original image until we find a stable model
 */
export async function applyBedrockFilter(
    imageUri: string,
    filterPreset?: string,
    customDescription?: string,
    adjustments?: {
        exposure?: number;
        contrast?: number;
        saturation?: number;
        warmth?: number;
    }
): Promise<string> {
    try {
        // Read image as base64
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        // Build filter description
        let filterDescription = '';

        if (filterPreset && FILTER_PRESETS[filterPreset]) {
            filterDescription = FILTER_PRESETS[filterPreset].description;
        } else if (customDescription) {
            filterDescription = customDescription;
        }

        // Add adjustment descriptions
        const adjustmentDescriptions: string[] = [];
        if (adjustments) {
            if (adjustments.exposure && adjustments.exposure !== 0) {
                const direction = adjustments.exposure > 0 ? 'brighter' : 'darker';
                adjustmentDescriptions.push(`make the image ${direction} by ${Math.abs(adjustments.exposure)}%`);
            }
            if (adjustments.contrast && adjustments.contrast !== 0) {
                const direction = adjustments.contrast > 0 ? 'increase' : 'decrease';
                adjustmentDescriptions.push(`${direction} contrast by ${Math.abs(adjustments.contrast)}%`);
            }
            if (adjustments.saturation && adjustments.saturation !== 0) {
                const direction = adjustments.saturation > 0 ? 'more vibrant' : 'more muted';
                adjustmentDescriptions.push(`make colors ${direction} by ${Math.abs(adjustments.saturation)}%`);
            }
            if (adjustments.warmth && adjustments.warmth !== 0) {
                const direction = adjustments.warmth > 0 ? 'warmer with golden tones' : 'cooler with blue tones';
                adjustmentDescriptions.push(`make the image ${direction} by ${Math.abs(adjustments.warmth)}%`);
            }
        }

        const fullDescription = [filterDescription, ...adjustmentDescriptions]
            .filter(Boolean)
            .join(', ');

        // Use Stable Diffusion 3.5 Large
        // Prompt focused on color grading to preserve structure
        const prompt = `Photographic color grading: ${fullDescription}. Maintain exact image structure, composition, and subjects. Do not alter facial features or identity. High quality photo editing.`;

        const payload = {
            prompt: prompt,
            mode: "image-to-image",
            image: base64Image,
            strength: 0.20, // Lowered to 0.20 to strictly preserve facial features while allowing color changes
            seed: 0,
            output_format: "jpeg"
        };

        const command = new InvokeModelCommand({
            modelId: 'stability.sd3-5-large-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload),
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // SD3.5 returns image as base64 string directly in 'image' field or 'images' array?
        // Based on SD3 documentation, it returns 'image' (base64 string)
        // Let's handle both potential formats just in case
        let filteredBase64 = '';

        if (responseBody.image) {
            filteredBase64 = responseBody.image;
        } else if (responseBody.images && responseBody.images.length > 0) {
            filteredBase64 = responseBody.images[0];
        } else if (responseBody.artifacts && responseBody.artifacts.length > 0) {
            filteredBase64 = responseBody.artifacts[0].base64;
        } else {
            throw new Error('Unexpected response format from Bedrock SD3.5');
        }

        // Save filtered image to cache
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const filteredUri = `${cacheDir}filtered_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(filteredUri, filteredBase64, {
            encoding: 'base64',
        });

        return filteredUri;

    } catch (error) {
        console.error('Error applying Bedrock filter:', error);
        // Return original image if filtering fails
        return imageUri;
    }
}
