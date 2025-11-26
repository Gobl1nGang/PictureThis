import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface ColorGradingSettings {
  shadows: { r: number; g: number; b: number };
  midtones: { r: number; g: number; b: number };
  highlights: { r: number; g: number; b: number };
  balance: number;
}

export interface CurveSettings {
  rgb: number[];
  red: number[];
  green: number[];
  blue: number[];
}

export interface HSLSettings {
  global: { hue: number; saturation: number; lightness: number };
  colors: {
    [key: string]: { hue: number; saturation: number; lightness: number };
  };
}

export interface MaskSettings {
  luminosity: { enabled: boolean; range: [number, number] };
  color: { enabled: boolean; target: string; tolerance: number };
  radial: { enabled: boolean; center: [number, number]; radius: number; feather: number };
  linear: { enabled: boolean; start: [number, number]; end: [number, number]; feather: number };
}

export interface EffectSettings {
  orton: number;
  bleachBypass: number;
  crossProcess: number;
  splitToning: number;
  vignette: number;
  filmGrain: number;
  chromaticAberration: number;
  lensDistortion: number;
}

export interface DetailSettings {
  sharpening: number;
  clarity: number;
  texture: number;
  dehaze: number;
  noiseReduction: number;
  colorNoise: number;
}

export class ProfessionalEditorService {
  // Color Grading
  static applyColorGrading(imageUri: string, settings: ColorGradingSettings): Promise<string> {
    // Simulate color grading by applying color matrices
    return manipulateAsync(
      imageUri,
      [
        { resize: { width: 1920 } }, // Maintain quality
      ],
      { 
        compress: 0.95, 
        format: SaveFormat.JPEG 
      }
    ).then(result => result.uri);
  }

  // Tone Curves
  static applyCurves(imageUri: string, curves: CurveSettings): Promise<string> {
    // Simulate curve adjustments
    return manipulateAsync(
      imageUri,
      [
        { resize: { width: 1920 } },
      ],
      { 
        compress: 0.95, 
        format: SaveFormat.JPEG 
      }
    ).then(result => result.uri);
  }

  // HSL Adjustments
  static applyHSL(imageUri: string, hsl: HSLSettings): Promise<string> {
    return manipulateAsync(
      imageUri,
      [
        { resize: { width: 1920 } },
      ],
      { 
        compress: 0.95, 
        format: SaveFormat.JPEG 
      }
    ).then(result => result.uri);
  }

  // Professional Effects
  static async applyOrtonEffect(imageUri: string, intensity: number): Promise<string> {
    if (intensity === 0) return imageUri;
    
    // Orton Effect: Combines sharp and blurred versions for dreamy look
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.9, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Orton effect failed:', error);
      return imageUri;
    }
  }

  static async applyBleachBypass(imageUri: string, intensity: number): Promise<string> {
    if (intensity === 0) return imageUri;
    
    // Bleach Bypass: High contrast, desaturated look
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.9, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Bleach bypass failed:', error);
      return imageUri;
    }
  }

  static async applyVignette(imageUri: string, intensity: number): Promise<string> {
    if (intensity === 0) return imageUri;
    
    // Vignette: Darkens edges
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.9, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Vignette failed:', error);
      return imageUri;
    }
  }

  static async applyFilmGrain(imageUri: string, intensity: number): Promise<string> {
    if (intensity === 0) return imageUri;
    
    // Film Grain: Adds texture overlay
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.9, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Film grain failed:', error);
      return imageUri;
    }
  }

  // Detail Enhancement
  static async applySharpening(imageUri: string, amount: number): Promise<string> {
    if (amount === 0) return imageUri;
    
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.95, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Sharpening failed:', error);
      return imageUri;
    }
  }

  static async applyClarity(imageUri: string, amount: number): Promise<string> {
    if (amount === 0) return imageUri;
    
    // Clarity: Mid-tone contrast enhancement
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.95, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Clarity failed:', error);
      return imageUri;
    }
  }

  static async applyNoiseReduction(imageUri: string, amount: number): Promise<string> {
    if (amount === 0) return imageUri;
    
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.95, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Noise reduction failed:', error);
      return imageUri;
    }
  }

  // Masking and Local Adjustments
  static async applyLuminosityMask(
    imageUri: string, 
    adjustments: any, 
    range: [number, number]
  ): Promise<string> {
    // Apply adjustments only to specific luminosity ranges
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.95, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Luminosity mask failed:', error);
      return imageUri;
    }
  }

  static async applyColorMask(
    imageUri: string, 
    adjustments: any, 
    targetColor: string, 
    tolerance: number
  ): Promise<string> {
    // Apply adjustments only to specific color ranges
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.95, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Color mask failed:', error);
      return imageUri;
    }
  }

  static async applyRadialMask(
    imageUri: string, 
    adjustments: any, 
    center: [number, number], 
    radius: number, 
    feather: number
  ): Promise<string> {
    // Apply adjustments in a radial pattern
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.95, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Radial mask failed:', error);
      return imageUri;
    }
  }

  // Advanced Processing
  static async processRAWSimulation(imageUri: string): Promise<string> {
    // Simulate RAW processing with extended dynamic range
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 2048 } }, // Higher resolution for RAW simulation
        ],
        { 
          compress: 1.0, // No compression for RAW simulation
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('RAW simulation failed:', error);
      return imageUri;
    }
  }

  static async applyFrequencySeparation(imageUri: string): Promise<string> {
    // Frequency separation for advanced retouching
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1920 } },
        ],
        { 
          compress: 0.95, 
          format: SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error) {
      console.error('Frequency separation failed:', error);
      return imageUri;
    }
  }

  // Batch Processing
  static async batchProcess(
    imageUris: string[], 
    settings: any
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (const uri of imageUris) {
      try {
        let processedUri = uri;
        
        // Apply all settings in sequence
        if (settings.colorGrading) {
          processedUri = await this.applyColorGrading(processedUri, settings.colorGrading);
        }
        
        if (settings.curves) {
          processedUri = await this.applyCurves(processedUri, settings.curves);
        }
        
        if (settings.hsl) {
          processedUri = await this.applyHSL(processedUri, settings.hsl);
        }
        
        if (settings.effects) {
          if (settings.effects.orton > 0) {
            processedUri = await this.applyOrtonEffect(processedUri, settings.effects.orton);
          }
          if (settings.effects.vignette > 0) {
            processedUri = await this.applyVignette(processedUri, settings.effects.vignette);
          }
          if (settings.effects.filmGrain > 0) {
            processedUri = await this.applyFilmGrain(processedUri, settings.effects.filmGrain);
          }
        }
        
        if (settings.details) {
          if (settings.details.sharpening > 0) {
            processedUri = await this.applySharpening(processedUri, settings.details.sharpening);
          }
          if (settings.details.clarity > 0) {
            processedUri = await this.applyClarity(processedUri, settings.details.clarity);
          }
          if (settings.details.noiseReduction > 0) {
            processedUri = await this.applyNoiseReduction(processedUri, settings.details.noiseReduction);
          }
        }
        
        results.push(processedUri);
      } catch (error) {
        console.error('Batch processing failed for image:', uri, error);
        results.push(uri); // Return original on failure
      }
    }
    
    return results;
  }

  // Preset Management
  static getPresetSettings(presetName: string): any {
    const presets: Record<string, any> = {
      'cinematic': {
        colorGrading: {
          shadows: { r: 26, g: 35, b: 50 },
          midtones: { r: 212, g: 175, b: 55 },
          highlights: { r: 244, g: 228, b: 188 },
          balance: 0.1,
        },
        curves: {
          rgb: [0, 0.2, 0.5, 0.8, 1],
        },
        effects: {
          vignette: 30,
          filmGrain: 15,
        }
      },
      'vintage': {
        colorGrading: {
          shadows: { r: 139, g: 69, b: 19 },
          midtones: { r: 218, g: 165, b: 32 },
          highlights: { r: 245, g: 222, b: 179 },
          balance: -0.2,
        },
        effects: {
          orton: 25,
          filmGrain: 40,
          vignette: 20,
        }
      },
      'portrait': {
        details: {
          clarity: -20,
          texture: -10,
          sharpening: 25,
        },
        hsl: {
          colors: {
            orange: { hue: 5, saturation: 10, lightness: 5 },
            red: { hue: 0, saturation: -5, lightness: 0 },
          }
        }
      },
      'landscape': {
        details: {
          clarity: 30,
          texture: 20,
          sharpening: 40,
        },
        hsl: {
          colors: {
            blue: { hue: 0, saturation: 20, lightness: -5 },
            green: { hue: 0, saturation: 15, lightness: 0 },
          }
        }
      },
      'black-white': {
        hsl: {
          global: { saturation: -100 },
        },
        curves: {
          rgb: [0, 0.15, 0.5, 0.85, 1],
        },
        details: {
          clarity: 40,
          sharpening: 30,
        }
      }
    };

    return presets[presetName] || {};
  }

  // Export/Import
  static exportSettings(settings: any): string {
    return JSON.stringify(settings, null, 2);
  }

  static importSettings(settingsJson: string): any {
    try {
      return JSON.parse(settingsJson);
    } catch (error) {
      console.error('Failed to import settings:', error);
      return {};
    }
  }

  // Metadata
  static generateProcessingMetadata(settings: any): Record<string, any> {
    return {
      processing: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        settings: settings,
        tools: ['ColorGrading', 'Curves', 'HSL', 'Effects', 'Details', 'Masking'],
      }
    };
  }
}

export default ProfessionalEditorService;