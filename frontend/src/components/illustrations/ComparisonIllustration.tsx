'use client';

interface ComparisonIllustrationProps {
  className?: string;
}

export function ComparisonIllustration({ className = '-' }: ComparisonIllustrationProps) {
  return (
    <svg
      viewBox="0 0 480 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="comp-shield" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <radialGradient id="comp-glow" cx="50%" cy="50%" r="35%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Divider line */}
      <line x1="240" y1="30" x2="240" y2="250" stroke="#374151" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />

      {/* ===== LEFT SIDE: Traditional (broken) ===== */}
      <text x="120" y="35" textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="600" fontFamily="system-ui" letterSpacing="1">TRADITIONAL</text>

      {/* Broken chain links */}
      <g opacity="0.6">
        {/* Link 1 */}
        <ellipse cx="80" cy="120" rx="20" ry="28" fill="none" stroke="#6b7280" strokeWidth="3" />
        {/* Link 2 (broken) */}
        <path d="M100 120 Q120 100 140 105" fill="none" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        <path d="M100 120 Q120 140 140 135" fill="none" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        {/* Break spark */}
        <line x1="118" y1="112" x2="125" y2="106" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="122" y1="118" x2="130" y2="116" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="opacity" values="0;0.5;0" dur="2s" repeatCount="indefinite" />
        </line>
        {/* Link 3 (disconnected) */}
        <ellipse cx="160" cy="120" rx="20" ry="28" fill="none" stroke="#6b7280" strokeWidth="3" strokeOpacity="0.4" />
      </g>

      {/* X mark */}
      <circle cx="120" cy="185" r="14" fill="#374151" fillOpacity="0.15" />
      <line x1="113" y1="178" x2="127" y2="192" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      <line x1="127" y1="178" x2="113" y2="192" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />

      <text x="120" y="220" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="system-ui">No guarantee</text>
      <text x="120" y="234" textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="system-ui">Platform decides</text>

      {/* ===== RIGHT SIDE: BlockLancer (solid) ===== */}
      <text x="360" y="35" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="system-ui" letterSpacing="1">BLOCKLANCER</text>

      {/* Glow behind shield */}
      <circle cx="360" cy="130" r="60" fill="url(#comp-glow)">
        <animate attributeName="r" values="60;68;60" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Solid shield */}
      <g>
        <path
          d="M360 80 L400 100 L400 150 C400 175 380 195 360 205 C340 195 320 175 320 150 L320 100 Z"
          fill="url(#comp-shield)"
          stroke="#60a5fa"
          strokeWidth="1"
          strokeOpacity="0.5"
        >
          <animate attributeName="opacity" values="1;0.92;1" dur="3s" repeatCount="indefinite" />
        </path>
        {/* Checkmark */}
        <path d="M345 140 L355 152 L378 126" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
      </g>

      {/* Chain links (solid, connected) */}
      <g opacity="0.6">
        <ellipse cx="310" cy="135" rx="10" ry="14" fill="none" stroke="#2563eb" strokeWidth="2" strokeOpacity="0.5" />
        <ellipse cx="410" cy="135" rx="10" ry="14" fill="none" stroke="#2563eb" strokeWidth="2" strokeOpacity="0.5" />
      </g>

      {/* Pulse ring */}
      <circle cx="360" cy="140" r="50" fill="none" stroke="#2563eb" strokeWidth="1" strokeOpacity="0">
        <animate attributeName="r" values="50;70;50" dur="3s" repeatCount="indefinite" />
        <animate attributeName="strokeOpacity" values="0.2;0;0.2" dur="3s" repeatCount="indefinite" />
      </circle>

      <text x="360" y="228" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="500" fontFamily="system-ui">Smart contract secured</text>
      <text x="360" y="242" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="500" fontFamily="system-ui">Community governed</text>

      {/* Particles */}
      <circle cx="300" cy="80" r="1.5" fill="#2563eb" fillOpacity="0.2">
        <animate attributeName="fillOpacity" values="0.2;0.05;0.2" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="420" cy="90" r="1" fill="#60a5fa" fillOpacity="0.15">
        <animate attributeName="fillOpacity" values="0.15;0.03;0.15" dur="5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
