'use client';

interface ReputationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 800) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
  if (score >= 600) return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
  if (score >= 400) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
  return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
}

function getScoreLabel(score: number): string {
  if (score >= 800) return 'Excellent';
  if (score >= 600) return 'Good';
  if (score >= 400) return 'Fair';
  return 'Low';
}

function getStarCount(score: number): number {
  if (score >= 900) return 5;
  if (score >= 700) return 4;
  if (score >= 500) return 3;
  if (score >= 300) return 2;
  return 1;
}

export function ReputationBadge({ score, size = 'md', className = '' }: ReputationBadgeProps) {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);
  const stars = getStarCount(score);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClasses[size]} ${className}`}>
      <span className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < stars ? 'opacity-100' : 'opacity-30'}>
            ★
          </span>
        ))}
      </span>
      <span>{score}</span>
      {size !== 'sm' && <span className="opacity-70">({label})</span>}
    </span>
  );
}
