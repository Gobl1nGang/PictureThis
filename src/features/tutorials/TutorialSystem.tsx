import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Image,
    Dimensions,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../../contexts/UserProfileContext';

const { width } = Dimensions.get('window');

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    category: 'Composition' | 'Lighting' | 'Settings' | 'Editing';
    steps: TutorialStep[];
    estimatedTime: number; // minutes
    prerequisites?: string[];
}

export interface TutorialStep {
    id: string;
    title: string;
    instruction: string;
    visualAid?: {
        type: 'image' | 'animation' | 'overlay';
        source: string;
    };
    tips?: string[];
    checkpoints?: string[];
}

const TUTORIALS: Tutorial[] = [
    {
        id: 'rule-of-thirds',
        title: 'Master the Rule of Thirds',
        description: 'Learn the fundamental composition technique used by professionals',
        difficulty: 'Beginner',
        category: 'Composition',
        estimatedTime: 5,
        steps: [
            {
                id: 'step-1',
                title: 'Understanding the Grid',
                instruction: 'The rule of thirds divides your frame into 9 equal sections with 2 horizontal and 2 vertical lines.',
                tips: [
                    'Enable grid lines in camera settings',
                    'The grid helps you visualize the composition',
                ],
            },
            {
                id: 'step-2',
                title: 'Positioning Your Subject',
                instruction: 'Place your main subject along one of the grid lines or at intersection points.',
                tips: [
                    'Intersections create the strongest focal points',
                    'Avoid centering your subject unless intentional',
                ],
                checkpoints: [
                    'Subject is positioned on a grid line',
                    'Image feels balanced and dynamic',
                ],
            },
            {
                id: 'step-3',
                title: 'Practice Exercise',
                instruction: 'Take 5 photos using the rule of thirds. Try different subject positions.',
                tips: [
                    'Experiment with both horizontal and vertical lines',
                    'Notice how different positions change the mood',
                ],
            },
        ],
    },
    {
        id: 'golden-hour-portraits',
        title: 'Golden Hour Portrait Magic',
        description: 'Capture stunning portraits during the golden hour',
        difficulty: 'Intermediate',
        category: 'Lighting',
        estimatedTime: 15,
        prerequisites: ['rule-of-thirds'],
        steps: [
            {
                id: 'step-1',
                title: 'Timing is Everything',
                instruction: 'Golden hour occurs 1 hour before sunset and 1 hour after sunrise.',
                tips: [
                    'Use weather apps to check exact sunset/sunrise times',
                    'Arrive 30 minutes early to set up',
                ],
            },
            {
                id: 'step-2',
                title: 'Finding the Right Light',
                instruction: 'Position your subject so the golden light illuminates their face evenly.',
                tips: [
                    'Avoid harsh shadows under the eyes',
                    'Use a reflector or white surface to bounce light if needed',
                ],
            },
            {
                id: 'step-3',
                title: 'Camera Settings',
                instruction: 'Adjust exposure to capture the warm tones without overexposing.',
                tips: [
                    'Tap to focus on your subject face',
                    'Slightly underexpose to preserve highlight details',
                ],
            },
        ],
    },
];

interface TutorialSystemProps {
    visible: boolean;
    onClose: () => void;
}

export function TutorialSystem({ visible, onClose }: TutorialSystemProps) {
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
    const { profile } = useUserProfile();

    const filteredTutorials = TUTORIALS.filter(tutorial => {
        if (!profile) return true;
        
        const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
        const userSkillIndex = skillLevels.indexOf(profile.skillLevel);
        const tutorialSkillIndex = skillLevels.indexOf(tutorial.difficulty);
        
        return tutorialSkillIndex <= userSkillIndex + 1;
    });

    const startTutorial = (tutorial: Tutorial) => {
        setSelectedTutorial(tutorial);
        setCurrentStep(0);
    };

    const nextStep = () => {
        if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const previousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeTutorial = () => {
        if (selectedTutorial) {
            setCompletedTutorials(prev => [...prev, selectedTutorial.id]);
            setSelectedTutorial(null);
            setCurrentStep(0);
        }
    };

    const renderTutorialList = () => (
        <ScrollView style={styles.tutorialList}>
            <Text style={styles.sectionTitle}>Photography Tutorials</Text>
            <Text style={styles.sectionSubtitle}>
                Learn professional techniques step by step
            </Text>

            {filteredTutorials.map(tutorial => (
                <TouchableOpacity
                    key={tutorial.id}
                    style={[
                        styles.tutorialCard,
                        completedTutorials.includes(tutorial.id) && styles.completedCard
                    ]}
                    onPress={() => startTutorial(tutorial)}
                >
                    <View style={styles.tutorialHeader}>
                        <View style={styles.tutorialInfo}>
                            <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                            <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
                        </View>
                        {completedTutorials.includes(tutorial.id) && (
                            <Ionicons name="checkmark-circle" size={24} color="#4CD964" />
                        )}
                    </View>
                    
                    <View style={styles.tutorialMeta}>
                        <View style={[styles.difficultyBadge, styles[`difficulty${tutorial.difficulty}`]]}>
                            <Text style={styles.difficultyText}>{tutorial.difficulty}</Text>
                        </View>
                        <Text style={styles.categoryText}>{tutorial.category}</Text>
                        <Text style={styles.timeText}>{tutorial.estimatedTime} min</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderTutorialStep = () => {
        if (!selectedTutorial) return null;

        const step = selectedTutorial.steps[currentStep];
        const isLastStep = currentStep === selectedTutorial.steps.length - 1;

        return (
            <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                    <TouchableOpacity onPress={() => setSelectedTutorial(null)}>
                        <Ionicons name="arrow-back" size={24} color="#4CD964" />
                    </TouchableOpacity>
                    <Text style={styles.stepProgress}>
                        Step {currentStep + 1} of {selectedTutorial.steps.length}
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>

                    {step.tips && step.tips.length > 0 && (
                        <View style={styles.tipsSection}>
                            <Text style={styles.tipsTitle}>💡 Tips:</Text>
                            {step.tips.map((tip, index) => (
                                <Text key={index} style={styles.tipText}>• {tip}</Text>
                            ))}
                        </View>
                    )}

                    {step.checkpoints && step.checkpoints.length > 0 && (
                        <View style={styles.checkpointsSection}>
                            <Text style={styles.checkpointsTitle}>✓ Check these points:</Text>
                            {step.checkpoints.map((checkpoint, index) => (
                                <Text key={index} style={styles.checkpointText}>• {checkpoint}</Text>
                            ))}
                        </View>
                    )}
                </ScrollView>

                <View style={styles.stepNavigation}>
                    <TouchableOpacity
                        style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
                        onPress={previousStep}
                        disabled={currentStep === 0}
                    >
                        <Text style={styles.navButtonText}>Previous</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={isLastStep ? completeTutorial : nextStep}
                    >
                        <Text style={styles.navButtonText}>
                            {isLastStep ? 'Complete' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {selectedTutorial ? renderTutorialStep() : renderTutorialList()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    tutorialList: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    tutorialCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    completedCard: {
        borderColor: '#4CD964',
        backgroundColor: 'rgba(76, 217, 100, 0.1)',
    },
    tutorialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    tutorialInfo: {
        flex: 1,
    },
    tutorialTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
    },
    tutorialDescription: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
    },
    tutorialMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyBeginner: {
        backgroundColor: 'rgba(76, 217, 100, 0.2)',
    },
    difficultyIntermediate: {
        backgroundColor: 'rgba(255, 204, 0, 0.2)',
    },
    difficultyAdvanced: {
        backgroundColor: 'rgba(255, 59, 48, 0.2)',
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    categoryText: {
        fontSize: 12,
        color: '#4CD964',
        fontWeight: '500',
    },
    timeText: {
        fontSize: 12,
        color: '#666',
    },
    stepContainer: {
        flex: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    stepProgress: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    stepContent: {
        flex: 1,
        padding: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 16,
    },
    stepInstruction: {
        fontSize: 16,
        color: '#ccc',
        lineHeight: 24,
        marginBottom: 24,
    },
    tipsSection: {
        backgroundColor: 'rgba(76, 217, 100, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(76, 217, 100, 0.3)',
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CD964',
        marginBottom: 8,
    },
    tipText: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        marginBottom: 4,
    },
    checkpointsSection: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 122, 255, 0.3)',
    },
    checkpointsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 8,
    },
    checkpointText: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        marginBottom: 4,
    },
    stepNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    navButton: {
        backgroundColor: '#4CD964',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    navButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});