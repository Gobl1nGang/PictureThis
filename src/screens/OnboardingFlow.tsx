import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkillLevel, PhotographyStyle } from '../types/index';
import { useUserProfile, createDefaultProfile } from '../contexts/UserProfileContext';

const { width } = Dimensions.get('window');

const SKILL_LEVELS: { level: SkillLevel; description: string }[] = [
    { level: 'Beginner', description: 'Just starting out with photography' },
    { level: 'Intermediate', description: 'Know the basics, want to improve' },
    { level: 'Advanced', description: 'Experienced photographer' },
    { level: 'Professional', description: 'Professional or semi-pro' },
];

const PHOTOGRAPHY_STYLES: PhotographyStyle[] = [
    'Portrait', 'Landscape', 'Street', 'Product', 'Wildlife',
    'Macro', 'Architecture', 'Event', 'Fashion', 'Food',
];

interface OnboardingFlowProps {
    onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState(1);
    const [selectedSkillLevel, setSelectedSkillLevel] = useState<SkillLevel>('Intermediate');
    const [selectedStyles, setSelectedStyles] = useState<PhotographyStyle[]>([]);
    const { createProfile } = useUserProfile();

    const toggleStyle = (style: PhotographyStyle) => {
        if (selectedStyles.includes(style)) {
            setSelectedStyles(selectedStyles.filter(s => s !== style));
        } else {
            setSelectedStyles([...selectedStyles, style]);
        }
    };

    const handleComplete = async () => {
        const profile = createDefaultProfile(
            selectedSkillLevel,
            selectedStyles.length > 0 ? selectedStyles : ['Portrait']
        );
        await createProfile(profile);
        onComplete();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>PictureThis</Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
                    <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
                    <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {step === 1 && (
                    <View style={styles.stepContainer}>
                        <Ionicons name="camera" size={80} color="#007AFF" style={styles.icon} />
                        <Text style={styles.title}>Welcome to PictureThis</Text>
                        <Text style={styles.subtitle}>
                            Your AI-powered photography coach that helps you take perfect photos every time.
                        </Text>
                        <View style={styles.featureList}>
                            <View style={styles.feature}>
                                <Ionicons name="sparkles" size={24} color="#4CD964" />
                                <Text style={styles.featureText}>Real-time AI feedback</Text>
                            </View>
                            <View style={styles.feature}>
                                <Ionicons name="image" size={24} color="#4CD964" />
                                <Text style={styles.featureText}>Reference photo matching</Text>
                            </View>
                            <View style={styles.feature}>
                                <Ionicons name="color-wand" size={24} color="#4CD964" />
                                <Text style={styles.featureText}>AI-powered editing</Text>
                            </View>
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.title}>What's your skill level?</Text>
                        <Text style={styles.subtitle}>
                            This helps us tailor feedback to your experience.
                        </Text>
                        <View style={styles.optionsContainer}>
                            {SKILL_LEVELS.map(({ level, description }) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.skillCard,
                                        selectedSkillLevel === level && styles.skillCardSelected
                                    ]}
                                    onPress={() => setSelectedSkillLevel(level)}
                                >
                                    <Text style={[
                                        styles.skillLevel,
                                        selectedSkillLevel === level && styles.skillLevelSelected
                                    ]}>
                                        {level}
                                    </Text>
                                    <Text style={[
                                        styles.skillDescription,
                                        selectedSkillLevel === level && styles.skillDescriptionSelected
                                    ]}>
                                        {description}
                                    </Text>
                                    {selectedSkillLevel === level && (
                                        <Ionicons name="checkmark-circle" size={24} color="white" style={styles.checkmark} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.stepContainer}>
                        <Text style={styles.title}>What do you like to shoot?</Text>
                        <Text style={styles.subtitle}>
                            Select all that apply. We'll customize tips for your style.
                        </Text>
                        <View style={styles.stylesGrid}>
                            {PHOTOGRAPHY_STYLES.map((style) => (
                                <TouchableOpacity
                                    key={style}
                                    style={[
                                        styles.styleChip,
                                        selectedStyles.includes(style) && styles.styleChipSelected
                                    ]}
                                    onPress={() => toggleStyle(style)}
                                >
                                    <Text style={[
                                        styles.styleText,
                                        selectedStyles.includes(style) && styles.styleTextSelected
                                    ]}>
                                        {style}
                                    </Text>
                                    {selectedStyles.includes(style) && (
                                        <Ionicons name="checkmark" size={16} color="white" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {step > 1 && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setStep(step - 1)}
                    >
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.nextButton, step === 1 && styles.nextButtonFull]}
                    onPress={() => {
                        if (step < 3) {
                            setStep(step + 1);
                        } else {
                            handleComplete();
                        }
                    }}
                >
                    <Text style={styles.nextButtonText}>
                        {step === 3 ? 'Get Started' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        padding: 20,
        paddingTop: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    logo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#007AFF',
        textAlign: 'center',
        marginBottom: 15,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ddd',
    },
    progressDotActive: {
        backgroundColor: '#007AFF',
        width: 24,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    stepContainer: {
        flex: 1,
    },
    icon: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    featureList: {
        marginTop: 20,
        gap: 16,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    optionsContainer: {
        gap: 12,
    },
    skillCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#eee',
        position: 'relative',
    },
    skillCardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    skillLevel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    skillLevelSelected: {
        color: 'white',
    },
    skillDescription: {
        fontSize: 14,
        color: '#666',
    },
    skillDescriptionSelected: {
        color: 'rgba(255,255,255,0.9)',
    },
    checkmark: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    stylesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    styleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#eee',
    },
    styleChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    styleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    styleTextSelected: {
        color: 'white',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 12,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007AFF',
        gap: 8,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        gap: 8,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});
