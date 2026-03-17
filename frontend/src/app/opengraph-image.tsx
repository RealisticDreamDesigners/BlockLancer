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
        {/* Background grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            opacity: 0.06,
            backgroundImage:
              'linear-gradient(rgba(37,99,235,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

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

        {/* Blockchain block icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <svg
            width="96"
            height="96"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path d="M16 3L28 9.5L16 16L4 9.5L16 3Z" fill="#60a5fa" />
            <path d="M4 9.5L16 16V28.5L4 22V9.5Z" fill="#2563eb" />
            <path d="M28 9.5L16 16V28.5L28 22V9.5Z" fill="#1d4ed8" />
            <rect x="20" y="17" width="3.5" height="2.5" rx="0.5" fill="white" fillOpacity="0.2" />
            <rect x="20" y="21" width="3.5" height="2.5" rx="0.5" fill="white" fillOpacity="0.15" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Block
          <span style={{ color: '#3b82f6' }}>Lancer</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#94a3b8',
            fontWeight: 500,
            marginBottom: 48,
          }}
        >
          Secure Milestone Payments on Bitcoin
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {['Smart Escrow', 'DAO Governance', 'Dispute Resolution'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: 'rgba(37, 99, 235, 0.12)',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  color: '#60a5fa',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* Bottom URL bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#475569',
            fontSize: 16,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: '#2563eb',
              display: 'flex',
            }}
          />
          blocklancer.app
        </div>
      </div>
    ),
    { ...size }
  );
}
