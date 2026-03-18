'use client';

import { useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Check, Shield, Bitcoin } from 'lucide-react';

interface HeroIllustrationProps {
  className?: string;
}

// Expanded particle system — 20 particles in varied orbits
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  size: 3 + Math.random() * 5,
  radius: 100 + Math.random() * 100,
  duration: 7 + Math.random() * 10,
  delay: i * 0.4,
  color: ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#818cf8'][i % 5],
  startAngle: (i / 20) * 360,
}));

export function HeroIllustration({ className = '' }: HeroIllustrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 30, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax layers
  const coreX = useTransform(springX, [-1, 1], [-20, 20]);
  const coreY = useTransform(springY, [-1, 1], [-20, 20]);
  const ringsX = useTransform(springX, [-1, 1], [-12, 12]);
  const ringsY = useTransform(springY, [-1, 1], [-12, 12]);
  const particlesX = useTransform(springX, [-1, 1], [-30, 30]);
  const particlesY = useTransform(springY, [-1, 1], [-30, 30]);

  // 3D tilt
  const rotateX = useTransform(springY, [-1, 1], [15, -15]);
  const rotateY = useTransform(springX, [-1, 1], [-15, 15]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full aspect-square max-w-lg select-none ${className}`}
      style={{ perspective: 800 }}
      aria-hidden="true"
    >
      {/* === AMBIENT GLOW BACKGROUND === */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-500/8 blur-[80px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-60 h-60 rounded-full bg-indigo-500/8 dark:bg-indigo-400/6 blur-[60px]"
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* === ORBITING PARTICLES === */}
      <motion.div
        className="absolute inset-0"
        style={{ x: particlesX, y: particlesY, willChange: 'transform' }}
      >
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          >
            <motion.div
              className="rounded-full"
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                top: -p.radius,
                left: -p.size / 2,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}80`,
              }}
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{
                duration: p.duration / 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* === ROTATING RINGS === */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: ringsX, y: ringsY, willChange: 'transform' }}
      >
        {/* Outer ring — tilted ellipse, slow rotation */}
        <motion.svg
          viewBox="0 0 400 400"
          className="absolute w-[85%] h-[85%]"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <defs>
            <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <ellipse
            cx="200"
            cy="200"
            rx="180"
            ry="60"
            fill="none"
            stroke="url(#ringGrad1)"
            strokeWidth="1.5"
          />
          {/* Ring accent dots */}
          <circle cx="380" cy="200" r="3" fill="#60a5fa" opacity="0.8" />
          <circle cx="20" cy="200" r="2.5" fill="#3b82f6" opacity="0.6" />
        </motion.svg>

        {/* Inner ring — opposite tilt, faster */}
        <motion.svg
          viewBox="0 0 400 400"
          className="absolute w-[65%] h-[65%]"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        >
          <defs>
            <linearGradient id="ringGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <ellipse
            cx="200"
            cy="200"
            rx="170"
            ry="45"
            fill="none"
            stroke="url(#ringGrad2)"
            strokeWidth="1"
            strokeDasharray="8 4"
            transform="rotate(60 200 200)"
          />
          <circle cx="35" cy="155" r="2" fill="#818cf8" opacity="0.7" />
        </motion.svg>
      </motion.div>

      {/* === DIAMOND / OCTAHEDRON CORE === */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          x: coreX,
          y: coreY,
          rotateX,
          rotateY,
          willChange: 'transform',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Core glow */}
        <motion.div
          className="absolute w-48 h-48 rounded-full bg-blue-500/25 dark:bg-blue-500/20 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Octahedron SVG */}
        <motion.svg
          viewBox="0 0 200 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-40 h-56 relative z-10"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <defs>
            {/* Top-left face gradient */}
            <linearGradient id="faceTL" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            {/* Top-right face gradient */}
            <linearGradient id="faceTR" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            {/* Bottom-left face gradient */}
            <linearGradient id="faceBL" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            {/* Bottom-right face gradient */}
            <linearGradient id="faceBR" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            {/* Edge glow filter */}
            <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Inner light */}
            <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Inner glow circle */}
          <circle cx="100" cy="140" r="50" fill="url(#innerGlow)" />

          {/* Upper octahedron (top pyramid) */}
          {/* Top-left face */}
          <path d="M100 30 L30 140 L100 140 Z" fill="url(#faceTL)" opacity="0.9" />
          {/* Top-right face */}
          <path d="M100 30 L170 140 L100 140 Z" fill="url(#faceTR)" opacity="0.85" />

          {/* Lower octahedron (bottom pyramid) */}
          {/* Bottom-left face */}
          <path d="M100 250 L30 140 L100 140 Z" fill="url(#faceBL)" opacity="0.95" />
          {/* Bottom-right face */}
          <path d="M100 250 L170 140 L100 140 Z" fill="url(#faceBR)" opacity="0.9" />

          {/* Edge highlights */}
          <g filter="url(#edgeGlow)">
            {/* Top edges */}
            <line x1="100" y1="30" x2="30" y2="140" stroke="#93c5fd" strokeWidth="1" opacity="0.5" />
            <line x1="100" y1="30" x2="170" y2="140" stroke="#93c5fd" strokeWidth="1" opacity="0.4" />
            {/* Center horizontal */}
            <line x1="30" y1="140" x2="170" y2="140" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
            {/* Bottom edges */}
            <line x1="100" y1="250" x2="30" y2="140" stroke="#3b82f6" strokeWidth="1" opacity="0.4" />
            <line x1="100" y1="250" x2="170" y2="140" stroke="#3b82f6" strokeWidth="1" opacity="0.3" />
            {/* Center vertical */}
            <line x1="100" y1="30" x2="100" y2="250" stroke="#60a5fa" strokeWidth="0.8" opacity="0.25" />
          </g>

          {/* Specular highlight on top face */}
          <path d="M100 30 L30 140 L100 140 Z" fill="white" opacity="0.08" />

          {/* Animated energy pulse along center */}
          <motion.line
            x1="100"
            y1="30"
            x2="100"
            y2="250"
            stroke="#93c5fd"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Small diamond accents at vertices */}
          <motion.circle
            cx="100"
            cy="30"
            r="4"
            fill="#93c5fd"
            animate={{ opacity: [0.5, 1, 0.5], r: [3, 5, 3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="100"
            cy="250"
            r="3"
            fill="#3b82f6"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.circle
            cx="30"
            cy="140"
            r="3"
            fill="#60a5fa"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.circle
            cx="170"
            cy="140"
            r="3"
            fill="#60a5fa"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          />
        </motion.svg>
      </motion.div>

      {/* === FLOATING GLASS CARDS === */}

      {/* Card 1: Top-right — Contract Executed */}
      <motion.div
        className="absolute top-[10%] right-[2%] z-20 px-4 py-3 rounded-xl
          bg-white/80 dark:bg-white/10
          backdrop-blur-xl
          border border-gray-200/50 dark:border-white/15
          shadow-lg dark:shadow-none"
        initial={{ opacity: 0, x: 30, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
          y: [0, -8, 0],
        }}
        transition={{
          opacity: { duration: 0.6, delay: 0.8 },
          x: { duration: 0.6, delay: 0.8 },
          scale: { duration: 0.6, delay: 0.8 },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        }}
        style={{ willChange: 'transform' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-white/90">
              Contract Executed
            </p>
            <p className="text-[10px] text-gray-500 dark:text-white/50">
              Milestone #3 approved
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Left — Secure Vault */}
      <motion.div
        className="absolute top-[45%] left-[0%] z-20 px-4 py-3 rounded-xl
          bg-white/80 dark:bg-white/10
          backdrop-blur-xl
          border border-gray-200/50 dark:border-white/15
          shadow-lg dark:shadow-none"
        initial={{ opacity: 0, x: -30, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
          y: [0, -6, 0],
        }}
        transition={{
          opacity: { duration: 0.6, delay: 1.0 },
          x: { duration: 0.6, delay: 1.0 },
          scale: { duration: 0.6, delay: 1.0 },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
        }}
        style={{ willChange: 'transform' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-white/90">
              Secure Vault
            </p>
            <p className="text-[10px] text-gray-500 dark:text-white/50">
              2.450 BTC escrowed
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card 3: Bottom-right — Settlement Verified */}
      <motion.div
        className="absolute bottom-[12%] right-[5%] z-20 px-4 py-3 rounded-xl
          bg-white/80 dark:bg-white/10
          backdrop-blur-xl
          border border-gray-200/50 dark:border-white/15
          shadow-lg dark:shadow-none"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{
          opacity: 1,
          y: [0, -10, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.6, delay: 1.3 },
          scale: { duration: 0.6, delay: 1.3 },
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 2 },
        }}
        style={{ willChange: 'transform' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <Bitcoin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-white/90">
              Bitcoin Settlement
            </p>
            <p className="text-[10px] text-gray-500 dark:text-white/50">
              Verified on-chain
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
