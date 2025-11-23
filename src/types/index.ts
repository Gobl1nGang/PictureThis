// User Profile Types

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';

export type PhotographyStyle =
    | 'Portrait'
    | 'Landscape'
    | 'Street'
    | 'Product'
    | 'Wildlife'
    | 'Macro'
    | 'Architecture'
    | 'Event'
    | 'Fashion'
    | 'Food';

export type LearningPreference = 'Detailed' | 'Quick Tips' | 'Minimal';

export interface EquipmentProfile {
    phoneModel: string;
    hasExternalLenses: boolean;
    hasLightingEquipment: boolean;
    hasTripod: boolean;
    hasGimbal: boolean;
}

export interface EditingPreferences {
    favoriteFilters: string[];
    presetHistory: EditingPreset[];
    preferredColorGrading: 'Warm' | 'Cool' | 'Neutral' | 'Vibrant';
    autoEnhanceEnabled: boolean;
}

export interface EditingPreset {
    id: string;
    name: string;
    adjustments: {
        exposure?: number;
        contrast?: number;
        highlights?: number;
        shadows?: number;
        saturation?: number;
        vibrance?: number;
        warmth?: number;
        sharpness?: number;
        clarity?: number;
        grain?: number;
        vignette?: number;
    };
    createdAt: number;
}

export interface SocialMediaAccount {
    platform: 'Instagram' | 'Facebook' | 'Twitter' | 'TikTok';
    username: string;
    connected: boolean;
    defaultHashtags: string[];
    defaultCaption?: string;
}

export interface UserProfile {
    id: string;
    skillLevel: SkillLevel;
    preferredStyles: PhotographyStyle[];
    equipment: EquipmentProfile;
    learningPreference: LearningPreference;
    editingPreferences: EditingPreferences;
    socialAccounts: SocialMediaAccount[];
    createdAt: number;
    updatedAt: number;
}

// Photo Context Types

export type PhotoContextType =
    | 'Portrait'
    | 'Landscape'
    | 'Product'
    | 'Event'
    | 'Wedding'
    | 'Nature'
    | 'Street'
    | 'Food'
    | 'Architecture'
    | 'Custom';

export type TimeOfDay = 'Golden Hour' | 'Blue Hour' | 'Midday' | 'Night' | 'Overcast';

export type Environment = 'Indoor' | 'Outdoor' | 'Studio';

export type SubjectType = 'Person' | 'Object' | 'Landscape' | 'Multiple' | 'Unknown';

export interface ReferencePhotoData {
    uri: string;
    analysis?: {
        pictureType: string;
        style: string;
        subject: string;
        composition: string;
        lighting: string;
        lens: string;
        colorTone: string;
        summary: string;
    };
}

export interface PhotoContext {
    id: string;
    type: PhotoContextType;
    customDescription?: string;
    timeOfDay: TimeOfDay;
    environment: Environment;
    subjectType: SubjectType;
    referencePhotos: ReferencePhotoData[];
    userNotes?: string;
    createdAt: number;
}

// AI Instruction Types

export interface AIInstruction {
    id: string;
    step: number;
    totalSteps: number;
    text: string;
    category: 'positioning' | 'lighting' | 'composition' | 'settings' | 'timing';
    priority: 'high' | 'medium' | 'low';
    visualAid?: {
        type: 'arrow' | 'grid' | 'overlay' | 'highlight';
        data: any;
    };
}

export interface AIFeedback {
    score: number;
    instructions: AIInstruction[];
    perfectShot: boolean;
    referenceComparison?: string;
    timestamp: number;
}

// Photo Metadata Types

export interface AdjustmentSlider {
    key: string;
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
}

export interface PhotoMetadata {
    id: string;
    assetId: string;
    uri: string;
    originalUri?: string;
    context: PhotoContext;
    userProfile: {
        skillLevel: SkillLevel;
        preferredStyles: PhotographyStyle[];
    };
    aiFeedback: AIFeedback;
    captureSettings: {
        zoom: number;
        flash: boolean;
        gridEnabled: boolean;
    };
    edits?: {
        presetApplied?: string;
        adjustments: EditingPreset['adjustments'];
        aiSuggestions: string[];
        aiAdjustments?: EditingPreset['adjustments'];
        adjustmentSliders?: AdjustmentSlider[];
    };
    createdAt: number;
    updatedAt: number;
}
