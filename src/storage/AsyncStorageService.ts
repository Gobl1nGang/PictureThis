import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, PhotoContext, PhotoMetadata, EditingPreset } from '../types';

const KEYS = {
    USER_PROFILE: '@picturethis:user_profile',
    CURRENT_CONTEXT: '@picturethis:current_context',
    CONTEXT_HISTORY: '@picturethis:context_history',
    PHOTO_METADATA: '@picturethis:photo_metadata',
    EDITING_PRESETS: '@picturethis:editing_presets',
    SETTINGS: '@picturethis:settings',
};

class AsyncStorageService {
    // User Profile
    async saveUserProfile(profile: UserProfile): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw error;
        }
    }

    async getUserProfile(): Promise<UserProfile | null> {
        try {
            const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
        try {
            const current = await this.getUserProfile();
            if (current) {
                const updated = { ...current, ...updates, updatedAt: Date.now() };
                await this.saveUserProfile(updated);
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Photo Context
    async saveCurrentContext(context: PhotoContext): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.CURRENT_CONTEXT, JSON.stringify(context));
            // Also add to history
            const history = await this.getContextHistory();
            history.unshift(context);
            // Keep only last 20 contexts
            const trimmed = history.slice(0, 20);
            await AsyncStorage.setItem(KEYS.CONTEXT_HISTORY, JSON.stringify(trimmed));
        } catch (error) {
            console.error('Error saving context:', error);
            throw error;
        }
    }

    async getCurrentContext(): Promise<PhotoContext | null> {
        try {
            const data = await AsyncStorage.getItem(KEYS.CURRENT_CONTEXT);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting current context:', error);
            return null;
        }
    }

    async getContextHistory(): Promise<PhotoContext[]> {
        try {
            const data = await AsyncStorage.getItem(KEYS.CONTEXT_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting context history:', error);
            return [];
        }
    }

    async clearCurrentContext(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.CURRENT_CONTEXT);
        } catch (error) {
            console.error('Error clearing context:', error);
            throw error;
        }
    }

    // Photo Metadata
    async savePhotoMetadata(metadata: PhotoMetadata): Promise<void> {
        try {
            const allMetadata = await this.getAllPhotoMetadata();
            allMetadata[metadata.id] = metadata;
            await AsyncStorage.setItem(KEYS.PHOTO_METADATA, JSON.stringify(allMetadata));
        } catch (error) {
            console.error('Error saving photo metadata:', error);
            throw error;
        }
    }

    async getPhotoMetadata(id: string): Promise<PhotoMetadata | null> {
        try {
            const allMetadata = await this.getAllPhotoMetadata();
            return allMetadata[id] || null;
        } catch (error) {
            console.error('Error getting photo metadata:', error);
            return null;
        }
    }

    async getAllPhotoMetadata(): Promise<Record<string, PhotoMetadata>> {
        try {
            const data = await AsyncStorage.getItem(KEYS.PHOTO_METADATA);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting all photo metadata:', error);
            return {};
        }
    }

    // Editing Presets
    async saveEditingPreset(preset: EditingPreset): Promise<void> {
        try {
            const presets = await this.getEditingPresets();
            presets.push(preset);
            await AsyncStorage.setItem(KEYS.EDITING_PRESETS, JSON.stringify(presets));
        } catch (error) {
            console.error('Error saving editing preset:', error);
            throw error;
        }
    }

    async getEditingPresets(): Promise<EditingPreset[]> {
        try {
            const data = await AsyncStorage.getItem(KEYS.EDITING_PRESETS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting editing presets:', error);
            return [];
        }
    }

    async deleteEditingPreset(id: string): Promise<void> {
        try {
            const presets = await this.getEditingPresets();
            const filtered = presets.filter(p => p.id !== id);
            await AsyncStorage.setItem(KEYS.EDITING_PRESETS, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error deleting editing preset:', error);
            throw error;
        }
    }

    // Settings
    async saveSetting(key: string, value: any): Promise<void> {
        try {
            const settings = await this.getAllSettings();
            settings[key] = value;
            await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving setting:', error);
            throw error;
        }
    }

    async getSetting(key: string, defaultValue?: any): Promise<any> {
        try {
            const settings = await this.getAllSettings();
            return settings[key] !== undefined ? settings[key] : defaultValue;
        } catch (error) {
            console.error('Error getting setting:', error);
            return defaultValue;
        }
    }

    async getAllSettings(): Promise<Record<string, any>> {
        try {
            const data = await AsyncStorage.getItem(KEYS.SETTINGS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting all settings:', error);
            return {};
        }
    }

    // Utility
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove(Object.values(KEYS));
        } catch (error) {
            console.error('Error clearing all data:', error);
            throw error;
        }
    }
}

export default new AsyncStorageService();
