import { useState, useCallback } from 'react';
import { ReferencePhoto, ReferenceAnalysis } from '../types';
import { analyzeReferencePhoto } from '../services/analysisService';

export const useReferencePhoto = () => {
  const [referencePhoto, setReferencePhoto] = useState<ReferencePhoto | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const setReference = useCallback(async (imageUri: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const analysis = await analyzeReferencePhoto(imageUri);
      setReferencePhoto({
        uri: imageUri,
        analysis
      });
    } catch (error) {
      setAnalysisError('Failed to analyze reference photo');
      console.error('Reference analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearReference = useCallback(() => {
    setReferencePhoto(null);
    setAnalysisError(null);
  }, []);

  return {
    referencePhoto,
    isAnalyzing,
    analysisError,
    setReference,
    clearReference,
    hasReference: !!referencePhoto
  };
};