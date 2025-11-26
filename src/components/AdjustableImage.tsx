import React from 'react';
import { Canvas, Image, useImage } from '@shopify/react-native-skia';
import { createAdjustmentFilter, ImageAdjustments } from '../services/imageAdjustments';

interface AdjustableImageProps {
  uri: string;
  width: number;
  height: number;
  adjustments: ImageAdjustments;
}

export const AdjustableImage: React.FC<AdjustableImageProps> = ({
  uri,
  width,
  height,
  adjustments,
}) => {
  const image = useImage(uri);
  
  if (!image) return null;

  const colorFilter = createAdjustmentFilter(adjustments);
  console.log('AdjustableImage - adjustments:', adjustments, 'filter:', !!colorFilter);

  return (
    <Canvas style={{ width, height }}>
      <Image
        image={image}
        x={0}
        y={0}
        width={width}
        height={height}
        fit="contain"
        colorFilter={colorFilter}
      />
    </Canvas>
  );
};