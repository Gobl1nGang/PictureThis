import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { AdjustmentSlider as SliderData } from '../types/index';

interface AdjustmentSliderProps {
    slider: SliderData;
    value: number;
    onValueChange: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
}

export default function AdjustmentSlider({ 
    slider, 
    value, 
    onValueChange, 
    onSlidingComplete 
}: AdjustmentSliderProps) {
    const formatValue = (val: number) => {
        if (val > 0) return `+${val}${slider.unit}`;
        return `${val}${slider.unit}`;
    };

    const getValueColor = (val: number) => {
        if (val === 0) return '#666'; // Default/no adjustment
        if (val === slider.value) return '#007AFF'; // AI recommended value
        if (val > 0) return '#34C759';
        if (val < 0) return '#FF9500';
        return '#666';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{slider.label}</Text>
                <View style={styles.valueContainer}>
                    <Text style={[styles.value, { color: getValueColor(value) }]}>
                        {formatValue(value)}
                    </Text>
                    {value !== slider.value && slider.value !== 0 && (
                        <Text style={styles.aiValue}>
                            AI: {formatValue(slider.value)}
                        </Text>
                    )}
                    {value === 0 && (
                        <Text style={styles.defaultValue}>
                            Default
                        </Text>
                    )}
                </View>
            </View>
            
            <View style={styles.sliderContainer}>
                <Slider
                    style={styles.slider}
                    minimumValue={slider.min}
                    maximumValue={slider.max}
                    step={slider.step}
                    value={value}
                    onValueChange={onValueChange}
                    onSlidingComplete={onSlidingComplete}
                    minimumTrackTintColor="#007AFF"
                    maximumTrackTintColor="#E5E5EA"
                    thumbStyle={styles.thumb}
                />
                
                {/* AI recommendation indicator */}
                {slider.value !== 0 && (
                    <View 
                        style={[
                            styles.aiIndicator,
                            {
                                left: `${((slider.value - slider.min) / (slider.max - slider.min)) * 100}%`
                            }
                        ]}
                    />
                )}
                
                {/* Zero/default indicator */}
                <View 
                    style={[
                        styles.defaultIndicator,
                        {
                            left: `${((0 - slider.min) / (slider.max - slider.min)) * 100}%`
                        }
                    ]}
                />
            </View>
            
            <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>{slider.min}</Text>
                <Text style={styles.rangeLabel}>{slider.max}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    valueContainer: {
        alignItems: 'flex-end',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
    aiValue: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 2,
    },
    sliderContainer: {
        position: 'relative',
        marginHorizontal: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    thumb: {
        backgroundColor: '#007AFF',
        width: 20,
        height: 20,
    },
    aiIndicator: {
        position: 'absolute',
        top: 15,
        width: 3,
        height: 10,
        backgroundColor: '#007AFF',
        borderRadius: 1.5,
        marginLeft: -1.5,
        zIndex: 1,
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 4,
    },
    rangeLabel: {
        fontSize: 12,
        color: '#666',
    },
    defaultValue: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    defaultIndicator: {
        position: 'absolute',
        top: 15,
        width: 1,
        height: 10,
        backgroundColor: '#999',
        borderRadius: 0.5,
        marginLeft: -0.5,
    },
});