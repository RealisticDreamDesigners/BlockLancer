'use client';

import React, { useEffect, useState } from 'react';
import { isBackendAvailable, resetBackendHealthCache } from '@/lib/apiClient';

const CHECK_INTERVAL = 30_000; // 30 seconds
const FAILURE_THRESHOLD = 2; // Show banner after 2 consecutive failures

export function HealthBanner() {
  const [show, setShow] = useState(false);
  const failCountRef = React.useRef(0);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      resetBackendHealthCache();
      const available = await isBackendAvailable();

      if (!mounted) return;

      if (!available) {
        failCountRef.current += 1;
        if (failCountRef.current >= FAILURE_THRESHOLD) {
          setShow(true);
        }
      } else {
        failCountRef.current = 0;
        setShow(false);
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800">
      Backend unavailable — some data may be stale or missing.
    </div>
  );
}
