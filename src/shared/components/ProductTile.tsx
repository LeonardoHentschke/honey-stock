import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ProductTileProps {
  /** Nome do produto — usado para inferir o tipo de mel quando `honeyType` é vazio. */
  name: string;
  /** Tipo de mel explícito (coluna `honey_type`). */
  honeyType?: string | null;
  size?: number;
}

interface TileColors {
  bg: string;
  fg: string;
}

function colorsFor(name: string, honeyType?: string | null): TileColors {
  const haystack = `${name} ${honeyType ?? ''}`;
  if (/eucalipto/i.test(haystack)) return { bg: '#E6F0E2', fg: '#3F6B3A' };
  if (/laranj/i.test(haystack)) return { bg: '#FDE8C4', fg: '#A65A14' };
  if (/pr[óo]polis|propol/i.test(haystack)) return { bg: '#E9DDC2', fg: '#7A5A2A' };
  // silvestre / default
  return { bg: '#FDEDB3', fg: '#9B5F0B' };
}

/**
 * Ícone de pote de mel, tonalizado por tipo de mel.
 * Espelha o `ProductTile` do protótipo de design (variante Remix).
 */
export function ProductTile({ name, honeyType, size = 48 }: ProductTileProps) {
  const { bg, fg } = colorsFor(name, honeyType);
  const icon = size * 0.6;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke={fg}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M9 3h6l-1 3h-4z" />
        <Path d="M7 6h10v4a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z" />
        <Path d="M7 14v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6" />
      </Svg>
    </View>
  );
}
