// Export all reference photo feature components, hooks, and services
export { SetReferenceButton } from './components/SetReferenceButton';
export { AnalysisModal } from './components/AnalysisModal';

export { useReferencePhoto } from './hooks/useReferencePhoto';

export {
  analyzeReferencePhoto,
  calculateMatchScore,
  generateCoachingTips
} from './services/analysisService';

export * from './types';