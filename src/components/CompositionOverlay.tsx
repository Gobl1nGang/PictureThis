import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Line, Path, Skia, Paint, Group } from '@shopify/react-native-skia';

export type CompositionType =
    | 'none'
    | 'rule_of_thirds'
    | 'golden_ratio'
    | 'golden_spiral_left'
    | 'golden_spiral_right'
    | 'center'
    | 'diagonal'
    | 'golden_triangle';

interface CompositionOverlayProps {
    type: CompositionType;
    width: number;
    height: number;
    color?: string;
    strokeWidth?: number;
}

export const CompositionOverlay: React.FC<CompositionOverlayProps> = ({
    type,
    width,
    height,
    color = 'rgba(255, 255, 255, 0.5)',
    strokeWidth = 1,
}) => {
    if (type === 'none') return null;

    const paint = useMemo(() => {
        const p = Skia.Paint();
        p.setColor(Skia.Color(color));
        p.setStrokeWidth(strokeWidth);
        p.setStyle(1); // Stroke
        return p;
    }, [color, strokeWidth]);

    const renderOverlay = () => {
        switch (type) {
            case 'rule_of_thirds':
                return (
                    <Group>
                        <Line p1={{ x: width / 3, y: 0 }} p2={{ x: width / 3, y: height }} paint={paint} />
                        <Line p1={{ x: (width * 2) / 3, y: 0 }} p2={{ x: (width * 2) / 3, y: height }} paint={paint} />
                        <Line p1={{ x: 0, y: height / 3 }} p2={{ x: width, y: height / 3 }} paint={paint} />
                        <Line p1={{ x: 0, y: (height * 2) / 3 }} p2={{ x: width, y: (height * 2) / 3 }} paint={paint} />
                    </Group>
                );

            case 'golden_ratio':
                // 1 / 1.618 = 0.618... 
                // The lines are at 1 - 0.618 = 0.382 and 0.618
                const phi = 0.618;
                const invPhi = 1 - phi;
                return (
                    <Group>
                        <Line p1={{ x: width * invPhi, y: 0 }} p2={{ x: width * invPhi, y: height }} paint={paint} />
                        <Line p1={{ x: width * phi, y: 0 }} p2={{ x: width * phi, y: height }} paint={paint} />
                        <Line p1={{ x: 0, y: height * invPhi }} p2={{ x: width, y: height * invPhi }} paint={paint} />
                        <Line p1={{ x: 0, y: height * phi }} p2={{ x: width, y: height * phi }} paint={paint} />
                    </Group>
                );

            case 'center':
                return (
                    <Group>
                        <Line p1={{ x: width / 2, y: height / 2 - 20 }} p2={{ x: width / 2, y: height / 2 + 20 }} paint={paint} />
                        <Line p1={{ x: width / 2 - 20, y: height / 2 }} p2={{ x: width / 2 + 20, y: height / 2 }} paint={paint} />
                        {/* Optional: Add a circle */}
                        {/* <Circle cx={width / 2} cy={height / 2} r={50} style="stroke" paint={paint} /> */}
                    </Group>
                );

            case 'diagonal':
                return (
                    <Group>
                        <Line p1={{ x: 0, y: 0 }} p2={{ x: width, y: height }} paint={paint} />
                        <Line p1={{ x: width, y: 0 }} p2={{ x: 0, y: height }} paint={paint} />
                    </Group>
                );

            case 'golden_spiral_left':
            case 'golden_spiral_right':
                const path = Skia.Path.Make();
                // Simplified Golden Spiral approximation
                // This is complex to draw perfectly dynamic to any aspect ratio, 
                // but we can approximate with a few arcs or a bezier curve.
                // For now, let's draw a simple spiral starting from bottom left/right.

                // Actually, let's implement a proper Fibonacci spiral rect subdivision if possible, 
                // or just a static path scaled to the screen.
                // A simple approach for a "Golden Spiral" overlay is often just a spiral curve.

                path.moveTo(0, height);
                if (type === 'golden_spiral_right') {
                    // Start bottom left, spiral in towards top right roughly
                    // This is a placeholder for a real spiral calculation
                    // A real golden spiral is built on squares. 
                    // Let's draw a basic curve for now.
                    path.moveTo(width, height);
                    path.cubicTo(0, height, 0, 0, width * 0.618, height * 0.382);
                } else {
                    path.moveTo(0, height);
                    path.cubicTo(width, height, width, 0, width * (1 - 0.618), height * 0.382);
                }

                // Better implementation: Draw the golden rectangle lines + the spiral
                // Let's stick to a simple spiral path for MVP or maybe just the Phi Grid is enough?
                // User asked for "Golden Spiral".
                // Let's try to draw a better spiral.

                const spiralPath = Skia.Path.Make();
                const cx = width / 2;
                const cy = height / 2;

                // Let's just draw the main "Golden Rectangle" division line and a curve.
                // Vertical line at phi
                const xDiv = type === 'golden_spiral_right' ? width * 0.618 : width * (1 - 0.618);

                return (
                    <Group>
                        <Line p1={{ x: xDiv, y: 0 }} p2={{ x: xDiv, y: height }} paint={paint} />
                        {/* Horizontal division in the larger part? No, let's keep it simple for now. */}
                        {/* A true spiral is hard to calculate perfectly for arbitrary aspect ratios without looking distorted. */}
                        {/* Let's draw a bezier approximation. */}
                        <Path path={path} paint={paint} style="stroke" />
                    </Group>
                );

            case 'golden_triangle':
                // Main diagonal: Bottom-Left to Top-Right
                // Perpendicular from Top-Left to Main Diagonal
                // Perpendicular from Bottom-Right to Main Diagonal

                // Main Diagonal Line equation: y = - (h/w) * x + h
                // Slope m1 = -h/w

                // Perpendicular slope m2 = -1/m1 = w/h

                // Line from Top-Left (0,0): y = (w/h) * x
                // Intersection with Main Diagonal:
                // (w/h)x = -(h/w)x + h
                // (w/h + h/w)x = h
                // ((w^2 + h^2)/wh)x = h
                // x = (h^2 * w) / (w^2 + h^2)
                // y = (w/h) * x

                const m1 = -height / width;
                const m2 = width / height;

                // Intersection 1 (Top-Left to Main Diagonal)
                const x1 = (height * height * width) / (width * width + height * height);
                const y1 = m2 * x1;

                // Intersection 2 (Bottom-Right to Main Diagonal)
                // Line from (w, h): y - h = (w/h)(x - w) => y = (w/h)x - w^2/h + h
                // Wait, simpler geometry:
                // The Golden Triangle rule usually implies lines from corners meeting the diagonal at 90 degrees.

                // Let's just draw the lines connecting the corners to the calculated intersection points on the main diagonal.
                // Actually, for visual simplicity, let's just draw the lines to the diagonal.

                return (
                    <Group>
                        {/* Main Diagonal: Bottom-Left to Top-Right */}
                        <Line p1={{ x: 0, y: height }} p2={{ x: width, y: 0 }} paint={paint} />

                        {/* Line from Top-Left to Diagonal */}
                        <Line p1={{ x: 0, y: 0 }} p2={{ x: x1, y: y1 }} paint={paint} />

                        {/* Line from Bottom-Right to Diagonal */}
                        {/* By symmetry, the other intersection point is (w - x1, h - y1) */}
                        <Line p1={{ x: width, y: height }} p2={{ x: width - x1, y: height - y1 }} paint={paint} />
                    </Group>
                );

            default:
                return null;
        }
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={{ flex: 1 }}>
                {renderOverlay()}
            </Canvas>
        </View>
    );
};
