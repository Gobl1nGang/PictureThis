import { ReferenceAnalysis, MatchScore, CoachingTip } from '../types';
import { analyzeReferenceImage } from '../../../services/bedrock';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

export const analyzeReferencePhoto = async (imageUri: string): Promise<ReferenceAnalysis> => {
  try {
    let processUri = imageUri;

    // Download and convert remote images
    if (imageUri.startsWith('http')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      processUri = await base64Promise;

      // Auto-save to library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        try {
          await MediaLibrary.saveToLibraryAsync(imageUri);
        } catch (saveError) {
          console.log('Could not save to library');
        }
      }
    }

    // Convert image to base64 for AI analysis - smaller size for Bedrock limits
    const manipResult = await manipulateAsync(
      processUri,
      [{ resize: { width: 480 } }],
      { compress: 0.5, format: SaveFormat.JPEG, base64: true }
    );

    if (!manipResult.base64) {
      throw new Error('Failed to process image');
    }

    // Create AI prompt for reference photo analysis
    const prompt = `Return JSON only:
{
  "pictureType": "Portrait/Landscape/Street/etc",
  "style": "Cinematic/Documentary/etc",
  "subject": "main subject",
  "composition": "rule of thirds/leading lines/etc",
  "lighting": "golden hour/soft/hard/etc",
  "lens": "wide/portrait/macro/etc",
  "colorTone": "warm/cool/high contrast/etc",
  "summary": "key techniques"
}`;

    // Get AI analysis
    const aiResponse = await analyzeReferenceImage(manipResult.base64, prompt);
    
    // Clean response and try to extract JSON
    const cleanResponse = aiResponse.trim();
    
    // Try to find JSON in the response
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (analysis.pictureType && analysis.style && analysis.subject) {
          return analysis as ReferenceAnalysis;
        }
      } catch (parseError) {
        console.error('JSON parse failed:', parseError);
      }
    }
    
    // Fallback to text parsing
    console.log('Using text parsing fallback for response:', cleanResponse);
    return parseTextResponse(cleanResponse);
  } catch (error) {
    console.error('Reference analysis error:', error);
    // Fallback to basic analysis
    return {
      pictureType: "Photography",
      style: "Natural",
      subject: "Photo content",
      composition: "Standard framing",
      lighting: "Available light",
      lens: "Standard lens",
      colorTone: "Natural colors",
      summary: "Focus on composition and lighting to recreate this style."
    };
  }
};

// Helper function to parse text response if JSON parsing fails
const parseTextResponse = (text: string): ReferenceAnalysis => {
  const extractField = (fieldName: string, fallback: string): string => {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n,}]+)`, 'i');
    const match = text.match(regex);
    const result = match ? match[1].trim().replace(/[\"']/g, '') : '';
    return result && result !== 'Not specified' ? result : fallback;
  };

  return {
    pictureType: extractField('pictureType', '') || extractField('type', 'Photography'),
    style: extractField('style', 'Natural'),
    subject: extractField('subject', 'Photo content'),
    composition: extractField('composition', 'Standard framing'),
    lighting: extractField('lighting', 'Available light'),
    lens: extractField('lens', 'Standard lens'),
    colorTone: extractField('colorTone', '') || extractField('color', 'Natural colors'),
    summary: extractField('summary', 'Focus on composition and lighting to recreate this style.')
  };
};

export const calculateMatchScore = (currentFrame: any, reference: ReferenceAnalysis): MatchScore => {
  // TODO: Implement real-time matching algorithm
  const overall = Math.floor(Math.random() * 100);
  return {
    overall,
    composition: Math.floor(Math.random() * 100),
    lighting: Math.floor(Math.random() * 100),
    style: Math.floor(Math.random() * 100),
  };
};

export const generateCoachingTips = (currentFrame: any, reference: ReferenceAnalysis): CoachingTip[] => {
  // TODO: Implement real coaching logic
  const tips = [
    { message: "Move slightly to the left", priority: 'high' as const },
    { message: "Tilt camera down 5 degrees", priority: 'medium' as const },
    { message: "Add more light from the right", priority: 'high' as const },
    { message: "Step back for better framing", priority: 'medium' as const },
    { message: "Center the subject more", priority: 'low' as const }
  ];
  return tips.slice(0, Math.floor(Math.random() * 3) + 1);
};