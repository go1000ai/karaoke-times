"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type CardItem = {
  id: number;
  name: string;
  designation: string;
  image: string;
  content: React.ReactNode;
};

export function CardStack({
  items,
  offset,
  scaleFactor,
}: {
  items: CardItem[];
  offset?: number;
  scaleFactor?: number;
}) {
  const CARD_OFFSET = offset || 18;
  const SCALE_FACTOR = scaleFactor || 0.04;
  const [cards, setCards] = useState<CardItem[]>(items);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) => {
        const newArray = [...prev];
        newArray.unshift(newArray.pop()!);
        return newArray;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[340px] w-[320px] md:h-[380px] md:w-[420px]">
      <AnimatePresence>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="absolute w-full h-full rounded-3xl overflow-hidden cursor-pointer"
            style={{ transformOrigin: "top center" }}
            animate={{
              top: index * -CARD_OFFSET,
              scale: 1 - index * SCALE_FACTOR,
              zIndex: cards.length - index,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            drag={index === 0 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 100) {
                setCards((prev) => {
                  const newArray = [...prev];
                  newArray.unshift(newArray.pop()!);
                  return newArray;
                });
              }
            }}
          >
            {/* Card background image */}
            <div className="absolute inset-0">
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Live badge */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>

            {/* Card content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <div className="mb-3">{card.content}</div>
              <h3 className="text-2xl font-extrabold text-white mb-1">
                {card.name}
              </h3>
              <p className="text-sm text-[#00FFC2] font-semibold" style={{ textShadow: "0 0 10px rgba(0, 255, 194, 0.4)" }}>
                {card.designation}
              </p>
            </div>

            {/* Neon border glow for top card */}
            {index === 0 && (
              <div className="absolute inset-0 rounded-3xl border border-[#00FFC2]/20 pointer-events-none" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
