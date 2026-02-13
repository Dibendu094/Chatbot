"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceOrbProps {
  status: 'listening' | 'thinking' | 'speaking' | 'idle';
  audioLevel?: number;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ status, audioLevel = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Status colors
  const colors = {
    idle: 'rgba(124, 58, 237, 0.5)',     // Purple
    listening: 'rgba(59, 130, 246, 0.6)', // Blue
    thinking: 'rgba(168, 85, 247, 0.6)',  // Light Purple
    speaking: 'rgba(34, 197, 94, 0.6)',   // Green
  };

  const currentColor = colors[status];

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[400px]">
      {/* Background Animated Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{ backgroundColor: currentColor }}
      />

      {/* The Main Orb */}
      <motion.div
        animate={{
          scale: status === 'listening' ? 1 + audioLevel * 0.5 : 1,
          boxShadow: status === 'listening' 
            ? `0 0 ${40 + audioLevel * 100}px ${currentColor}`
            : `0 0 40px ${currentColor}`
        }}
        className="relative w-48 h-48 rounded-full bg-white dark:bg-slate-100 flex items-center justify-center z-20 shadow-2xl"
        style={{
          border: `8px solid ${status === 'idle' ? 'rgba(255,255,255,0.1)' : currentColor}`
        }}
      >
        {/* Inner pulsating circle for thinking/speaking */}
        <AnimatePresence>
          {(status === 'speaking' || status === 'thinking') && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.1, 0.8],
                opacity: 0.8
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: status === 'thinking' ? 1.5 : 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </AnimatePresence>

        {/* Neural lines or particles could be added here */}
        <div className="z-30 text-slate-800 font-bold text-2xl">
            {status === 'listening' && "•"}
        </div>
      </motion.div>

      {/* Ambient Neural Waves */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
      </div>
    </div>
  );
};

export default VoiceOrb;
