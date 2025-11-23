import { Skia, ColorMatrix, ImageFormat } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';

// Duplicate matrices from SkiaFilteredImage.tsx for now to ensure consistency
const MATRIX_IDENTITY = [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
];

const MATRIX_BW = [
    0.33, 0.33, 0.33, 0, 0,
    0.33, 0.33, 0.33, 0, 0,
    0.33, 0.33, 0.33, 0, 0,
    0, 0, 0, 1, 0,
];

const MATRIX_VIVID = [
    1.2, 0, 0, 0, -0.1,
    0, 1.2, 0, 0, -0.1,
    0, 0, 1.2, 0, -0.1,
    0, 0, 0, 1, 0,
];

const MATRIX_WARM = [
    1.1, 0, 0, 0, 0.05,
    0, 1.0, 0, 0, 0.05,
    0, 0, 0.9, 0, 0,
    0, 0, 0, 1, 0,
];

const MATRIX_COOL = [
    0.9, 0, 0, 0, 0,
    0, 1.0, 0, 0, 0,
    0, 0, 1.1, 0, 0.05,
    0, 0, 0, 1, 0,
];

const MATRIX_VINTAGE = [
    0.393, 0.769, 0.189, 0, 0,
    0.349, 0.686, 0.168, 0, 0,
    0.272, 0.534, 0.131, 0, 0,
    0, 0, 0, 1, 0,
];

const MATRIX_DRAMATIC = [
    1.4, 0, 0, 0, -0.2,
    0, 1.4, 0, 0, -0.2,
    0, 0, 1.4, 0, -0.2,
    0, 0, 0, 1, 0,
];

const PRESETS: Record<string, number[]> = {
    vivid: MATRIX_VIVID,
    warm: MATRIX_WARM,
    cool: MATRIX_COOL,
    bw: MATRIX_BW,
    vintage: MATRIX_VINTAGE,
    dramatic: MATRIX_DRAMATIC,
};

export const applySkiaFilter = async (imageUri: string, filterPreset: string): Promise<string> => {
    try {
        console.log(`Applying Skia filter: ${filterPreset} to ${imageUri}`);

        // 1. Get the matrix
        const matrix = PRESETS[filterPreset] || MATRIX_IDENTITY;
        if (matrix === MATRIX_IDENTITY) {
            return imageUri;
        }

        // 2. Read image as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        // 3. Create Skia Data and Image
        const data = Skia.Data.fromBase64(base64);
        const image = Skia.Image.MakeImageFromEncoded(data);

        if (!image) {
            throw new Error('Failed to decode image for Skia processing');
        }

        // 4. Create Surface
        const surface = Skia.Surface.Make(image.width(), image.height());
        if (!surface) {
            throw new Error('Failed to create Skia surface');
        }

        const canvas = surface.getCanvas();

        // 5. Create Paint with ColorFilter
        const paint = Skia.Paint();
        paint.setColorFilter(Skia.ColorFilter.MakeMatrix(matrix));

        // 6. Draw Image with Paint
        canvas.drawImage(image, 0, 0, paint);

        // 7. Snapshot and Save
        const snapshot = surface.makeImageSnapshot();
        const savedBase64 = snapshot.encodeToBase64(ImageFormat.JPEG, 90);

        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        const filename = `filtered_${Date.now()}.jpg`;
        const outputUri = `${cacheDir}${filename}`;

        await FileSystem.writeAsStringAsync(outputUri, savedBase64, {
            encoding: 'base64',
        });

        console.log(`Filter applied successfully. Saved to: ${outputUri}`);
        return outputUri;

    } catch (error) {
        console.error('Error applying Skia filter:', error);
        throw error;
    }
};
