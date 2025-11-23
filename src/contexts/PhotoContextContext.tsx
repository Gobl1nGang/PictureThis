import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PhotoContext, PhotoContextType, TimeOfDay, Environment, SubjectType, ReferencePhotoData } from '../types';
import AsyncStorageService from '../storage/AsyncStorageService';
import { useReferencePhoto } from '../features/reference-photo';

interface PhotoContextContextType {
    currentContext: PhotoContext | null;
    contextHistory: PhotoContext[];
    loading: boolean;
    setContext: (context: Partial<PhotoContext>) => Promise<void>;
    clearContext: () => Promise<void>;
    updateContextField: <K extends keyof PhotoContext>(field: K, value: PhotoContext[K]) => Promise<void>;
    addReferencePhoto: (photo: ReferencePhotoData) => Promise<void>;
    removeReferencePhoto: (uri: string) => Promise<void>;
}

const PhotoContextContext = createContext<PhotoContextContextType | undefined>(undefined);

export const PhotoContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentContext, setCurrentContext] = useState<PhotoContext | null>(null);
    const [contextHistory, setContextHistory] = useState<PhotoContext[]>([]);
    const [loading, setLoading] = useState(true);
    const { referencePhoto } = useReferencePhoto();

    useEffect(() => {
        loadContext();
    }, []);

    // Sync reference photo from existing hook into context
    useEffect(() => {
        if (referencePhoto && currentContext) {
            const hasReference = currentContext.referencePhotos.some(r => r.uri === referencePhoto.uri);
            if (!hasReference) {
                addReferencePhoto(referencePhoto);
            }
        }
    }, [referencePhoto]);

    const loadContext = async () => {
        try {
            const savedContext = await AsyncStorageService.getCurrentContext();
            const history = await AsyncStorageService.getContextHistory();
            setCurrentContext(savedContext);
            setContextHistory(history);
        } catch (error) {
            console.error('Error loading context:', error);
        } finally {
            setLoading(false);
        }
    };

    const setContext = async (contextData: Partial<PhotoContext>) => {
        try {
            const newContext: PhotoContext = {
                id: `context_${Date.now()}`,
                type: contextData.type || 'Portrait',
                timeOfDay: contextData.timeOfDay || detectTimeOfDay(),
                environment: contextData.environment || 'Outdoor',
                subjectType: contextData.subjectType || 'Unknown',
                referencePhotos: contextData.referencePhotos || (referencePhoto ? [referencePhoto] : []),
                customDescription: contextData.customDescription,
                userNotes: contextData.userNotes,
                createdAt: Date.now(),
                ...contextData,
            };

            await AsyncStorageService.saveCurrentContext(newContext);
            setCurrentContext(newContext);
            setContextHistory(prev => [newContext, ...prev.slice(0, 19)]);
        } catch (error) {
            console.error('Error setting context:', error);
            throw error;
        }
    };

    const clearContext = async () => {
        try {
            await AsyncStorageService.clearCurrentContext();
            setCurrentContext(null);
        } catch (error) {
            console.error('Error clearing context:', error);
            throw error;
        }
    };

    const updateContextField = async <K extends keyof PhotoContext>(
        field: K,
        value: PhotoContext[K]
    ) => {
        if (!currentContext) return;

        try {
            const updated = { ...currentContext, [field]: value };
            await AsyncStorageService.saveCurrentContext(updated);
            setCurrentContext(updated);
        } catch (error) {
            console.error('Error updating context field:', error);
            throw error;
        }
    };

    const addReferencePhoto = async (photo: ReferencePhotoData) => {
        if (!currentContext) {
            // Create a new context if none exists
            await setContext({ referencePhotos: [photo] });
            return;
        }

        try {
            const updated = {
                ...currentContext,
                referencePhotos: [...currentContext.referencePhotos, photo],
            };
            await AsyncStorageService.saveCurrentContext(updated);
            setCurrentContext(updated);
        } catch (error) {
            console.error('Error adding reference photo:', error);
            throw error;
        }
    };

    const removeReferencePhoto = async (uri: string) => {
        if (!currentContext) return;

        try {
            const updated = {
                ...currentContext,
                referencePhotos: currentContext.referencePhotos.filter(p => p.uri !== uri),
            };
            await AsyncStorageService.saveCurrentContext(updated);
            setCurrentContext(updated);
        } catch (error) {
            console.error('Error removing reference photo:', error);
            throw error;
        }
    };

    const value: PhotoContextContextType = {
        currentContext,
        contextHistory,
        loading,
        setContext,
        clearContext,
        updateContextField,
        addReferencePhoto,
        removeReferencePhoto,
    };

    return (
        <PhotoContextContext.Provider value={value}>
            {children}
        </PhotoContextContext.Provider>
    );
};

export const usePhotoContext = (): PhotoContextContextType => {
    const context = useContext(PhotoContextContext);
    if (context === undefined) {
        throw new Error('usePhotoContext must be used within a PhotoContextProvider');
    }
    return context;
};

// Helper function to detect time of day
function detectTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();

    if ((hour >= 5 && hour <= 7) || (hour >= 17 && hour <= 19)) {
        return 'Golden Hour';
    } else if ((hour >= 4 && hour < 5) || (hour >= 19 && hour <= 20)) {
        return 'Blue Hour';
    } else if (hour >= 21 || hour <= 4) {
        return 'Night';
    } else {
        return 'Midday';
    }
}
