import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ImageAdjustments, generateAIEnhancement } from './imageEnhancement';

export interface AIProcessedImage {
    originalUri: string;
    enhancedUri: string;
    adjustments: ImageAdjustments;
    suggestions: string[];
    reasoning: string;
}

/**
 * Automatically apply AI recommendations to a captured image
 */
export const processImageWithAI = async (
    imageUri: string,
    contextType?: string,
    userPreferences?: {
        colorGrading?: 'Warm' | 'Cool' | 'Neutral' | 'Vibrant';
        style?: string;
    }
): Promise<AIProcessedImage> => {
    try {
        // First, get AI enhancement recommendations
        const manipResult = await manipulateAsync(
            imageUri,
            [{ resize: { width: 800 } }],
            { compress: 0.5, format: SaveFormat.JPEG, base64: true }
        );

        if (!manipResult.base64) {
            throw new Error('Failed to get base64 image');
        }

        const enhancement = await generateAIEnhancement(
            manipResult.base64,
            contextType,
            userPreferences
        );

        // Apply basic adjustments using expo-image-manipulator
        // Note: This is limited but provides some enhancement
        const enhancedUri = await applyBasicEnhancements(imageUri, enhancement.adjustments);

        return {
            originalUri: imageUri,
            enhancedUri,
            adjustments: enhancement.adjustments,
            suggestions: enhancement.suggestions,
            reasoning: enhancement.reasoning,
        };
    } catch (error) {
        console.error('AI processing error:', error);
        // Return original image if processing fails
        return {
            originalUri: imageUri,
            enhancedUri: imageUri,
            adjustments: {},
            suggestions: ['Processing failed - using original image'],
            reasoning: 'AI processing unavailable',
        };
    }
};

/**
 * Apply basic enhancements using expo-image-manipulator
 * Limited to operations available in the library
 */
async function applyBasicEnhancements(
    imageUri: string,
    adjustments: ImageAdjustments
): Promise<string> {
    try {
        const operations: any[] = [];

        // Apply sharpening if needed (simulated with resize)
        if (adjustments.sharpness && adjustments.sharpness > 0) {
            operations.push({ resize: { width: 2000 } });
        }

        // Apply the operations
        const result = await manipulateAsync(
            imageUri,
            operations,
            { 
                compress: 0.95, 
                format: SaveFormat.JPEG 
            }
        );

        return result.uri;
    } catch (error) {
        console.error('Enhancement application error:', error);
        return imageUri;
    }
}

/**
 * Create adjustment sliders data from AI recommendations
 */
export const createAdjustmentSliders = (adjustments: ImageAdjustments) => {
    const sliders = [];

    if (adjustments.exposure !== undefined && adjustments.exposure !== 0) {
        sliders.push({
            key: 'exposure',
            label: 'Exposure',
            value: adjustments.exposure,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.contrast !== undefined && adjustments.contrast !== 0) {
        sliders.push({
            key: 'contrast',
            label: 'Contrast',
            value: adjustments.contrast,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.highlights !== undefined && adjustments.highlights !== 0) {
        sliders.push({
            key: 'highlights',
            label: 'Highlights',
            value: adjustments.highlights,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.shadows !== undefined && adjustments.shadows !== 0) {
        sliders.push({
            key: 'shadows',
            label: 'Shadows',
            value: adjustments.shadows,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.saturation !== undefined && adjustments.saturation !== 0) {
        sliders.push({
            key: 'saturation',
            label: 'Saturation',
            value: adjustments.saturation,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.vibrance !== undefined && adjustments.vibrance !== 0) {
        sliders.push({
            key: 'vibrance',
            label: 'Vibrance',
            value: adjustments.vibrance,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.warmth !== undefined && adjustments.warmth !== 0) {
        sliders.push({
            key: 'warmth',
            label: 'Warmth',
            value: adjustments.warmth,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.sharpness !== undefined && adjustments.sharpness !== 0) {
        sliders.push({
            key: 'sharpness',
            label: 'Sharpness',
            value: adjustments.sharpness,
            min: 0,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.clarity !== undefined && adjustments.clarity !== 0) {
        sliders.push({
            key: 'clarity',
            label: 'Clarity',
            value: adjustments.clarity,
            min: -100,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    if (adjustments.vignette !== undefined && adjustments.vignette !== 0) {
        sliders.push({
            key: 'vignette',
            label: 'Vignette',
            value: adjustments.vignette,
            min: 0,
            max: 100,
            step: 1,
            unit: '',
        });
    }

    return sliders;
};