"use client"; // ⚠️ Important: this tells Next.js this component is client-side

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import CakeScene from "./CakeScene";
import Confetti from 'react-confetti';


export default function Home() {
  const [age, setAge] = useState<number | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [allBlown, setAllBlown] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Only show Canvas after mount
  useEffect(() => {
    const input = prompt("🎂 Enter your age");
    const num = Number(input);
    if (num > 0 && num < 100) setAge(num);

    setShowCanvas(true); // now safe to render Canvas
  }, []);

  if (!age)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>
    );

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {showCanvas && (
        <>
          <Canvas camera={{ position: [0, 4, 8], fov: 85 }} gl={{ toneMappingExposure: 1 }}
  shadows>
            {/* Very low ambient */}
            <ambientLight intensity={0.15} />

            {/* Warm key light (like candle glow) */}
            <pointLight position={[0, 4, 4]} intensity={2} color="#ffcc88" />

            {/* Soft fill from above */}
            <spotLight
              position={[0, 6, 0]}
              angle={0.5}
              penumbra={0.6}
              intensity={1}
              color="#ffd9a0"
            />

            {/* Subtle rim light */}
            <directionalLight
              position={[-5, 3, -5]}
              intensity={0.3}
              color="#ffffff"
            />

            <directionalLight position={[5, 5, 5]} intensity={1} />
            {/* <Environment preset="sunset" /> */}
            <CakeScene age={age} onAllBlown={() => setAllBlown(true)} />
            <OrbitControls enableZoom={false} />
          </Canvas>

          {allBlown && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={400}
              gravity={0.2}
              initialVelocityX={{ min: -10, max: 10 }}
              initialVelocityY={{ min: -10, max: 10 }}
            />
          )}
        </>
      )}
    </div>
  );
}
