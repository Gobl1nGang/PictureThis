import React, { useMemo } from 'react';
import { Canvas, Image, useImage, ColorMatrix } from '@shopify/react-native-skia';
import { StyleSheet, View, Dimensions } from 'react-native';

interface SkiaFilteredImageProps {
    uri: string;
    filterPreset?: string;
    width?: number;
    height?: number;
}

// Color Matrices for filters
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

export const SkiaFilteredImage: React.FC<SkiaFilteredImageProps> = ({
    uri,
    filterPreset,
    width = Dimensions.get('window').width,
    height = Dimensions.get('window').width, // Default to square if not specified
}) => {
    const image = useImage(uri);

    const matrix = useMemo(() => {
        if (filterPreset && PRESETS[filterPreset]) {
            return PRESETS[filterPreset];
        }
        return MATRIX_IDENTITY;
    }, [filterPreset]);

    if (!image) {
        return <View style={{ width, height, backgroundColor: '#333' }} />;
    }

    return (
        <Canvas style={{ width, height }}>
            <Image
                image={image}
                x={0}
                y={0}
                width={width}
                height={height}
                fit="contain"
            >
                {filterPreset && <ColorMatrix matrix={matrix} />}
            </Image>
        </Canvas>
    );
};
