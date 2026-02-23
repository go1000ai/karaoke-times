"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface GalleryItem {
  title: string;
  subtitle: string;
  /** Image URL — used as poster/fallback */
  image?: string;
  /** Video URL — if provided, renders a muted auto-playing video */
  video?: string;
  imagePosition?: string;
  label?: string;
}

interface CircularGalleryProps {
  items: GalleryItem[];
  autoRotateSpeed?: number;
}

export default function CircularGallery({
  items,
  autoRotateSpeed = 0.15,
}: CircularGalleryProps) {
  const [rotation, setRotation] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const directionLocked = useRef<"horizontal" | "vertical" | null>(null);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile for responsive radius/sizing
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Responsive sizing
  const radius = isMobile ? 250 : 500;
  const cardW = isMobile ? 120 : 260;
  const cardH = isMobile ? 170 : 380;

  // Auto-rotate + momentum when not dragging (reads ref — no re-renders needed)
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 32);
      lastTime = now;

      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.01) {
          setRotation((prev) => prev + velocityRef.current * dt);
          velocityRef.current *= 0.96;
        } else {
          velocityRef.current = 0;
          setRotation((prev) => prev + autoRotateSpeed);
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [autoRotateSpeed]);

  // Pointer drag — ref tracks whether a touch is active (no re-renders)
  const pointerActiveRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    directionLocked.current = null;
    velocityRef.current = 0;
    pointerActiveRef.current = true;
    // On desktop, commit to dragging immediately
    if (!isMobile) isDraggingRef.current = true;
  }, [isMobile]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerActiveRef.current) return;

      // On mobile: determine direction before committing to drag
      if (isMobile && !directionLocked.current) {
        const dx = Math.abs(e.clientX - startXRef.current);
        const dy = Math.abs(e.clientY - startYRef.current);
        if (dx < 8 && dy < 8) return; // not enough movement yet
        directionLocked.current = dx > dy ? "horizontal" : "vertical";
        if (directionLocked.current === "horizontal") {
          isDraggingRef.current = true;
          containerRef.current?.setPointerCapture(e.pointerId);
        }
      }

      // If vertical (or undecided), let the browser handle scroll — no interference
      if (directionLocked.current !== "horizontal" && isMobile) return;

      e.preventDefault();

      const deltaX = e.clientX - lastXRef.current;
      const sensitivity = isMobile ? 0.4 : 0.3;
      velocityRef.current = deltaX * sensitivity * 0.06;
      setRotation((prev) => prev + deltaX * sensitivity);
      lastXRef.current = e.clientX;
    },
    [isMobile]
  );

  const handlePointerUp = useCallback(() => {
    directionLocked.current = null;
    pointerActiveRef.current = false;
    isDraggingRef.current = false;
  }, []);

  const anglePerItem = 360 / items.length;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[480px] flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ perspective: isMobile ? "900px" : "1800px", touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="relative w-full h-full"
        style={{
          transform: `rotateY(${rotation}deg)`,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {items.map((item, i) => {
          const itemAngle = i * anglePerItem;
          const totalRotation = ((rotation % 360) + 360) % 360;
          const relativeAngle = (itemAngle + totalRotation) % 360;
          const normalizedAngle = Math.abs(
            relativeAngle > 180 ? 360 - relativeAngle : relativeAngle
          );
          // On mobile: only the single front card is visible (within ~20° of center)
          // This prevents any overlap since only 1 card shows at a time
          const opacity = isMobile
            ? normalizedAngle > 20 ? 0 : Math.max(0, 1 - normalizedAngle / 18)
            : Math.max(0.1, 1 - normalizedAngle / 160);
          const scale = isMobile
            ? Math.max(0.55, 1 - normalizedAngle / 400)
            : Math.max(0.65, 1 - normalizedAngle / 500);
          // Only load video for cards near the front (within ~100°)
          const isFrontFacing = normalizedAngle < 100;
          // Skip rendering hidden cards on mobile for performance
          const shouldRender = !isMobile || normalizedAngle <= 25;

          if (!shouldRender) return null;

          return (
            <div
              key={item.video || item.image || i}
              className="absolute"
              style={{
                width: cardW,
                height: cardH,
                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px) scale(${scale})`,
                left: "50%",
                top: "50%",
                marginLeft: -(cardW / 2),
                marginTop: -(cardH / 2),
                opacity,
                backfaceVisibility: "hidden",
                willChange: "transform, opacity",
                transition: isMobile ? "opacity 0.3s ease" : undefined,
              }}
            >
              <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                {/* Video — only loads when card faces front */}
                {item.video && isFrontFacing ? (
                  <video
                    src={item.video}
                    poster={item.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                ) : item.video && item.image ? (
                  // Show poster thumbnail for videos in the back
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                    loading="lazy"
                  />
                ) : item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: item.imagePosition || "center" }}
                    draggable={false}
                    loading="lazy"
                  />
                ) : null}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                {/* Video play indicator */}
                {item.video && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-600/90 text-white text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 pointer-events-none">
                    <span className="material-icons-round text-[9px] sm:text-[10px]">play_arrow</span>
                    LIVE
                  </div>
                )}

                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 w-full p-2.5 sm:p-4 text-white pointer-events-none">
                  {item.label && (
                    <span className="inline-block bg-primary/90 text-black text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full mb-1 sm:mb-1.5">
                      {item.label}
                    </span>
                  )}
                  <h3 className="text-[11px] sm:text-base font-bold leading-tight drop-shadow-lg">
                    {item.title}
                  </h3>
                  <p className="text-[9px] sm:text-[11px] text-white/70 mt-0.5 drop-shadow">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
