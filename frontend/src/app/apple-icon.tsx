import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
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
          background: '#2563eb',
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 32 32"
          fill="none"
        >
          <path
            d="M16 3L5 7.5v8.5c0 7 4.7 13.5 11 15.5 6.3-2 11-8.5 11-15.5V7.5L16 3z"
            fill="white"
            fillOpacity="0.2"
          />
          <path
            d="M16 5L7 8.75v7.25c0 5.95 3.93 11.5 9 13.06 5.07-1.56 9-7.11 9-13.06V8.75L16 5z"
            fill="white"
            fillOpacity="0.15"
          />
          <path
            d="M14.5 19.5l-3.5-3.5 1.4-1.4 2.1 2.1 5.1-5.1 1.4 1.4-6.5 6.5z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
