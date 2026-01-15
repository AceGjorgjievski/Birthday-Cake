"use client";
import { useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CakeScene from "./CakeScene";
import Confetti from "react-confetti";

export default function Home() {
  const [age, setAge] = useState<number | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [allBlown, setAllBlown] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [currentSong, setCurrentSong] = useState<
    "birthday" | "congratulations" | null
  >(null);

  const birthdayAudioRef = useRef<HTMLAudioElement | null>(null);
  const congratsAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setShowCanvas(true);
    }, 0);
  }, []);

  const playCongratulationsSong = () => {
    if (birthdayAudioRef.current) {
      birthdayAudioRef.current.pause();
      birthdayAudioRef.current.currentTime = 0;
    }

    if (congratsAudioRef.current) {
      congratsAudioRef.current.currentTime = 0;
      congratsAudioRef.current
        .play()
        .then(() => {
          setCurrentSong("congratulations");
          console.log("Congratulations song started");
        })
        .catch((e) => {
          console.log("Error playing congratulations song:", e);
          document.addEventListener(
            "click",
            () => {
              congratsAudioRef.current?.play().catch(console.error);
            },
            { once: true }
          );
        });
    }
  };

  const handleAgeInput = () => {
    const input = prompt("🎂 Enter your age");
    const num = Number(input);
    if (num > 0 && num < 100) {
      setAge(num);

      birthdayAudioRef.current = new Audio("/songs/happy-birthday.mp3");
      birthdayAudioRef.current.volume = 0.6;
      birthdayAudioRef.current.preload = "auto";

      congratsAudioRef.current = new Audio("/songs/congratulations.mp3");
      congratsAudioRef.current.volume = 0.5;
      congratsAudioRef.current.preload = "auto";

      birthdayAudioRef.current
        .play()
        .then(() => {
          setCurrentSong("birthday");
          console.log("Birthday song started");
        })
        .catch((e) => {
          console.log("Autoplay blocked, waiting for interaction");
          const startOnClick = () => {
            birthdayAudioRef.current
              ?.play()
              .then(() => setCurrentSong("birthday"))
              .catch(console.error);
          };
          document.addEventListener("click", startOnClick, { once: true });
        });

      birthdayAudioRef.current.addEventListener("ended", () => {
        console.log("Birthday song ended");
        if (!allBlown) {
          playCongratulationsSong();
        }
      });
    }
  };

  useEffect(() => {
    if (allBlown) {
      console.log("Candles blown, switching to congratulations song");
      playCongratulationsSong();
    }
  }, [allBlown]);

  useEffect(() => {
    return () => {
      birthdayAudioRef.current?.pause();
      congratsAudioRef.current?.pause();
    };
  }, []);

  if (!age)
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleAgeInput}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            background: "linear-gradient(135deg, #1d9bf0 0%, #0f4c75 100%)",
            color: "white",
            border: "none",
            borderRadius: "50px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          }}
        >
          🎂 Enter Your Age
        </button>
      </div>
    );

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #1d9bf0 0%, #0f4c75 100%)",
        position: "relative",
      }}
    >
      {showCanvas && (
        <>
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "10px 15px",
              borderRadius: "10px",
              zIndex: 1000,
              fontSize: "14px",
            }}
          >
            {currentSong === "birthday" && "🎵 Playing: Happy Birthday"}
            {currentSong === "congratulations" &&
              "🎉 Playing: Congratulations!"}
          </div>

          <Canvas
            camera={{ position: [0, 4, 8], fov: 85 }}
            gl={{ toneMappingExposure: 1 }}
            shadows
          >
            <ambientLight intensity={0.15} />
            <pointLight position={[0, 4, 4]} intensity={2} color="#ffcc88" />
            <spotLight
              position={[0, 6, 0]}
              angle={0.5}
              penumbra={0.6}
              intensity={1}
              color="#ffd9a0"
            />
            <directionalLight
              position={[-5, 3, -5]}
              intensity={0.3}
              color="#ffffff"
            />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <CakeScene age={age} onAllBlown={() => setAllBlown(true)} />
            <OrbitControls enableZoom={false} />
          </Canvas>

          {!allBlown && (
            <div
              style={{
                position: "fixed",
                bottom: "20px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: "999px",
                  fontSize: "15px",
                  fontWeight: 500,
                  letterSpacing: "0.5px",
                  textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(6px)",
                }}
              >
                🎤 Make a wish before you blow :)
              </div>
            </div>
          )}

          {allBlown && (
            <>
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={400}
                gravity={0.2}
                initialVelocityX={{ min: -10, max: 10 }}
                initialVelocityY={{ min: -10, max: 10 }}
              />

              <div
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(255, 107, 107, 0.9)",
                  color: "white",
                  padding: "30px 40px",
                  borderRadius: "20px",
                  textAlign: "center",
                  fontSize: "28px",
                  fontWeight: "bold",
                  zIndex: 1000,
                  animation: "popIn 0.5s ease-out",
                }}
              >
                🎉 WISH GRANTED! 🎉
              </div>
            </>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
