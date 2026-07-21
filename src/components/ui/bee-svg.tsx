import React, { useEffect } from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface BeeSvgProps {
  size?: number;
  animateWings?: boolean;
}

/**
 * Abelhinha decorativa de perfil, voltada para a direita.
 * O flip para a esquerda é responsabilidade de quem renderiza (scaleX: -1).
 * Usa react-native-svg — disponível no Expo Go sem rebuild.
 */
export function BeeSvg({ size = 28, animateWings = true }: BeeSvgProps) {
  const flap = useSharedValue(0);

  useEffect(() => {
    if (!animateWings) return;
    flap.value = withRepeat(withTiming(1, { duration: 90 }), -1, true);
    return () => cancelAnimation(flap);
  }, [animateWings, flap]);

  const backWingProps = useAnimatedProps(() => ({
    ry: 3.4 - flap.value * 1.9,
  }));
  const frontWingProps = useAnimatedProps(() => ({
    ry: 3.8 - flap.value * 2.1,
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Ferrão */}
      <Path d="M10 19 L5.5 20.4 L10 21.8 Z" fill="#1F1B16" />
      {/* Asa de trás */}
      <AnimatedEllipse
        animatedProps={backWingProps}
        cx={19.5}
        cy={11}
        rx={4.4}
        rotation={-18}
        originX={19.5}
        originY={11}
        fill="#F5F1EA" // ink.50
        opacity={0.8}
      />
      {/* Corpo — honey.400 */}
      <Ellipse cx={17} cy={20} rx={8} ry={5.8} fill="#F0B12C" />
      {/* Listras — ink.900 */}
      <Ellipse cx={13.5} cy={20} rx={1.5} ry={5.3} fill="#1F1B16" />
      <Ellipse cx={17.5} cy={20} rx={1.5} ry={5.6} fill="#1F1B16" />
      <Ellipse cx={21.5} cy={20} rx={1.4} ry={4.7} fill="#1F1B16" />
      {/* Cabeça */}
      <Circle cx={26} cy={18.5} r={3.4} fill="#1F1B16" />
      {/* Antenas */}
      <Path
        d="M25 15.4 C25.4 13.6 26 12.6 27.4 11.6"
        stroke="#1F1B16"
        strokeWidth={0.9}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M27.4 15.8 C28.2 14.4 29 13.6 30.4 13"
        stroke="#1F1B16"
        strokeWidth={0.9}
        strokeLinecap="round"
        fill="none"
      />
      {/* Asa da frente */}
      <AnimatedEllipse
        animatedProps={frontWingProps}
        cx={15.5}
        cy={10}
        rx={5}
        rotation={-22}
        originX={15.5}
        originY={10}
        fill="#FEF9EC" // honey.50
        opacity={0.85}
      />
    </Svg>
  );
}
