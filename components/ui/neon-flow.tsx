"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const randomColors = (count: number) => {
  return new Array(count)
    .fill(0)
    .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"));
};

interface TubesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  enableClickInteraction?: boolean;
  backgroundImage?: string;
}

export function TubesBackground({
  children,
  className,
  enableClickInteraction = true,
  backgroundImage,
}: TubesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const tubesRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    const initTubes = async () => {
      if (!canvasRef.current) return;

      try {
        const cdnUrl =
          "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
        const module = await (Function("url", "return import(url)")(cdnUrl) as Promise<any>);
        const TubesCursor = module.default;

        if (!mounted) return;

        const app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#D4A017", "#C0392B", "#1B2A4A"],
            lights: {
              intensity: 200,
              colors: ["#D4A017", "#C0392B", "#1B2A4A", "#E8C547"],
            },
          },
        });

        tubesRef.current = app;
        setIsLoaded(true);

        const handleResize = () => {};
        window.addEventListener("resize", handleResize);

        cleanup = () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (error) {
        console.error("Failed to load TubesCursor:", error);
      }
    };

    initTubes();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  const handleClick = () => {
    if (!enableClickInteraction || !tubesRef.current) return;

    const colors = randomColors(3);
    const lightsColors = randomColors(4);

    tubesRef.current.tubes.setColors(colors);
    tubesRef.current.tubes.setLightsColors(lightsColors);
  };

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[400px] overflow-hidden bg-bg-dark",
        className
      )}
      onClick={handleClick}
    >
      {/* Background image with parallax */}
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
              filter: "brightness(0.2) saturate(0.6)",
            }}
          />
          <div className="absolute inset-0 bg-bg-dark/40" />
        </>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{
          touchAction: "none",
          mixBlendMode: backgroundImage ? "screen" : "normal",
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export default TubesBackground;
