import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    PanResponder,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface BeforeAfterComparisonProps {
    beforeUri: string;
    afterUri: string;
    beforeLabel?: string;
    afterLabel?: string;
    onClose?: () => void;
}

export function BeforeAfterComparison({
    beforeUri,
    afterUri,
    beforeLabel = 'Before',
    afterLabel = 'After',
    onClose,
}: BeforeAfterComparisonProps) {
    const [sliderPosition, setSliderPosition] = useState(width / 2);
    const sliderAnim = useRef(new Animated.Value(width / 2)).current;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
            sliderAnim.setOffset(sliderPosition);
        },
        onPanResponderMove: (evt, gestureState) => {
            const newPosition = Math.max(0, Math.min(width, gestureState.dx));
            sliderAnim.setValue(newPosition);
        },
        onPanResponderRelease: (evt, gestureState) => {
            const newPosition = Math.max(0, Math.min(width, sliderPosition + gestureState.dx));
            setSliderPosition(newPosition);
            sliderAnim.flattenOffset();
            sliderAnim.setValue(newPosition);
        },
    });

    return (
        <View style={styles.container}>
            {onClose && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            )}

            <View style={styles.comparisonContainer}>
                {/* Before Image (Full) */}
                <Image
                    source={{ uri: beforeUri }}
                    style={styles.beforeImage}
                    resizeMode="cover"
                />

                {/* After Image (Clipped) */}
                <Animated.View
                    style={[
                        styles.afterImageContainer,
                        {
                            width: sliderAnim,
                        },
                    ]}
                >
                    <Image
                        source={{ uri: afterUri }}
                        style={styles.afterImage}
                        resizeMode="cover"
                    />
                </Animated.View>

                {/* Slider Handle */}
                <Animated.View
                    style={[
                        styles.sliderHandle,
                        {
                            left: sliderAnim.interpolate({
                                inputRange: [0, width],
                                outputRange: [-15, width - 15],
                                extrapolate: 'clamp',
                            }),
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.sliderLine} />
                    <View style={styles.sliderCircle}>
                        <Ionicons name="swap-horizontal" size={16} color="white" />
                    </View>
                    <View style={styles.sliderLine} />
                </Animated.View>

                {/* Labels */}
                <View style={styles.labelsContainer}>
                    <View style={styles.beforeLabel}>
                        <Text style={styles.labelText}>{beforeLabel}</Text>
                    </View>
                    <View style={styles.afterLabel}>
                        <Text style={styles.labelText}>{afterLabel}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.instructionContainer}>
                <Ionicons name="hand-left" size={20} color="#666" />
                <Text style={styles.instructionText}>
                    Drag the slider to compare before and after
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    comparisonContainer: {
        width: width - 40,
        height: (width - 40) * 1.2, // 5:6 aspect ratio
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#222',
    },
    beforeImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    afterImageContainer: {
        height: '100%',
        overflow: 'hidden',
        position: 'absolute',
        left: 0,
        top: 0,
    },
    afterImage: {
        width: width - 40,
        height: '100%',
    },
    sliderHandle: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    sliderLine: {
        width: 2,
        flex: 1,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
    },
    sliderCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    labelsContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    beforeLabel: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    afterLabel: {
        backgroundColor: 'rgba(76, 217, 100, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    labelText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    instructionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    instructionText: {
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
    },
});