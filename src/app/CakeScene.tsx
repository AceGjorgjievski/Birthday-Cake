"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { Flame } from "./Flame";

type Props = {
  age: number;
  onAllBlown?: () => void;
};

// 🔧 CONFIG (easy to tweak)
const TOTAL_STAGES = 8; // 7–9 feels best
const MIN_PERCENT = 0.1; // 10%
const MAX_PERCENT = 0.15; // 15%
const FADE_SPEED = 0.01; // flame dying speed

export default function CakeScene({ age, onAllBlown }: Props) {
  const [flames, setFlames] = useState<number[]>(Array(age).fill(1));

  const volumeRef = useRef(0);
  const stageRef = useRef(0);
  const lastBlowTime = useRef(0);

  // Candles that are currently fading out
  const dyingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let analyser: AnalyserNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const ctx = new AudioContext();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      data = new Uint8Array(analyser.frequencyBinCount);
      ctx.createMediaStreamSource(stream).connect(analyser);
    });

    const tick = () => {
      if (!analyser || !data) {
        requestAnimationFrame(tick);
        return;
      }

      analyser.getByteFrequencyData(data);

      const avg = data.reduce((a, b) => a + b, 0) / data.length;

      // Smooth mic input (real-life delay)
      volumeRef.current = THREE.MathUtils.lerp(volumeRef.current, avg, 0.04);

      // Normalize blow strength (0 → 1)
      const strength = THREE.MathUtils.clamp(
        (volumeRef.current - 30) / 60,
        0,
        1
      );

      const now = performance.now();

      // Determine current stage based on strength
      const stage = Math.floor(strength * TOTAL_STAGES);

      // Trigger only when stage increases + delay
      if (stage > stageRef.current && now - lastBlowTime.current > 600) {
        const previousStage = stageRef.current;
        stageRef.current = stage;
        lastBlowTime.current = now;

        setFlames((prev) => {
          const next = [...prev];

          // Randomize % per stage slightly (10–15%)
          const percentPerStage =
            MIN_PERCENT + Math.random() * (MAX_PERCENT - MIN_PERCENT);

          const candlesPerStage = Math.max(
            1,
            Math.floor(next.length * percentPerStage)
          );

          // How many candles to extinguish THIS stage
          let toKill = candlesPerStage * (stage - previousStage);

          for (let i = 0; i < next.length && toKill > 0; i++) {
            if (next[i] > 0 && !dyingRef.current.has(i)) {
              dyingRef.current.add(i); // 🔥 mark candle as dying
              toKill--;
            }
          }

          return next;
        });
      }

      // Slowly fade dying candles every frame
      setFlames((prev) => {
        let changed = false;

        const next = prev.map((f, i) => {
          if (dyingRef.current.has(i) && f > 0) {
            changed = true;
            return Math.max(0, f - FADE_SPEED);
          }
          return f;
        });

        if (changed && next.every((f) => f === 0)) {
          if (onAllBlown) onAllBlown();
        }

        return changed ? next : prev;
      });

      requestAnimationFrame(tick);
    };

    tick();
  }, []);

  return (
    <>
      {/* Cake */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[3, 3, 1.5, 55]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>

      {/* Candles */}
      {flames.map((intensity, i) => {
        const angle = (i / age) * Math.PI * 2;
        const radius = 2.2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <group key={i} position={[x, 0, z]}>
            <mesh>
              <cylinderGeometry args={[0.12, 0.12, 1.3]} />
              <meshStandardMaterial
                color="#c62828"
                roughness={0.4}
                metalness={0.1}
              />
            </mesh>

            {intensity > 0 && <Flame intensity={intensity} />}
          </group>
        );
      })}

      {/* 3D Text */}
      <Text
        position={[0, -2.8, 0]}
        fontSize={0.6}
        color="#ff6f91"
        anchorX="center"
        anchorY="middle"
      >
        Happy Bday Girls🎉
      </Text>
    </>
  );
}
