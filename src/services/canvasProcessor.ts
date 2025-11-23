import { ImageAdjustments } from '../services/imageEnhancement';

/**
 * Apply adjustments to image data using Canvas
 * This is a simplified version - for production, you'd use WebGL shaders
 */
export const applyAdjustmentsToImageData = (
    imageData: ImageData,
    adjustments: Partial<ImageAdjustments>
): ImageData => {
    const data = imageData.data;
    const {
        exposure = 0,
        contrast = 0,
        highlights = 0,
        shadows = 0,
        saturation = 0,
        vibrance = 0,
        warmth = 0,
        sharpness = 0,
        clarity = 0,
    } = adjustments;

    // Convert adjustment values from -100/100 to usable ranges
    const exposureFactor = 1 + (exposure / 100);
    const contrastFactor = 1 + (contrast / 100);
    const saturationFactor = 1 + (saturation / 100);
    const warmthShift = warmth / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply exposure
        r *= exposureFactor;
        g *= exposureFactor;
        b *= exposureFactor;

        // Apply contrast
        r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

        // Apply warmth (shift towards orange/blue)
        if (warmthShift > 0) {
            r += warmthShift * 30;
            b -= warmthShift * 20;
        } else {
            r += warmthShift * 20;
            b -= warmthShift * 30;
        }

        // Apply saturation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturationFactor;
        g = gray + (g - gray) * saturationFactor;
        b = gray + (b - gray) * saturationFactor;

        // Clamp values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return imageData;
};

/**
 * Apply filter preset
 */
export const applyFilterToImageData = (
    imageData: ImageData,
    filterName: string
): ImageData => {
    const data = imageData.data;

    switch (filterName) {
        case 'vivid':
            return applyAdjustmentsToImageData(imageData, {
                saturation: 30,
                vibrance: 20,
                contrast: 15,
            });

        case 'warm':
            return applyAdjustmentsToImageData(imageData, {
                warmth: 25,
                saturation: 10,
            });

        case 'cool':
            return applyAdjustmentsToImageData(imageData, {
                warmth: -25,
                saturation: 10,
            });

        case 'bw':
            // Black and white
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            return imageData;

        case 'vintage':
            // Vintage look
            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i] * 1.1; // Boost reds
                data[i + 1] = data[i + 1] * 0.9; // Reduce greens
                data[i + 2] = data[i + 2] * 0.8; // Reduce blues
            }
            return applyAdjustmentsToImageData(imageData, {
                contrast: -10,
                saturation: -20,
            });

        case 'film':
            return applyAdjustmentsToImageData(imageData, {
                contrast: 20,
                saturation: -10,
                exposure: 5,
            });

        default:
            return imageData;
    }
};
