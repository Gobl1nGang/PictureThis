import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, SkillLevel, PhotographyStyle } from '../types';
import AsyncStorageService from '../storage/AsyncStorageService';

interface UserProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    createProfile: (profile: UserProfile) => Promise<void>;
    hasCompletedOnboarding: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const savedProfile = await AsyncStorageService.getUserProfile();
            setProfile(savedProfile);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async (newProfile: UserProfile) => {
        try {
            await AsyncStorageService.saveUserProfile(newProfile);
            setProfile(newProfile);
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        try {
            await AsyncStorageService.updateUserProfile(updates);
            if (profile) {
                setProfile({ ...profile, ...updates, updatedAt: Date.now() });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const value: UserProfileContextType = {
        profile,
        loading,
        updateProfile,
        createProfile,
        hasCompletedOnboarding: profile !== null,
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = (): UserProfileContextType => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

// Helper function to create default profile
export const createDefaultProfile = (skillLevel: SkillLevel, styles: PhotographyStyle[]): UserProfile => {
    return {
        id: `profile_${Date.now()}`,
        skillLevel,
        preferredStyles: styles,
        equipment: {
            phoneModel: 'Unknown',
            hasExternalLenses: false,
            hasLightingEquipment: false,
            hasTripod: false,
            hasGimbal: false,
        },
        learningPreference: skillLevel === 'Beginner' ? 'Detailed' : 'Quick Tips',
        editingPreferences: {
            favoriteFilters: [],
            presetHistory: [],
            preferredColorGrading: 'Neutral',
            autoEnhanceEnabled: true,
        },
        socialAccounts: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
};
