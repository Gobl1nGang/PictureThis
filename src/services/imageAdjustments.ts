import { Skia } from '@shopify/react-native-skia';

export interface ImageAdjustments {
  exposure: number;
  brightness: number;
  contrast: number;
  saturation: number;
  highlights: number;
  shadows: number;
}

export const createAdjustmentFilter = (adjustments: ImageAdjustments) => {
  const { brightness, contrast, saturation } = adjustments;
  
  // Skip filter if no adjustments
  if (brightness === 0 && contrast === 0 && saturation === 0) {
    return null;
  }
  
  const b = brightness / 100 * 255; // Scale to 0-255
  const c = 1 + contrast / 100;
  const s = 1 + saturation / 100;
  
  // Proper 4x5 color matrix for RGBA
  const matrix = [
    c * s, 0, 0, 0, b,
    0, c * s, 0, 0, b, 
    0, 0, c * s, 0, b,
    0, 0, 0, 1, 0
  ];
  
  return Skia.ColorFilter.MakeMatrix(matrix);
};