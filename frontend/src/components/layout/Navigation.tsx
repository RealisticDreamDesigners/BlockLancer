'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStacks } from '@/hooks/useStacks';
import { CompactStacksWalletConnect } from '@/components/ui/StacksWalletConnect';
import {
  Shield,
  FileText,
  Scale,
  Menu,
  X,
  Home,
  Plus,
} from 'lucide-react';

/**
 * Navigation Component
 *
 * Main navigation bar with links to key sections.
 * Includes mobile menu and active state highlighting.
 */
export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useStacks();

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
    },
    {
      name: 'Jobs',
      href: '/jobs',
      icon: FileText,
    },
    {
      name: 'Disputes',
      href: '/disputes',
      icon: Scale,
    },
    {
      name: 'DAO',
      href: '/dao',
      icon: Shield,
    },
    {
      name: 'Reputation',
      href: '/reputation',
      icon: Shield,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const handleCreateContract = () => {
    router.push('/dashboard/create');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-orange-600 rounded-lg group-hover:bg-orange-700 transition-colors">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BlockLancer</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                      active
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              {/* Create Contract Button */}
              <button
                onClick={handleCreateContract}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm hover:bg-orange-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </button>

              {/* Enhanced Wallet Connect */}
              <CompactStacksWalletConnect />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {/* Navigation Links */}
            <div className="flex flex-col gap-1 mb-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
                      active
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 px-4 pt-4 border-t border-gray-200">
              {/* Create Contract Button */}
              <button
                onClick={() => {
                  handleCreateContract();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                <span>Create Contract</span>
              </button>

              {/* Enhanced Wallet Connect for Mobile */}
              <div className="w-full">
                <CompactStacksWalletConnect className="w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
