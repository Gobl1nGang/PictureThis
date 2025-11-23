import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhotoContextType, TimeOfDay, Environment } from '../types/index';
import { usePhotoContext } from '../contexts/PhotoContextContext';

interface ContextSelectorProps {
    visible: boolean;
    onClose: () => void;
}

const CONTEXT_TYPES: PhotoContextType[] = [
    'Portrait', 'Landscape', 'Product', 'Event', 'Wedding', 'Nature', 'Street', 'Food', 'Architecture', 'Custom'
];

const TIME_OPTIONS: TimeOfDay[] = ['Golden Hour', 'Blue Hour', 'Midday', 'Night', 'Overcast'];

const ENVIRONMENT_OPTIONS: Environment[] = ['Indoor', 'Outdoor', 'Studio'];

export default function ContextSelector({ visible, onClose }: ContextSelectorProps) {
    const { currentContext, setContext } = usePhotoContext();
    const [selectedType, setSelectedType] = useState<PhotoContextType>(currentContext?.type || 'Portrait');
    const [selectedTime, setSelectedTime] = useState<TimeOfDay>(currentContext?.timeOfDay || 'Midday');
    const [selectedEnv, setSelectedEnv] = useState<Environment>(currentContext?.environment || 'Outdoor');

    const handleSave = async () => {
        await setContext({
            type: selectedType,
            timeOfDay: selectedTime,
            environment: selectedEnv,
            subjectType: 'Unknown',
            referencePhotos: currentContext?.referencePhotos || [],
        });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Photo Context</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Context Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What are you shooting?</Text>
                        <View style={styles.optionsGrid}>
                            {CONTEXT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.optionCard,
                                        selectedType === type && styles.optionCardSelected
                                    ]}
                                    onPress={() => setSelectedType(type)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedType === type && styles.optionTextSelected
                                    ]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Time of Day */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Time of Day</Text>
                        <View style={styles.optionsGrid}>
                            {TIME_OPTIONS.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.optionCard,
                                        selectedTime === time && styles.optionCardSelected
                                    ]}
                                    onPress={() => setSelectedTime(time)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedTime === time && styles.optionTextSelected
                                    ]}>
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Environment */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Environment</Text>
                        <View style={styles.optionsGrid}>
                            {ENVIRONMENT_OPTIONS.map((env) => (
                                <TouchableOpacity
                                    key={env}
                                    style={[
                                        styles.optionCard,
                                        selectedEnv === env && styles.optionCardSelected
                                    ]}
                                    onPress={() => setSelectedEnv(env)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedEnv === env && styles.optionTextSelected
                                    ]}>
                                        {env}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Context</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: 'white',
        marginTop: 20,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionCard: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    optionTextSelected: {
        color: 'white',
    },
    footer: {
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
