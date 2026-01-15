import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function Flame({ intensity }: { intensity: number }) {
  const flameRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Flicker scale animation (0.85 to 1.15)
    const scale = 0.9 + 0.2 * Math.sin(time * 12 + Math.random() * 10);
    flameRef.current.scale.setScalar(intensity * scale);

    // Flicker light intensity (around intensity * 2)
    lightRef.current.intensity = 1.5 + 0.5 * Math.sin(time * 20 + Math.random() * 10);
  });

  return (
    <group>
      {/* Flame mesh */}
      <mesh ref={flameRef} position={[0, 0.77, 0]}>
        <coneGeometry args={[0.1, 0.3, 16, 1, true]} />
        <meshBasicMaterial
          color="orange"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Light to glow */}
      <pointLight
        ref={lightRef}
        position={[0, 0.8, 0]}
        color="orange"
        intensity={2}
        distance={1.5}
        decay={2}
      />
    </group>
  );
}
