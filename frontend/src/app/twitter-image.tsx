import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'BlockLancer - Secure Milestone Payments on Bitcoin';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 50%, #2563eb 100%)',
            display: 'flex',
          }}
        />

        {/* Shield icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M16 2L4 7v9c0 7.73 5.12 14.96 12 17 6.88-2.04 12-9.27 12-17V7L16 2z"
              fill="#2563eb"
            />
            <path
              d="M16 4.5L6 8.75v7.25c0 6.62 4.38 12.81 10 14.56 5.62-1.75 10-7.94 10-14.56V8.75L16 4.5z"
              fill="white"
              fillOpacity="0.15"
            />
            <path
              d="M14.5 19.5l-3.5-3.5 1.4-1.4 2.1 2.1 5.1-5.1 1.4 1.4-6.5 6.5z"
              fill="white"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          Block
          <span style={{ color: '#3b82f6' }}>Lancer</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: '#94a3b8',
            fontWeight: 500,
          }}
        >
          Secure Milestone Payments on Bitcoin
        </div>
      </div>
    ),
    { ...size }
  );
}
