import React from 'react';
import Svg, { Polygon } from 'react-native-svg';
import { View } from 'react-native';

/**
 * Grade decorativa de hexágonos em tons honey para o hero da LoginScreen (remix).
 * Deve ser renderizada dentro de um View com overflow: 'hidden'.
 * Posicionada absolutamente à direita do container, levemente fora da borda.
 */
export function HexPattern() {
  const rows = 5;
  const cols = 6;
  const w = 48;
  const h = 56;

  const polygons: React.ReactElement[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * w * 0.75 + (row % 2 ? w * 0.375 : 0) + 80;
      const y = row * h * 0.5 - 20;
      const offset = (row + col) % 3;
      const fill =
        offset === 0
          ? 'rgba(245,200,89,0.55)'
          : offset === 1
          ? 'rgba(232,155,18,0.20)'
          : 'rgba(252,239,200,0.9)';

      const points = [
        [x, y + h / 2],
        [x + w / 4, y],
        [x + (3 * w) / 4, y],
        [x + w, y + h / 2],
        [x + (3 * w) / 4, y + h],
        [x + w / 4, y + h],
      ]
        .map((p) => p.join(','))
        .join(' ');

      polygons.push(
        <Polygon key={`${row}-${col}`} points={points} fill={fill} />
      );
    }
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: -40,
        top: -10,
        opacity: 0.35,
        width: 360,
        height: 200,
      }}
    >
      <Svg viewBox="0 0 320 200" width={360} height={200}>
        {polygons}
      </Svg>
    </View>
  );
}
