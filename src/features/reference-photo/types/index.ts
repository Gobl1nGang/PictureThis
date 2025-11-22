export interface ReferenceAnalysis {
  pictureType: string;
  style: string;
  subject: string;
  composition: string;
  lighting: string;
  lens: string;
  colorTone: string;
  summary: string;
}

export interface CoachingTip {
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MatchScore {
  overall: number;
  composition: number;
  lighting: number;
  style: number;
}

export interface ReferencePhoto {
  uri: string;
  analysis?: ReferenceAnalysis;
}