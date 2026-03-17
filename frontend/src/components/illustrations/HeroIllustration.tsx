'use client';

import { useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Check, DollarSign } from 'lucide-react';

interface HeroIllustrationProps {
  className?: string;
}

// Particle config for orbiting circles
const PARTICLES = [
  { size: 6, radius: 160, duration: 10, delay: 0, color: '#3b82f6' },
  { size: 5, radius: 140, duration: 12, delay: 1.5, color: '#60a5fa' },
  { size: 4, radius: 170, duration: 8, delay: 3, color: '#2563eb' },
  { size: 7, radius: 130, duration: 14, delay: 0.8, color: '#60a5fa' },
  { size: 3, radius: 180, duration: 9, delay: 4.2, color: '#3b82f6' },
  { size: 5, radius: 150, duration: 11, delay: 2.5, color: '#93c5fd' },
  { size: 4, radius: 120, duration: 15, delay: 5, color: '#2563eb' },
  { size: 6, radius: 165, duration: 13, delay: 1, color: '#60a5fa' },
  { size: 3, radius: 145, duration: 10, delay: 3.8, color: '#3b82f6' },
  { size: 5, radius: 175, duration: 9.5, delay: 6, color: '#93c5fd' },
];

export function HeroIllustration({ className = '-' }: HeroIllustrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for parallax
  const springConfig = { stiffness: 100, damping: 30, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax layers: shield ±20px, desk ±10px, particles ±30px
  const shieldX = useTransform(springX, [-1, 1], [-20, 20]);
  const shieldY = useTransform(springY, [-1, 1], [-20, 20]);
  const deskX = useTransform(springX, [-1, 1], [-10, 10]);
  const deskY = useTransform(springY, [-1, 1], [-10, 10]);
  const particlesX = useTransform(springX, [-1, 1], [-30, 30]);
  const particlesY = useTransform(springY, [-1, 1], [-30, 30]);

  // Shield tilt for 3D effect
  const rotateX = useTransform(springY, [-1, 1], [12, -12]);
  const rotateY = useTransform(springX, [-1, 1], [-12, 12]);

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
      {/* === WORKSPACE LAYER (behind shield, lower parallax) === */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: deskX, y: deskY, willChange: 'transform' }}
      >
        <svg
          viewBox="0 0 300 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[70%] mt-20 opacity-60"
        >
          {/* Desk surface */}
          <rect
            x="30"
            y="100"
            width="240"
            height="12"
            rx="3"
            className="fill-gray-200 dark:fill-gray-700"
          />
          {/* Desk legs */}
          <rect x="50" y="112" width="8" height="50" rx="2" className="fill-gray-300 dark:fill-gray-600" />
          <rect x="242" y="112" width="8" height="50" rx="2" className="fill-gray-300 dark:fill-gray-600" />

          {/* Laptop base */}
          <rect x="90" y="72" width="100" height="28" rx="3" className="fill-gray-300 dark:fill-gray-600" />
          {/* Laptop screen */}
          <rect x="95" y="30" width="90" height="42" rx="2" className="fill-gray-700 dark:fill-gray-800" />
          {/* Screen glow */}
          <rect x="99" y="34" width="82" height="34" rx="1" className="fill-blue-400/20 dark:fill-blue-500/15" />
          {/* Screen content lines */}
          <rect x="105" y="40" width="40" height="2" rx="1" className="fill-blue-400/40 dark:fill-blue-400/30" />
          <rect x="105" y="46" width="55" height="2" rx="1" className="fill-blue-400/30 dark:fill-blue-400/20" />
          <rect x="105" y="52" width="30" height="2" rx="1" className="fill-green-400/40 dark:fill-green-400/30" />
          <rect x="105" y="58" width="45" height="2" rx="1" className="fill-blue-400/25 dark:fill-blue-400/15" />

          {/* Coffee cup */}
          <rect x="210" y="82" width="18" height="18" rx="3" className="fill-gray-400 dark:fill-gray-500" />
          <rect x="212" y="85" width="14" height="10" rx="2" className="fill-amber-800/60 dark:fill-amber-700/40" />
          {/* Steam */}
          <path d="M217 80 Q219 75 217 70" className="stroke-gray-400/40 dark:stroke-gray-500/30" strokeWidth="1.5" fill="none" />
          <path d="M222 82 Q224 76 222 71" className="stroke-gray-400/30 dark:stroke-gray-500/20" strokeWidth="1" fill="none" />

          {/* Small plant */}
          <rect x="60" y="86" width="14" height="14" rx="2" className="fill-blue-200 dark:fill-blue-900/40" />
          <ellipse cx="67" cy="82" rx="8" ry="6" className="fill-green-500/50 dark:fill-green-600/40" />
          <ellipse cx="64" cy="80" rx="5" ry="4" className="fill-green-600/40 dark:fill-green-500/30" />
        </svg>
      </motion.div>

      {/* === ORBITING PARTICLES LAYER === */}
      <motion.div
        className="absolute inset-0"
        style={{ x: particlesX, y: particlesY, willChange: 'transform' }}
      >
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              top: '50%',
              left: '50%',
              marginTop: -p.size / 2,
              marginLeft: -p.size / 2,
              filter: p.radius > 160 ? 'blur(1px)' : 'none',
              boxShadow: `0 0 ${p.size * 2}px ${p.color}60`,
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
            // Use a wrapper to set the orbit radius
          >
            <motion.div
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
                top: -p.radius,
                left: -p.size / 2 + p.size / 2,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}60`,
                filter: p.radius > 160 ? 'blur(1px)' : 'none',
              }}
              animate={{
                opacity: [0.4, 0.9, 0.4],
              }}
              transition={{
                duration: p.duration / 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* === BLOCKCHAIN BLOCK LAYER (main, 3D tilt) === */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          x: shieldX,
          y: shieldY,
          rotateX,
          rotateY,
          willChange: 'transform',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Block glow pulse */}
        <motion.div
          className="absolute w-56 h-56 rounded-full bg-blue-500/20 dark:bg-blue-500/15 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Blockchain Block SVG */}
        <motion.svg
          viewBox="0 0 200 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-44 h-52 relative z-10 drop-shadow-2xl"
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <defs>
            <filter id="heroBlockGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#heroBlockGlow)">
            {/* Isometric block - top face */}
            <path d="M100 30 L175 70 L100 110 L25 70 Z" fill="#60a5fa" />
            {/* Isometric block - left face */}
            <path d="M25 70 L100 110 V195 L25 155 Z" fill="#2563eb" />
            {/* Isometric block - right face */}
            <path d="M175 70 L100 110 V195 L175 155 Z" fill="#1d4ed8" />
            {/* Chain detail on right face */}
            <rect x="125" y="125" width="22" height="15" rx="3" fill="white" fillOpacity="0.15" />
            <rect x="125" y="148" width="22" height="15" rx="3" fill="white" fillOpacity="0.1" />
            {/* Top face highlight edge */}
            <path d="M100 30 L175 70 L100 110 L25 70 Z" fill="none" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Chain link animation */}
          <motion.path
            d="M100 195 V215 M90 210 L100 220 L110 210"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{
              pathLength: { duration: 1.2, delay: 0.5, ease: 'easeInOut' },
              opacity: { duration: 0.3, delay: 0.5 },
            }}
          />
        </motion.svg>
      </motion.div>

      {/* === FLOATING GLASS CARDS === */}

      {/* Card 1: Top-right — Milestone Approved */}
      <motion.div
        className="absolute top-[12%] right-[2%] z-20 px-4 py-3 rounded-xl
          bg-white/80 dark:bg-white/10
          backdrop-blur-xl
          border border-gray-200/50 dark:border-white/15
          shadow-lg dark:shadow-none"
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -8, 0],
        }}
        transition={{
          opacity: { duration: 0.6, delay: 0.8 },
          x: { duration: 0.6, delay: 0.8 },
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
              Milestone Approved
            </p>
            <p className="text-[10px] text-gray-500 dark:text-white/50">
              Frontend delivery
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Bottom-left — Payment Released */}
      <motion.div
        className="absolute bottom-[18%] left-[0%] z-20 px-4 py-3 rounded-xl
          bg-white/80 dark:bg-white/10
          backdrop-blur-xl
          border border-gray-200/50 dark:border-white/15
          shadow-lg dark:shadow-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -6, 0],
        }}
        transition={{
          opacity: { duration: 0.6, delay: 1.1 },
          x: { duration: 0.6, delay: 1.1 },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
        }}
        style={{ willChange: 'transform' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-white/90">
              $2,500 Released
            </p>
            <p className="text-[10px] text-gray-500 dark:text-white/50">
              Payment confirmed
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
