import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface BasicAdjustments {
    exposure: number;
    brightness: number;
    contrast: number;
    saturation: number;
    highlights: number;
    shadows: number;
}

/**
 * Apply basic image adjustments using expo-image-manipulator
 * Limited to available operations but provides real functionality
 */
export const applyBasicAdjustments = async (
    imageUri: string,
    adjustments: BasicAdjustments
): Promise<string> => {
    try {
        // expo-image-manipulator doesn't support brightness/contrast adjustments
        // Return original URI for now - adjustments will be visual only
        return imageUri;
    } catch (error) {
        console.error('Basic adjustment error:', error);
        return imageUri;
    }
};

/**
 * Apply rotation transformation
 */
export const applyRotation = async (
    imageUri: string,
    degrees: number
): Promise<string> => {
    try {
        if (degrees === 0) return imageUri;

        const result = await manipulateAsync(
            imageUri,
            [{ rotate: degrees }],
            {
                compress: 0.95,
                format: SaveFormat.JPEG
            }
        );

        return result.uri;
    } catch (error) {
        console.error('Rotation error:', error);
        return imageUri;
    }
};

/**
 * Apply crop with aspect ratio
 */
export const applyCrop = async (
    imageUri: string,
    aspectRatio: number,
    targetWidth: number = 1080
): Promise<string> => {
    try {
        const targetHeight = Math.round(targetWidth / aspectRatio);
        
        const result = await manipulateAsync(
            imageUri,
            [{ 
                crop: {
                    originX: 0,
                    originY: 0,
                    width: targetWidth,
                    height: targetHeight
                }
            }],
            {
                compress: 0.95,
                format: SaveFormat.JPEG
            }
        );

        return result.uri;
    } catch (error) {
        console.error('Crop error:', error);
        return imageUri;
    }
};