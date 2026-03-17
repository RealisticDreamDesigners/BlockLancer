'use client';

interface FeaturesIllustrationProps {
  className?: string;
}

export function FeaturesIllustration({ className = '-' }: FeaturesIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="feat-shield" x1="200" y1="100" x2="200" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <radialGradient id="feat-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <filter id="feat-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx="200" cy="200" r="160" fill="url(#feat-glow)">
        <animate attributeName="r" values="160;170;160" dur="5s" repeatCount="indefinite" />
      </circle>

      {/* Orbit ring */}
      <ellipse cx="200" cy="200" rx="140" ry="140" stroke="#2563eb" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="4 8">
        <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="8s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="200" cy="200" rx="110" ry="110" stroke="#60a5fa" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="3 9">
        <animate attributeName="stroke-dashoffset" from="0" to="24" dur="10s" repeatCount="indefinite" />
      </ellipse>

      {/* Central shield */}
      <g filter="url(#feat-blur)">
        <path
          d="M200 120 L250 145 L250 210 C250 245 225 270 200 280 C175 270 150 245 150 210 L150 145 Z"
          fill="url(#feat-shield)"
          stroke="#60a5fa"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        {/* Lock icon inside shield */}
        <rect x="188" y="185" width="24" height="20" rx="3" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
        <path d="M193 185 L193 175 C193 170 197 166 200 166 C203 166 207 170 207 175 L207 185" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
        <circle cx="200" cy="197" r="2.5" fill="white" fillOpacity="0.9" />
      </g>

      {/* Orbiting badges */}
      {/* Badge 1 - Bitcoin (top) */}
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="30s" repeatCount="indefinite" />
        <circle cx="200" cy="60" r="22" fill="#1e293b" stroke="#2563eb" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="200" y="66" textAnchor="middle" fill="#3b82f6" fontSize="16" fontWeight="700" fontFamily="system-ui">B</text>
        <circle cx="200" cy="60" r="22" fill="none" stroke="#2563eb" strokeOpacity="0.2" strokeWidth="1">
          <animate attributeName="r" values="22;25;22" dur="3s" repeatCount="indefinite" />
          <animate attributeName="strokeOpacity" values="0.2;0.05;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Badge 2 - Speed (right) */}
      <g>
        <animateTransform attributeName="transform" type="rotate" from="120 200 200" to="480 200 200" dur="30s" repeatCount="indefinite" />
        <circle cx="200" cy="60" r="20" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M196 52 L192 62 L198 62 L194 72" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Badge 3 - Users (bottom-left) */}
      <g>
        <animateTransform attributeName="transform" type="rotate" from="240 200 200" to="600 200 200" dur="30s" repeatCount="indefinite" />
        <circle cx="200" cy="60" r="20" fill="#1e293b" stroke="#93c5fd" strokeWidth="1.5" strokeOpacity="0.5" />
        <circle cx="200" cy="55" r="4" fill="none" stroke="#93c5fd" strokeWidth="1.5" />
        <path d="M192 68 C192 63 196 60 200 60 C204 60 208 63 208 68" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Sparkle particles */}
      <circle cx="130" cy="120" r="2" fill="#2563eb" fillOpacity="0.25">
        <animate attributeName="fillOpacity" values="0.25;0.05;0.25" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="280" cy="100" r="1.5" fill="#60a5fa" fillOpacity="0.2">
        <animate attributeName="fillOpacity" values="0.2;0.04;0.2" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="120" cy="280" r="1.5" fill="#60a5fa" fillOpacity="0.15">
        <animate attributeName="fillOpacity" values="0.15;0.03;0.15" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="290" r="2" fill="#2563eb" fillOpacity="0.2">
        <animate attributeName="fillOpacity" values="0.2;0.05;0.2" dur="4.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="200" r="1" fill="#3b82f6" fillOpacity="0.2">
        <animate attributeName="fillOpacity" values="0.2;0.04;0.2" dur="6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
