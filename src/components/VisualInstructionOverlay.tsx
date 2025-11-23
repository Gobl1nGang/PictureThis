import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    withDelay
} from 'react-native-reanimated';

export type InstructionType =
    | 'move_left'
    | 'move_right'
    | 'move_up'
    | 'move_down'
    | 'move_forward'
    | 'move_back'
    | 'rotate_cw'
    | 'rotate_ccw'
    | 'light_top_left'
    | 'light_top_center'
    | 'light_top_right'
    | 'light_mid_left'
    | 'light_mid_right'
    | 'light_bottom_left'
    | 'light_bottom_center'
    | 'light_bottom_right'
    | 'angle_high'
    | 'angle_low'
    | null;

interface VisualInstructionOverlayProps {
    instructions: InstructionType[];
}

const { width, height } = Dimensions.get('window');
const ICON_SIZE = 80;
const LIGHT_ICON_SIZE = 60;
const ANIMATION_DISTANCE = 50;
const DURATION = 1000;

const MovementIndicator: React.FC<{ instruction: InstructionType }> = ({ instruction }) => {
    const offset = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    useEffect(() => {
        offset.value = 0;
        opacity.value = 1;
        scale.value = 1;
        rotation.value = 0;

        switch (instruction) {
            case 'move_left':
                offset.value = withRepeat(
                    withSequence(
                        withTiming(-ANIMATION_DISTANCE, { duration: DURATION, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: 0 })
                    ), -1, false
                );
                opacity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: DURATION * 0.7 }),
                        withTiming(0, { duration: DURATION * 0.3 }),
                        withTiming(1, { duration: 0 })
                    ), -1, false
                );
                break;
            case 'move_right':
                offset.value = withRepeat(
                    withSequence(
                        withTiming(ANIMATION_DISTANCE, { duration: DURATION, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: 0 })
                    ), -1, false
                );
                opacity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: DURATION * 0.7 }),
                        withTiming(0, { duration: DURATION * 0.3 }),
                        withTiming(1, { duration: 0 })
                    ), -1, false
                );
                break;
            case 'move_up':
            case 'angle_low': // Move camera up/tilt up
                offset.value = withRepeat(
                    withSequence(
                        withTiming(-ANIMATION_DISTANCE, { duration: DURATION, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: 0 })
                    ), -1, false
                );
                opacity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: DURATION * 0.7 }),
                        withTiming(0, { duration: DURATION * 0.3 }),
                        withTiming(1, { duration: 0 })
                    ), -1, false
                );
                break;
            case 'move_down':
            case 'angle_high': // Move camera down/tilt down
                offset.value = withRepeat(
                    withSequence(
                        withTiming(ANIMATION_DISTANCE, { duration: DURATION, easing: Easing.out(Easing.quad) }),
                        withTiming(0, { duration: 0 })
                    ), -1, false
                );
                opacity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: DURATION * 0.7 }),
                        withTiming(0, { duration: DURATION * 0.3 }),
                        withTiming(1, { duration: 0 })
                    ), -1, false
                );
                break;
            case 'move_forward':
                scale.value = withRepeat(
                    withSequence(
                        withTiming(1.5, { duration: DURATION, easing: Easing.out(Easing.quad) }),
                        withTiming(1, { duration: 0 })
                    ), -1, false
                );
                opacity.value = withRepeat(
                    withSequence(
                        withTiming(0, { duration: DURATION, easing: Easing.in(Easing.quad) }),
                        withTiming(1, { duration: 0 })
                    ), -1, false
                );
                break;
            case 'move_back':
                scale.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }),
                        withTiming(1.5, { duration: 0 })
                    ), -1, false
                );
                opacity.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: DURATION }),
                        withTiming(0, { duration: 0 })
                    ), -1, false
                );
                break;
            case 'rotate_cw':
                rotation.value = withRepeat(withTiming(90, { duration: DURATION }), -1, false);
                break;
            case 'rotate_ccw':
                rotation.value = withRepeat(withTiming(-90, { duration: DURATION }), -1, false);
                break;
        }
    }, [instruction]);

    const animatedStyle = useAnimatedStyle(() => {
        const transform = [];
        if (instruction === 'move_left' || instruction === 'move_right') transform.push({ translateX: offset.value });
        else if (instruction === 'move_up' || instruction === 'move_down' || instruction === 'angle_high' || instruction === 'angle_low') transform.push({ translateY: offset.value });
        else if (instruction === 'move_forward' || instruction === 'move_back') transform.push({ scale: scale.value });
        else if (instruction?.includes('rotate')) transform.push({ rotate: `${rotation.value}deg` });

        return { transform, opacity: opacity.value };
    });

    let iconName: keyof typeof Ionicons.glyphMap = 'arrow-forward';
    let rotateIcon = '0deg';

    switch (instruction) {
        case 'move_left': iconName = 'arrow-back'; break;
        case 'move_right': iconName = 'arrow-forward'; break;
        case 'move_up': iconName = 'arrow-up'; break;
        case 'move_down': iconName = 'arrow-down'; break;
        case 'move_forward': iconName = 'add-circle-outline'; break;
        case 'move_back': iconName = 'remove-circle-outline'; break;
        case 'rotate_cw': iconName = 'refresh'; break;
        case 'rotate_ccw': iconName = 'refresh'; rotateIcon = '180deg'; break;
        case 'angle_high': iconName = 'arrow-down-circle-outline'; break; // Look down
        case 'angle_low': iconName = 'arrow-up-circle-outline'; break; // Look up
    }

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                <Ionicons name={iconName} size={ICON_SIZE} color="rgba(255, 255, 255, 0.9)" />
            </Animated.View>
        </View>
    );
};

const LightingIndicator: React.FC<{ instruction: InstructionType }> = ({ instruction }) => {
    const scale = useSharedValue(0);
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
        scale.value = 0;
        scale.value = withTiming(1, { duration: 500, easing: Easing.back(1.5) });
        glowOpacity.value = withRepeat(
            withSequence(withTiming(1, { duration: 500 }), withTiming(0.4, { duration: 500 })),
            -1, true
        );
    }, [instruction]);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

    const padding = 40;
    let positionStyle: any = {};

    switch (instruction) {
        case 'light_top_left': positionStyle = { position: 'absolute', top: padding + 50, left: padding }; break;
        case 'light_top_center': positionStyle = { position: 'absolute', top: padding + 50, alignSelf: 'center' }; break;
        case 'light_top_right': positionStyle = { position: 'absolute', top: padding + 50, right: padding }; break;
        case 'light_mid_left': positionStyle = { position: 'absolute', top: height / 2, left: padding }; break;
        case 'light_mid_right': positionStyle = { position: 'absolute', top: height / 2, right: padding }; break;
        case 'light_bottom_left': positionStyle = { position: 'absolute', bottom: padding + 100, left: padding }; break;
        case 'light_bottom_center': positionStyle = { position: 'absolute', bottom: padding + 100, alignSelf: 'center' }; break;
        case 'light_bottom_right': positionStyle = { position: 'absolute', bottom: padding + 100, right: padding }; break;
    }

    return (
        <View style={positionStyle}>
            <Animated.View style={[styles.lightContainer, animatedStyle]}>
                <Animated.View style={[styles.glow, glowStyle]} />
                <Ionicons name="sunny" size={LIGHT_ICON_SIZE} color="#FFD700" />
            </Animated.View>
        </View>
    );
};

export const VisualInstructionOverlay: React.FC<VisualInstructionOverlayProps> = ({ instructions }) => {
    if (!instructions || instructions.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {instructions.map((inst, index) => {
                if (!inst) return null;
                if (inst.startsWith('light_')) {
                    return <LightingIndicator key={`light-${index}`} instruction={inst} />;
                } else {
                    return <MovementIndicator key={`move-${index}`} instruction={inst} />;
                }
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    iconContainer: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    lightContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 215, 0, 0.5)',
        zIndex: -1,
    }
});
