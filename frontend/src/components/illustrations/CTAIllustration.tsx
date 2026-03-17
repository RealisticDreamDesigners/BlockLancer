'use client';

interface CTAIllustrationProps {
  className?: string;
}

export function CTAIllustration({ className = '-' }: CTAIllustrationProps) {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cta-arrow" x1="150" y1="250" x2="150" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="cta-trail" x1="150" y1="280" x2="150" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Trail behind rocket */}
      <path d="M140 280 L150 170 L160 280 Z" fill="url(#cta-trail)">
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
      </path>

      {/* Rocket/arrow body */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-8;0,0" dur="3s" repeatCount="indefinite" />

        {/* Main arrow shape */}
        <path
          d="M150 70 L175 130 L160 125 L160 190 L140 190 L140 125 L125 130 Z"
          fill="url(#cta-arrow)"
          stroke="white"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Arrow detail lines */}
        <line x1="150" y1="90" x2="150" y2="120" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      </g>

      {/* Floating particles - upward motion */}
      {/* Particle 1 */}
      <circle cx="120" cy="250" r="3" fill="white" fillOpacity="0.4">
        <animate attributeName="cy" values="250;100" dur="4s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.4;0" dur="4s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;1" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Particle 2 */}
      <circle cx="180" cy="260" r="2.5" fill="white" fillOpacity="0.35">
        <animate attributeName="cy" values="260;80" dur="5s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.35;0" dur="5s" repeatCount="indefinite" />
        <animate attributeName="r" values="2.5;0.5" dur="5s" repeatCount="indefinite" />
      </circle>

      {/* Particle 3 */}
      <circle cx="140" cy="240" r="2" fill="white" fillOpacity="0.3">
        <animate attributeName="cy" values="240;90" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.3;0" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="2;0.5" dur="3.5s" repeatCount="indefinite" />
      </circle>

      {/* Particle 4 */}
      <circle cx="165" cy="230" r="2" fill="white" fillOpacity="0.25">
        <animate attributeName="cy" values="230;70" dur="4.5s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.25;0" dur="4.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="2;0.3" dur="4.5s" repeatCount="indefinite" />
      </circle>

      {/* Particle 5 */}
      <circle cx="130" cy="270" r="1.5" fill="white" fillOpacity="0.3">
        <animate attributeName="cy" values="270;110" dur="3.8s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.3;0" dur="3.8s" repeatCount="indefinite" />
      </circle>

      {/* Particle 6 */}
      <circle cx="175" cy="245" r="2.5" fill="white" fillOpacity="0.2">
        <animate attributeName="cy" values="245;95" dur="5.5s" repeatCount="indefinite" />
        <animate attributeName="fillOpacity" values="0.2;0" dur="5.5s" repeatCount="indefinite" />
      </circle>

      {/* Sparkle stars */}
      <g opacity="0.5">
        {/* Star 1 */}
        <path d="M100 120 L102 115 L104 120 L102 125 Z" fill="white">
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
        </path>
        {/* Star 2 */}
        <path d="M200 100 L202 95 L204 100 L202 105 Z" fill="white">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.5s" repeatCount="indefinite" />
        </path>
        {/* Star 3 */}
        <path d="M90 180 L92 175 L94 180 L92 185 Z" fill="white">
          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
        </path>
        {/* Star 4 */}
        <path d="M210 160 L212 155 L214 160 L212 165 Z" fill="white">
          <animate attributeName="opacity" values="0;0.4;0" dur="2.8s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}
