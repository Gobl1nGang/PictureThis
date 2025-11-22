// Export all reference photo feature components, hooks, and services
export { SetReferenceButton } from './components/SetReferenceButton';
export { ReferenceAnalysisModal } from './components/ReferenceAnalysisModal';
export { ReferenceModeIndicator } from './components/ReferenceModeIndicator';
export { LiveCoachingOverlay } from './components/LiveCoachingOverlay';
export { AnalysisModal } from './components/AnalysisModal';

export { useReferencePhoto } from './hooks/useReferencePhoto';

export { 
  analyzeReferencePhoto, 
  calculateMatchScore, 
  generateCoachingTips 
} from './services/analysisService';

export * from './types';