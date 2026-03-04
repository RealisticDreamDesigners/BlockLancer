'use client';

import React from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { Toaster } from 'sonner';
import { HealthBanner } from './HealthBanner';
import { PendingTransactions } from './PendingTransactions';

/**
 * AppLayout Component
 *
 * Main application layout with navigation, content, and footer.
 * Wrap your pages with this component for consistent layout.
 */
export interface AppLayoutProps {
  children: React.ReactNode;
  /**
   * Hide navigation
   */
  hideNav?: boolean;
  /**
   * Hide footer
   */
  hideFooter?: boolean;
}

export function AppLayout({ children, hideNav = false, hideFooter = false }: AppLayoutProps) {
  return (
    <>
      <HealthBanner />
      {!hideNav && <Navigation />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
      <Toaster position="top-right" richColors />
      <PendingTransactions />
    </>
  );
}

export default AppLayout;
