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
    let ctx: AudioContext | null = null;
    let rafId: number;

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      .then((stream) => {
        ctx = new AudioContext();

        // 🔴 IMPORTANT: Resume AudioContext on user interaction (Safari / prod)
        if (ctx.state === "suspended") {
          const resume = () => {
            ctx?.resume();
            document.removeEventListener("click", resume);
            document.removeEventListener("touchstart", resume);
          };
          document.addEventListener("click", resume);
          document.addEventListener("touchstart", resume);
        }

        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;

        data = new Uint8Array(analyser.frequencyBinCount);

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
      })
      .catch((err) => {
        console.error("Microphone access error:", err);
      });

    const tick = () => {
      if (!analyser || !data) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      analyser.getByteFrequencyData(data);

      // 🔊 Average volume
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;

      // Smooth volume
      volumeRef.current = THREE.MathUtils.lerp(volumeRef.current, avg, 0.05);

      // 🔥 Strength tuned for real devices
      const strength = THREE.MathUtils.clamp(
        (volumeRef.current - 20) / 45,
        0,
        1
      );

      const now = performance.now();

      /* -------------------------------
       1️⃣ STAGE-BASED KILL (kept)
    -------------------------------- */
      const stage = Math.floor(strength * TOTAL_STAGES);

      if (stage > stageRef.current && now - lastBlowTime.current > 500) {
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

      /* -------------------------------
       2️⃣ CONTINUOUS KILL (NEW 🔥)
       Prevents getting stuck forever
    -------------------------------- */
      if (strength > 0.35 && now - lastBlowTime.current > 300) {
        lastBlowTime.current = now;

        setFlames((prev) => {
          const next = [...prev];
          let kills = 0;

          for (let i = 0; i < next.length && kills < 2; i++) {
            if (next[i] > 0 && !dyingRef.current.has(i)) {
              dyingRef.current.add(i);
              kills++;
            }
          }

          return next;
        });
      }

      /* -------------------------------
       3️⃣ FADE DYING FLAMES
    -------------------------------- */
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
          onAllBlown?.();
        }

        return changed ? next : prev;
      });

      rafId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ctx?.close();
    };
  }, [onAllBlown]);

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
        Maybe I'm late but, HBD Dear 🎉
      </Text>
    </>
  );
}
