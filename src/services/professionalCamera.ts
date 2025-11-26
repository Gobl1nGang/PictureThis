import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

export interface CameraSettings {
  iso: number;
  shutterSpeed: string;
  aperture: number;
  whiteBalance: string;
  focusMode: 'auto' | 'manual';
  manualFocus: number;
  exposureCompensation: number;
  meteringMode: 'matrix' | 'center' | 'spot';
  imageStabilization: boolean;
}

export interface BracketingSettings {
  mode: 'exposure' | 'focus' | 'wb' | 'off';
  steps: number;
  stepSize: number;
}

export interface ProCameraMode {
  id: string;
  name: string;
  description: string;
  defaultSettings: Partial<CameraSettings>;
  features: string[];
}

export const PRO_CAMERA_MODES: ProCameraMode[] = [
  {
    id: 'astro',
    name: 'Astrophotography',
    description: 'Long exposure for stars and night sky',
    defaultSettings: {
      iso: 3200,
      shutterSpeed: '30s',
      aperture: 2.8,
      whiteBalance: 'daylight',
      focusMode: 'manual',
      manualFocus: 1.0,
      imageStabilization: false,
    },
    features: ['Long Exposure', 'Star Tracking', 'Noise Reduction', 'Manual Focus']
  },
  {
    id: 'sport',
    name: 'Sports & Action',
    description: 'Fast shutter for motion capture',
    defaultSettings: {
      iso: 800,
      shutterSpeed: '1/1000',
      aperture: 4.0,
      meteringMode: 'center',
      imageStabilization: true,
    },
    features: ['Burst Mode', 'Tracking AF', 'High ISO', 'Fast Shutter']
  },
  {
    id: 'macro',
    name: 'Macro Photography',
    description: 'Extreme close-up with focus stacking',
    defaultSettings: {
      iso: 200,
      shutterSpeed: '1/125',
      aperture: 8.0,
      focusMode: 'manual',
      meteringMode: 'spot',
    },
    features: ['Focus Stacking', 'Focus Peaking', 'Magnification', 'Depth Mapping']
  },
  {
    id: 'landscape',
    name: 'Landscape',
    description: 'Wide scenic shots with optimal sharpness',
    defaultSettings: {
      iso: 100,
      shutterSpeed: '1/60',
      aperture: 11,
      whiteBalance: 'daylight',
      meteringMode: 'matrix',
    },
    features: ['Hyperfocal Distance', 'Graduated Filters', 'HDR Bracketing', 'Focus Stacking']
  },
  {
    id: 'portrait',
    name: 'Portrait Pro',
    description: 'Professional portrait with depth control',
    defaultSettings: {
      iso: 200,
      shutterSpeed: '1/125',
      aperture: 2.8,
      whiteBalance: 'auto',
      meteringMode: 'center',
    },
    features: ['Eye Detection', 'Skin Tone', 'Bokeh Control', 'Beauty Mode']
  },
  {
    id: 'street',
    name: 'Street Photography',
    description: 'Quick capture with zone focusing',
    defaultSettings: {
      iso: 400,
      shutterSpeed: '1/250',
      aperture: 5.6,
      focusMode: 'auto',
      meteringMode: 'matrix',
    },
    features: ['Zone Focus', 'Silent Mode', 'Quick Capture', 'Hyperfocal']
  }
];

export class ProfessionalCameraService {
  private settings: CameraSettings;
  private bracketingSettings: BracketingSettings;
  private currentMode: ProCameraMode;

  constructor() {
    this.settings = {
      iso: 100,
      shutterSpeed: '1/60',
      aperture: 2.8,
      whiteBalance: 'auto',
      focusMode: 'auto',
      manualFocus: 0.5,
      exposureCompensation: 0,
      meteringMode: 'matrix',
      imageStabilization: true,
    };

    this.bracketingSettings = {
      mode: 'off',
      steps: 3,
      stepSize: 1,
    };

    this.currentMode = PRO_CAMERA_MODES[0];
  }

  // Mode Management
  setMode(modeId: string): ProCameraMode | null {
    const mode = PRO_CAMERA_MODES.find(m => m.id === modeId);
    if (mode) {
      this.currentMode = mode;
      this.applyModeSettings(mode);
      return mode;
    }
    return null;
  }

  private applyModeSettings(mode: ProCameraMode): void {
    this.settings = { ...this.settings, ...mode.defaultSettings };
  }

  // Manual Controls
  setISO(iso: number): void {
    this.settings.iso = Math.max(50, Math.min(12800, iso));
  }

  setShutterSpeed(speed: string): void {
    this.settings.shutterSpeed = speed;
  }

  setAperture(aperture: number): void {
    this.settings.aperture = Math.max(1.4, Math.min(16, aperture));
  }

  setWhiteBalance(wb: string): void {
    this.settings.whiteBalance = wb;
  }

  setExposureCompensation(ev: number): void {
    this.settings.exposureCompensation = Math.max(-3, Math.min(3, ev));
  }

  // Focus Control
  setFocusMode(mode: 'auto' | 'manual'): void {
    this.settings.focusMode = mode;
  }

  setManualFocus(distance: number): void {
    this.settings.manualFocus = Math.max(0, Math.min(1, distance));
  }

  // Bracketing
  setBracketing(mode: 'exposure' | 'focus' | 'wb' | 'off', steps: number = 3, stepSize: number = 1): void {
    this.bracketingSettings = { mode, steps, stepSize };
  }

  // Advanced Capture Methods
  async captureWithBracketing(cameraRef: any): Promise<string[]> {
    const images: string[] = [];
    
    if (this.bracketingSettings.mode === 'off') {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      return photo ? [photo.uri] : [];
    }

    const originalSettings = { ...this.settings };
    
    try {
      switch (this.bracketingSettings.mode) {
        case 'exposure':
          return await this.captureExposureBracketing(cameraRef);
        case 'focus':
          return await this.captureFocusStacking(cameraRef);
        case 'wb':
          return await this.captureWhiteBalanceBracketing(cameraRef);
        default:
          return [];
      }
    } finally {
      this.settings = originalSettings;
    }
  }

  private async captureExposureBracketing(cameraRef: any): Promise<string[]> {
    const images: string[] = [];
    const { steps, stepSize } = this.bracketingSettings;
    const baseEV = this.settings.exposureCompensation;
    
    for (let i = 0; i < steps; i++) {
      const evOffset = (i - Math.floor(steps / 2)) * stepSize;
      this.setExposureCompensation(baseEV + evOffset);
      
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      
      if (photo?.uri) {
        images.push(photo.uri);
      }
      
      // Small delay between captures
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return images;
  }

  private async captureFocusStacking(cameraRef: any): Promise<string[]> {
    const images: string[] = [];
    const { steps } = this.bracketingSettings;
    
    for (let i = 0; i < steps; i++) {
      const focusDistance = i / (steps - 1);
      this.setManualFocus(focusDistance);
      
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      
      if (photo?.uri) {
        images.push(photo.uri);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return images;
  }

  private async captureWhiteBalanceBracketing(cameraRef: any): Promise<string[]> {
    const images: string[] = [];
    const wbPresets = ['daylight', 'cloudy', 'shade', 'tungsten'];
    
    for (const wb of wbPresets) {
      this.setWhiteBalance(wb);
      
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      
      if (photo?.uri) {
        images.push(photo.uri);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return images;
  }

  // HDR Processing
  async processHDRImages(imageUris: string[]): Promise<string> {
    if (imageUris.length < 2) {
      return imageUris[0] || '';
    }

    try {
      // Simulate HDR processing by blending exposures
      // In a real implementation, this would use advanced tone mapping
      const baseImage = imageUris[Math.floor(imageUris.length / 2)];
      
      const result = await manipulateAsync(
        baseImage,
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
      console.error('HDR processing failed:', error);
      return imageUris[0] || '';
    }
  }

  // Focus Stacking
  async processFocusStack(imageUris: string[]): Promise<string> {
    if (imageUris.length < 2) {
      return imageUris[0] || '';
    }

    try {
      // Simulate focus stacking by selecting the sharpest areas
      // In a real implementation, this would analyze edge detection
      const result = await manipulateAsync(
        imageUris[Math.floor(imageUris.length / 2)],
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
      console.error('Focus stacking failed:', error);
      return imageUris[0] || '';
    }
  }

  // Utility Methods
  calculateHyperfocalDistance(aperture: number, focalLength: number = 28): number {
    // Simplified hyperfocal distance calculation
    // H = (f²) / (N × c) + f
    // where f = focal length, N = f-number, c = circle of confusion
    const circleOfConfusion = 0.03; // mm for full frame equivalent
    return Math.pow(focalLength, 2) / (aperture * circleOfConfusion) + focalLength;
  }

  getOptimalSettings(sceneType: string): Partial<CameraSettings> {
    const presets: Record<string, Partial<CameraSettings>> = {
      'low-light': {
        iso: 1600,
        shutterSpeed: '1/30',
        aperture: 2.8,
        imageStabilization: true,
      },
      'bright-sun': {
        iso: 100,
        shutterSpeed: '1/250',
        aperture: 8.0,
      },
      'golden-hour': {
        iso: 200,
        shutterSpeed: '1/125',
        aperture: 5.6,
        whiteBalance: 'daylight',
      },
      'blue-hour': {
        iso: 800,
        shutterSpeed: '1/15',
        aperture: 4.0,
        whiteBalance: 'tungsten',
      },
    };

    return presets[sceneType] || {};
  }

  // Export/Import Settings
  exportSettings(): string {
    return JSON.stringify({
      settings: this.settings,
      bracketing: this.bracketingSettings,
      mode: this.currentMode.id,
    });
  }

  importSettings(settingsJson: string): boolean {
    try {
      const data = JSON.parse(settingsJson);
      this.settings = { ...this.settings, ...data.settings };
      this.bracketingSettings = { ...this.bracketingSettings, ...data.bracketing };
      if (data.mode) {
        this.setMode(data.mode);
      }
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  // Getters
  getSettings(): CameraSettings {
    return { ...this.settings };
  }

  getBracketingSettings(): BracketingSettings {
    return { ...this.bracketingSettings };
  }

  getCurrentMode(): ProCameraMode {
    return this.currentMode;
  }

  // Professional Metadata
  generateMetadata(): Record<string, any> {
    return {
      camera: {
        mode: this.currentMode.name,
        iso: this.settings.iso,
        shutterSpeed: this.settings.shutterSpeed,
        aperture: `f/${this.settings.aperture}`,
        whiteBalance: this.settings.whiteBalance,
        focusMode: this.settings.focusMode,
        exposureCompensation: this.settings.exposureCompensation,
        meteringMode: this.settings.meteringMode,
      },
      capture: {
        timestamp: new Date().toISOString(),
        bracketing: this.bracketingSettings.mode !== 'off' ? this.bracketingSettings : null,
        imageStabilization: this.settings.imageStabilization,
      },
      processing: {
        version: '1.0.0',
        features: this.currentMode.features,
      }
    };
  }
}

export const professionalCamera = new ProfessionalCameraService();