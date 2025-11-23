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
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="white" />
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
        backgroundColor: '#050505',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(10, 10, 20, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginTop: 20,
        padding: 20,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    optionCardSelected: {
        backgroundColor: 'rgba(76, 217, 100, 0.15)',
        borderColor: '#4CD964',
        shadowColor: '#4CD964',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ccc',
    },
    optionTextSelected: {
        color: '#4CD964',
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        backgroundColor: 'rgba(10, 10, 20, 0.9)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    saveButton: {
        backgroundColor: '#4CD964',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#4CD964',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
