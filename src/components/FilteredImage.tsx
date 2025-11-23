import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
    ConfigComposition,
    Brightness,
    Contrast,
    Saturate,
    Temperature,
    Exposure,
    Sharpen,
    ColorMatrix,
} from 'react-native-image-filter-kit';
import { ImageAdjustments } from './imageEnhancement';

interface FilteredImageProps {
    uri: string;
    adjustments: Partial<ImageAdjustments>;
    filter?: string;
    onFilteredImage?: (uri: string) => void;
}

/**
 * Component that applies real-time filters using react-native-image-filter-kit
 * This works in Expo Go!
 */
export const FilteredImage: React.FC<FilteredImageProps> = ({
    uri,
    adjustments,
    filter,
    onFilteredImage,
}) => {
    const [imageConfig, setImageConfig] = useState<any>(null);

    useEffect(() => {
        buildFilterConfig();
    }, [uri, adjustments, filter]);

    const buildFilterConfig = () => {
        const {
            exposure = 0,
            contrast = 0,
            saturation = 0,
            warmth = 0,
            sharpness = 0,
        } = adjustments;

        // Convert our -100 to 100 scale to filter values
        const exposureValue = 1 + (exposure / 100); // 0 to 2
        const contrastValue = 1 + (contrast / 100); // 0 to 2
        const saturationValue = 1 + (saturation / 100); // 0 to 2
        const temperatureValue = 6500 + (warmth * 20); // Color temperature in Kelvin
        const sharpnessValue = sharpness / 100; // 0 to 1

        // Build filter chain
        let config: any = { image: uri };

        // Apply preset filter first
        if (filter && filter !== 'none') {
            config = applyPresetFilter(config, filter);
        }

        // Apply adjustments
        if (exposure !== 0) {
            config = {
                ...Exposure,
                image: config,
                exposure: exposureValue,
            };
        }

        if (contrast !== 0) {
            config = {
                ...Contrast,
                image: config,
                amount: contrastValue,
            };
        }

        if (saturation !== 0) {
            config = {
                ...Saturate,
                image: config,
                amount: saturationValue,
            };
        }

        if (warmth !== 0) {
            config = {
                ...Temperature,
                image: config,
                temperature: temperatureValue,
            };
        }

        if (sharpness > 0) {
            config = {
                ...Sharpen,
                image: config,
                amount: sharpnessValue,
            };
        }

        setImageConfig(config);
    };

    const applyPresetFilter = (baseConfig: any, filterName: string) => {
        switch (filterName) {
            case 'vivid':
                return {
                    ...Saturate,
                    image: {
                        ...Contrast,
                        image: baseConfig,
                        amount: 1.2,
                    },
                    amount: 1.3,
                };

            case 'warm':
                return {
                    ...Temperature,
                    image: {
                        ...Saturate,
                        image: baseConfig,
                        amount: 1.1,
                    },
                    temperature: 7000,
                };

            case 'cool':
                return {
                    ...Temperature,
                    image: {
                        ...Saturate,
                        image: baseConfig,
                        amount: 1.1,
                    },
                    temperature: 6000,
                };

            case 'bw':
                return {
                    ...Saturate,
                    image: baseConfig,
                    amount: 0,
                };

            case 'vintage':
                return {
                    ...ColorMatrix,
                    image: {
                        ...Contrast,
                        image: baseConfig,
                        amount: 0.9,
                    },
                    matrix: [
                        1.1, 0, 0, 0, 0,
                        0, 0.9, 0, 0, 0,
                        0, 0, 0.8, 0, 0,
                        0, 0, 0, 1, 0,
                    ],
                };

            case 'film':
                return {
                    ...Contrast,
                    image: {
                        ...Saturate,
                        image: baseConfig,
                        amount: 0.9,
                    },
                    amount: 1.2,
                };

            default:
                return baseConfig;
        }
    };

    if (!imageConfig) {
        return null;
    }

    return (
        <ConfigComposition
            config={imageConfig}
            style={styles.image}
            onFilteringError={(error) => console.error('Filter error:', error)}
            onExtractImage={({ nativeEvent }) => {
                if (onFilteredImage && nativeEvent.uri) {
                    onFilteredImage(nativeEvent.uri);
                }
            }}
            extractImageEnabled={true}
        />
    );
};

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: '100%',
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
    return new Promise((resolve) => {
        // This will be handled by the FilteredImage component's onExtractImage
        // For now, return original
        resolve(uri);
    });
};
