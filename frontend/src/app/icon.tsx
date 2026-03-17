import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          borderRadius: 6,
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 32 32"
          fill="none"
        >
          <path d="M16 3L28 9.5L16 16L4 9.5L16 3Z" fill="#60a5fa" />
          <path d="M4 9.5L16 16V28.5L4 22V9.5Z" fill="#2563eb" />
          <path d="M28 9.5L16 16V28.5L28 22V9.5Z" fill="#1d4ed8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
