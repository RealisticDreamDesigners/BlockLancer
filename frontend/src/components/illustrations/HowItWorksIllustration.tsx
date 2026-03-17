'use client';

interface HowItWorksIllustrationProps {
  className?: string;
}

export function HowItWorksIllustration({ className = '-' }: HowItWorksIllustrationProps) {
  return (
    <svg
      viewBox="0 0 480 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hiw-node1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="hiw-node2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="hiw-node3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </linearGradient>
        <filter id="hiw-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <ellipse cx="240" cy="160" rx="200" ry="120" fill="#2563eb" fillOpacity="0.04">
        <animate attributeName="rx" values="200;210;200" dur="5s" repeatCount="indefinite" />
      </ellipse>

      {/* Connection lines */}
      <line x1="140" y1="160" x2="215" y2="160" stroke="#2563eb" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="265" y1="160" x2="340" y2="160" stroke="#2563eb" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
      </line>

      {/* Arrow heads */}
      <polygon points="213,155 220,160 213,165" fill="#2563eb" fillOpacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </polygon>
      <polygon points="338,155 345,160 338,165" fill="#2563eb" fillOpacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </polygon>

      {/* Node 1: Create Escrow */}
      <g filter="url(#hiw-glow)">
        <rect x="40" y="120" width="100" height="80" rx="16" fill="url(#hiw-node1)" />
        <rect x="40" y="120" width="100" height="80" rx="16" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.4" fill="none" />
        {/* Document icon */}
        <rect x="75" y="140" width="30" height="36" rx="3" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
        <line x1="82" y1="150" x2="98" y2="150" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="82" y1="156" x2="95" y2="156" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="82" y1="162" x2="92" y2="162" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      </g>
      <text x="90" y="225" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="system-ui">Create</text>
      <text x="90" y="240" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="system-ui">Escrow</text>

      {/* Node 2: Do Work */}
      <g>
        <rect x="190" y="120" width="100" height="80" rx="16" fill="url(#hiw-node2)" />
        <rect x="190" y="120" width="100" height="80" rx="16" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.4" fill="none" />
        {/* Checkmark icon */}
        <circle cx="240" cy="155" r="16" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
        <path d="M231 155 L237 162 L251 148" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
        <animate attributeName="opacity" values="1;0.92;1" dur="3s" repeatCount="indefinite" />
      </g>
      <text x="240" y="225" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="system-ui">Complete</text>
      <text x="240" y="240" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="system-ui">Work</text>

      {/* Node 3: Get Paid */}
      <g filter="url(#hiw-glow)">
        <rect x="340" y="120" width="100" height="80" rx="16" fill="url(#hiw-node1)" />
        <rect x="340" y="120" width="100" height="80" rx="16" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.4" fill="none" />
        {/* Coin/payment icon */}
        <circle cx="390" cy="155" r="14" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
        <text x="390" y="160" textAnchor="middle" fill="white" fillOpacity="0.9" fontSize="14" fontWeight="700" fontFamily="system-ui">$</text>
        {/* Sparkle */}
        <circle cx="405" cy="138" r="2" fill="#93c5fd" fillOpacity="0.8">
          <animate attributeName="fillOpacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
      <text x="390" y="225" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="system-ui">Get</text>
      <text x="390" y="240" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="system-ui">Paid</text>

      {/* Step numbers */}
      <circle cx="55" cy="115" r="10" fill="#2563eb" fillOpacity="0.15" />
      <text x="55" y="119" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="700" fontFamily="system-ui">1</text>
      <circle cx="205" cy="115" r="10" fill="#2563eb" fillOpacity="0.15" />
      <text x="205" y="119" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="700" fontFamily="system-ui">2</text>
      <circle cx="355" cy="115" r="10" fill="#2563eb" fillOpacity="0.15" />
      <text x="355" y="119" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="700" fontFamily="system-ui">3</text>

      {/* Ambient particles */}
      <circle cx="170" cy="130" r="1.5" fill="#2563eb" fillOpacity="0.3">
        <animate attributeName="fillOpacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="320" cy="140" r="1" fill="#60a5fa" fillOpacity="0.2">
        <animate attributeName="fillOpacity" values="0.2;0.05;0.2" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="190" r="1.2" fill="#60a5fa" fillOpacity="0.15">
        <animate attributeName="fillOpacity" values="0.15;0.04;0.15" dur="6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
