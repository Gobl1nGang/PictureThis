import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ImageAdjustments } from '../services/imageEnhancement';
import { applyBedrockFilter } from '../services/bedrockImageFilter';

interface FilteredImageProps {
    uri: string;
    adjustments: Partial<ImageAdjustments>;
    filter?: string;
    onFilteredImage?: (uri: string) => void;
}

/**
 * Component that displays an image
 * Filters are applied manually via the extractFilteredImageUri function
 */
export const FilteredImage: React.FC<FilteredImageProps> = ({
    uri,
}) => {
    return (
        <View style={styles.container}>
            <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});

export const extractFilteredImageUri = async (
    uri: string,
    adjustments: Partial<ImageAdjustments>,
    filter?: string,
    customPrompt?: string
): Promise<string> => {
    return await applyBedrockFilter(uri, filter, customPrompt, adjustments);
};
