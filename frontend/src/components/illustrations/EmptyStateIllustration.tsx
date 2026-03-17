'use client';

interface EmptyStateIllustrationProps {
  className?: string;
  variant?: 'contracts' | 'jobs' | 'disputes' | 'general';
}

export function EmptyStateIllustration({ className = '-', variant = 'general' }: EmptyStateIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="emptyBgGrad" x1="70" y1="20" x2="130" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="emptyAccent" x1="80" y1="50" x2="120" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="100" cy="80" r="60" fill="url(#emptyBgGrad)" />

      {/* Document back */}
      <rect x="72" y="40" width="64" height="82" rx="5" className="fill-gray-200/60 dark:fill-gray-700/40" />

      {/* Document front */}
      <rect x="62" y="32" width="64" height="82" rx="5" className="fill-white dark:fill-gray-800 stroke-gray-200 dark:stroke-gray-700" strokeWidth="1.5" />

      {/* Document fold corner */}
      <path d="M108 32 L126 50 L108 50 Z" className="fill-gray-50 dark:fill-gray-900 stroke-gray-200 dark:stroke-gray-700" strokeWidth="1.5" />

      {/* Document lines */}
      <rect x="74" y="60" width="40" height="3" rx="1.5" className="fill-gray-200 dark:fill-gray-700" />
      <rect x="74" y="70" width="32" height="3" rx="1.5" className="fill-gray-200 dark:fill-gray-700" />
      <rect x="74" y="80" width="36" height="3" rx="1.5" className="fill-gray-200 dark:fill-gray-700" />
      <rect x="74" y="90" width="24" height="3" rx="1.5" className="fill-gray-100 dark:fill-gray-700/50" />

      {/* Accent badge - Contracts variant (shield + check) */}
      {variant === 'contracts' && (
        <g transform="translate(112, 86)">
          <circle cx="16" cy="16" r="16" fill="url(#emptyAccent)" />
          <path
            d="M16 8 L22 11.5 L22 17 C22 21 19 24.5 16 26 C13 24.5 10 21 10 17 L10 11.5 Z"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.5 17 L15.5 19 L19 14.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {/* Accent badge - Jobs variant (briefcase) */}
      {variant === 'jobs' && (
        <g transform="translate(112, 86)">
          <circle cx="16" cy="16" r="16" fill="url(#emptyAccent)" />
          <rect x="9" y="12" width="14" height="10" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
          <path d="M13 12 L13 10 C13 9 14 8 15 8 L17 8 C18 8 19 9 19 10 L19 12" fill="none" stroke="white" strokeWidth="1.5" />
        </g>
      )}

      {/* Accent badge - Disputes variant (scale) */}
      {variant === 'disputes' && (
        <g transform="translate(112, 86)">
          <circle cx="16" cy="16" r="16" fill="url(#emptyAccent)" />
          <line x1="16" y1="9" x2="16" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 12 L8 18 L12 18 Z" fill="none" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M22 12 L20 18 L24 18 Z" fill="none" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
          <line x1="12" y1="23" x2="20" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {/* Accent badge - General variant (plus) */}
      {variant === 'general' && (
        <g transform="translate(112, 86)">
          <circle cx="16" cy="16" r="16" fill="url(#emptyAccent)" />
          <line x1="11" y1="16" x2="21" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="11" x2="16" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* Subtle decorative dots */}
      <circle cx="38" cy="50" r="2" fill="#2563eb" fillOpacity="0.12">
        <animate attributeName="fillOpacity" values="0.12;0.04;0.12" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="162" cy="42" r="1.5" fill="#2563eb" fillOpacity="0.1">
        <animate attributeName="fillOpacity" values="0.1;0.03;0.1" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="155" cy="118" r="2" fill="#2563eb" fillOpacity="0.08">
        <animate attributeName="fillOpacity" values="0.08;0.02;0.08" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="42" cy="112" r="1.5" fill="#2563eb" fillOpacity="0.06">
        <animate attributeName="fillOpacity" values="0.06;0.02;0.06" dur="6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
