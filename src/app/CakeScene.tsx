"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { Flame } from "./Flame";

type Props = {
  age: number;
  onAllBlown?: () => void;
};

const TOTAL_STAGES = 8;
const MIN_PERCENT = 0.1;
const MAX_PERCENT = 0.15;
const FADE_SPEED = 0.01;

export default function CakeScene({ age, onAllBlown }: Props) {
  const [flames, setFlames] = useState<number[]>(Array(age).fill(1));

  const volumeRef = useRef(0);
  const stageRef = useRef(0);
  const lastBlowTime = useRef(0);

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

      volumeRef.current = THREE.MathUtils.lerp(volumeRef.current, avg, 0.04);

      const strength = THREE.MathUtils.clamp(
        (volumeRef.current - 30) / 60,
        0,
        1
      );

      const now = performance.now();

      const stage = Math.floor(strength * TOTAL_STAGES);

      if (stage > stageRef.current && now - lastBlowTime.current > 600) {
        const previousStage = stageRef.current;
        stageRef.current = stage;
        lastBlowTime.current = now;

        setFlames((prev) => {
          const next = [...prev];

          const percentPerStage =
            MIN_PERCENT + Math.random() * (MAX_PERCENT - MIN_PERCENT);

          const candlesPerStage = Math.max(
            1,
            Math.floor(next.length * percentPerStage)
          );

          let toKill = candlesPerStage * (stage - previousStage);

          for (let i = 0; i < next.length && toKill > 0; i++) {
            if (next[i] > 0 && !dyingRef.current.has(i)) {
              dyingRef.current.add(i);
              toKill--;
            }
          }

          return next;
        });
      }

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

        // todo:
        // add surface
        // add modal with set timeout
        // and after the conffeti add
        // text below the cake to glow
        //deploy - vercel

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

      {/* text below*/}
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
