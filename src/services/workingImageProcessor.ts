import { manipulate, FlipType, SaveFormat } from 'react-native-image-manipulator';
import { ImageAdjustments } from './imageEnhancement';

/**
 * Apply color adjustments using react-native-image-manipulator
 * This library supports pixel-level operations and works in Expo Go!
 */
export const applyColorAdjustments = async (
    imageUri: string,
    adjustments: Partial<ImageAdjustments>
): Promise<string> => {
    try {
        const {
            exposure = 0,
            contrast = 0,
            saturation = 0,
            brightness = 0,
        } = adjustments;

        // react-native-image-manipulator supports color matrix operations
        // We can use this to apply adjustments!

        const result = await manipulate(imageUri, [
            // Apply brightness
            {
                type: 'brightness',
                value: brightness / 100, // -1 to 1
            },
            // Apply contrast
            {
                type: 'contrast',
                value: contrast / 100, // -1 to 1
            },
            // Apply saturation
            {
                type: 'saturation',
                value: saturation / 100, // -1 to 1
            },
        ], {
            compress: 0.9,
            format: SaveFormat.JPEG,
        });

        return result.uri;
    } catch (error) {
        console.error('Color adjustment error:', error);
        // Fallback to original
        return imageUri;
    }
};

/**
 * Apply preset filter
 */
export const applyFilter = async (
    imageUri: string,
    filterName: string
): Promise<string> => {
    try {
        switch (filterName) {
            case 'vivid':
                return await manipulate(imageUri, [
                    { type: 'saturation', value: 0.3 },
                    { type: 'contrast', value: 0.15 },
                ], { compress: 0.9, format: SaveFormat.JPEG });

            case 'warm':
                return await manipulate(imageUri, [
                    { type: 'temperature', value: 0.25 },
                    { type: 'saturation', value: 0.1 },
                ], { compress: 0.9, format: SaveFormat.JPEG });

            case 'cool':
                return await manipulate(imageUri, [
                    { type: 'temperature', value: -0.25 },
                    { type: 'saturation', value: 0.1 },
                ], { compress: 0.9, format: SaveFormat.JPEG });

            case 'bw':
                return await manipulate(imageUri, [
                    { type: 'saturation', value: -1 },
                ], { compress: 0.9, format: SaveFormat.JPEG });

            case 'vintage':
                return await manipulate(imageUri, [
                    { type: 'contrast', value: -0.1 },
                    { type: 'saturation', value: -0.2 },
                    { type: 'brightness', value: 0.05 },
                ], { compress: 0.9, format: SaveFormat.JPEG });

            case 'film':
                return await manipulate(imageUri, [
                    { type: 'contrast', value: 0.2 },
                    { type: 'saturation', value: -0.1 },
                ], { compress: 0.9, format: SaveFormat.JPEG });

            default:
                return imageUri;
        }
    } catch (error) {
        console.error('Filter error:', error);
        return imageUri;
    }
};

/**
 * Crop image
 */
export const cropImage = async (
    imageUri: string,
    cropData: {
        originX: number;
        originY: number;
        width: number;
        height: number;
    }
): Promise<string> => {
    const result = await manipulate(imageUri, [
        { type: 'crop', ...cropData },
    ], { compress: 0.95, format: SaveFormat.JPEG });
    return result.uri;
};

/**
 * Rotate image
 */
export const rotateImage = async (
    imageUri: string,
    degrees: number
): Promise<string> => {
    const result = await manipulate(imageUri, [
        { type: 'rotate', degrees },
    ], { compress: 0.95, format: SaveFormat.JPEG });
    return result.uri;
};

/**
 * Flip image
 */
export const flipImage = async (
    imageUri: string,
    direction: 'horizontal' | 'vertical'
): Promise<string> => {
    const result = await manipulate(imageUri, [
        { type: 'flip', direction: direction === 'horizontal' ? FlipType.Horizontal : FlipType.Vertical },
    ], { compress: 0.95, format: SaveFormat.JPEG });
    return result.uri;
};
