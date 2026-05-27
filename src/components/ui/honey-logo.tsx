import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface HoneyLogoProps {
  size?: number;
  style?: object;
}

/**
 * Logo hexagonal do Honey Control com gota de mel interna.
 * Usa react-native-svg — disponível no Expo Go sem rebuild.
 */
export function HoneyLogo({ size = 56, style }: HoneyLogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityLabel="Honey Control logo"
      style={style}
    >
      <Defs>
        <LinearGradient id="hg-grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#F5C859" />
          <Stop offset="100%" stopColor="#C47C0A" />
        </LinearGradient>
      </Defs>
      {/* Hexágono externo */}
      <Path
        d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z"
        fill="url(#hg-grad)"
      />
      {/* Gota de mel interna */}
      <Path
        d="M32 16c-3 5-7 8-7 14a7 7 0 0 0 14 0c0-6-4-9-7-14Z"
        fill="#fff"
        opacity={0.95}
      />
    </Svg>
  );
}
