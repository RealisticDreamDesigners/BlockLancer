'use client';

interface GovernanceIllustrationProps {
  className?: string;
}

export function GovernanceIllustration({ className = '-' }: GovernanceIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gov-box" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="gov-bar1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <radialGradient id="gov-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <ellipse cx="200" cy="180" rx="180" ry="140" fill="url(#gov-glow)">
        <animate attributeName="rx" values="180;190;180" dur="5s" repeatCount="indefinite" />
      </ellipse>

      {/* Ballot box */}
      <g>
        {/* Box body */}
        <rect x="120" y="140" width="120" height="100" rx="8" fill="url(#gov-box)" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.4" />
        {/* Box slot */}
        <rect x="155" y="140" width="50" height="5" rx="2" fill="#1e293b" fillOpacity="0.6" />
        {/* Box lid */}
        <rect x="115" y="130" width="130" height="16" rx="6" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="0.5" strokeOpacity="0.3" />
        {/* Box label */}
        <rect x="150" y="175" width="60" height="30" rx="4" fill="white" fillOpacity="0.15" />
        <path d="M165 185 L175 196 L195 178" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" />
      </g>

      {/* Animated vote tokens dropping in */}
      {/* Token 1 */}
      <g>
        <rect x="168" y="70" width="24" height="16" rx="4" fill="#60a5fa" stroke="#2563eb" strokeWidth="1">
          <animate attributeName="y" values="70;138;70" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;0;1" dur="4s" keyTimes="0;0.45;0.55;1" repeatCount="indefinite" />
        </rect>
        <text x="180" y="82" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="system-ui">
          YES
          <animate attributeName="y" values="82;150;82" dur="4s" repeatCount="indefinite" />
        </text>
      </g>

      {/* Token 2 */}
      <g>
        <rect x="173" y="90" width="24" height="16" rx="4" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1">
          <animate attributeName="y" values="95;138;95" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0;0" dur="5s" keyTimes="0;0.2;0.48;1" repeatCount="indefinite" />
        </rect>
      </g>

      {/* Mini bar chart on the right */}
      <g>
        {/* Bar chart background */}
        <rect x="270" y="150" width="100" height="90" rx="8" fill="#1e293b" fillOpacity="0.3" stroke="#2563eb" strokeOpacity="0.15" strokeWidth="1" />

        {/* Bars */}
        <rect x="285" y="210" width="16" height="0" rx="2" fill="url(#gov-bar1)">
          <animate attributeName="height" values="0;40;40" dur="2s" fill="freeze" />
          <animate attributeName="y" values="210;170;170" dur="2s" fill="freeze" />
        </rect>
        <rect x="310" y="210" width="16" height="0" rx="2" fill="#60a5fa">
          <animate attributeName="height" values="0;55;55" dur="2.3s" fill="freeze" />
          <animate attributeName="y" values="210;155;155" dur="2.3s" fill="freeze" />
        </rect>
        <rect x="335" y="210" width="16" height="0" rx="2" fill="#bfdbfe">
          <animate attributeName="height" values="0;25;25" dur="2.6s" fill="freeze" />
          <animate attributeName="y" values="210;185;185" dur="2.6s" fill="freeze" />
        </rect>

        {/* Base line */}
        <line x1="280" y1="215" x2="360" y2="215" stroke="#9ca3af" strokeOpacity="0.3" strokeWidth="1" />
      </g>

      {/* Labels */}
      <text x="180" y="268" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="system-ui">Ballot Box</text>
      <text x="320" y="268" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="600" fontFamily="system-ui">Results</text>

      {/* Connection line */}
      <line x1="245" y1="190" x2="268" y2="190" stroke="#2563eb" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3">
        <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="2s" repeatCount="indefinite" />
      </line>

      {/* Particles */}
      <circle cx="100" cy="120" r="1.5" fill="#2563eb" fillOpacity="0.2">
        <animate attributeName="fillOpacity" values="0.2;0.05;0.2" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="350" cy="130" r="1" fill="#60a5fa" fillOpacity="0.15">
        <animate attributeName="fillOpacity" values="0.15;0.03;0.15" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="80" cy="220" r="1.2" fill="#60a5fa" fillOpacity="0.12">
        <animate attributeName="fillOpacity" values="0.12;0.02;0.12" dur="6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
