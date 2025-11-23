import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
    Canvas,
    ColorMatrix,
    Image,
    useImage,
    SkImage,
} from '@shopify/react-native-skia';
import { ImageAdjustments } from './imageEnhancement';

interface FilteredImageProps {
    uri: string;
    adjustments: Partial<ImageAdjustments>;
    filter?: string;
    onFilteredImage?: (uri: string) => void;
}

/**
 * Component that applies real-time filters using @shopify/react-native-skia
 */
export const FilteredImage: React.FC<FilteredImageProps> = ({
    uri,
    adjustments,
    filter,
    onFilteredImage,
}) => {
    const image = useImage(uri);
    const { width, height } = useMemo(() => {
        if (!image) return { width: 0, height: 0 };
        const screenWidth = Dimensions.get('window').width;
        const ratio = image.height() / image.width();
        return {
            width: screenWidth,
            height: screenWidth * ratio,
        };
    }, [image]);

    // Notify parent that we "processed" the image (for now just passing through)
    // In a real implementation, we would capture the canvas ref and save it
    useEffect(() => {
        if (onFilteredImage && uri) {
            onFilteredImage(uri);
        }
    }, [uri, onFilteredImage]);

    const colorMatrix = useMemo(() => {
        const {
            exposure = 0,
            contrast = 0,
            saturation = 0,
            warmth = 0,
            // sharpness is not easily done with ColorMatrix, skipping for now
        } = adjustments;

        // Helper to multiply matrices
        const multiply = (a: number[], b: number[]) => {
            const result = new Array(20).fill(0);
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 5; j++) {
                    let sum = 0;
                    for (let k = 0; k < 4; k++) {
                        sum += a[i * 5 + k] * b[k * 5 + j];
                    }
                    sum += (j === 4) ? a[i * 5 + 4] : 0;
                    result[i * 5 + j] = sum;
                }
            }
            return result;
        };

        // Identity matrix
        let matrix = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0,
        ];

        // Exposure (Brightness)
        if (exposure !== 0) {
            const e = 1 + (exposure / 100);
            const exposureMatrix = [
                e, 0, 0, 0, 0,
                0, e, 0, 0, 0,
                0, 0, e, 0, 0,
                0, 0, 0, 1, 0,
            ];
            matrix = multiply(exposureMatrix, matrix);
        }

        // Contrast
        if (contrast !== 0) {
            const c = 1 + (contrast / 100);
            const o = 0.5 * (1 - c);
            const contrastMatrix = [
                c, 0, 0, 0, o,
                0, c, 0, 0, o,
                0, 0, c, 0, o,
                0, 0, 0, 1, 0,
            ];
            matrix = multiply(contrastMatrix, matrix);
        }

        // Saturation
        if (saturation !== 0) {
            const s = 1 + (saturation / 100);
            const lumR = 0.3086;
            const lumG = 0.6094;
            const lumB = 0.0820;
            const oneMinusS = 1 - s;
            const saturationMatrix = [
                (oneMinusS * lumR) + s, (oneMinusS * lumG), (oneMinusS * lumB), 0, 0,
                (oneMinusS * lumR), (oneMinusS * lumG) + s, (oneMinusS * lumB), 0, 0,
                (oneMinusS * lumR), (oneMinusS * lumG), (oneMinusS * lumB) + s, 0, 0,
                0, 0, 0, 1, 0,
            ];
            matrix = multiply(saturationMatrix, matrix);
        }

        // Warmth (Temperature) - Simplified
        if (warmth !== 0) {
            const w = warmth / 100;
            const r = w > 0 ? 1 + (w * 0.1) : 1;
            const b = w < 0 ? 1 + (Math.abs(w) * 0.1) : 1 - (w * 0.1);
            const warmthMatrix = [
                r, 0, 0, 0, 0,
                0, 1, 0, 0, 0,
                0, 0, b, 0, 0,
                0, 0, 0, 1, 0,
            ];
            matrix = multiply(warmthMatrix, matrix);
        }

        // Apply Preset Filters
        if (filter && filter !== 'none') {
            // Simple preset logic - can be expanded
            if (filter === 'bw') {
                const bwMatrix = [
                    0.33, 0.33, 0.33, 0, 0,
                    0.33, 0.33, 0.33, 0, 0,
                    0.33, 0.33, 0.33, 0, 0,
                    0, 0, 0, 1, 0,
                ];
                matrix = multiply(bwMatrix, matrix);
            } else if (filter === 'sepia') {
                const sepiaMatrix = [
                    0.393, 0.769, 0.189, 0, 0,
                    0.349, 0.686, 0.168, 0, 0,
                    0.272, 0.534, 0.131, 0, 0,
                    0, 0, 0, 1, 0,
                ];
                matrix = multiply(sepiaMatrix, matrix);
            }
        }

        return matrix;
    }, [adjustments, filter]);

    if (!image) {
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            <Canvas style={{ width: '100%', height: '100%' }}>
                <Image
                    image={image}
                    fit="contain"
                    x={0}
                    y={0}
                    width={Dimensions.get('window').width}
                    height={Dimensions.get('window').width * (image.height() / image.width())}
                >
                    <ColorMatrix matrix={colorMatrix} />
                </Image>
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

/**
 * Extract filtered image URI
 */
export const extractFilteredImageUri = async (
    uri: string,
    adjustments: Partial<ImageAdjustments>,
    filter?: string
): Promise<string> => {
    // For now, return original URI as Skia image capture requires a ref and imperative calls
    // which we can implement later if needed.
    return Promise.resolve(uri);
};
