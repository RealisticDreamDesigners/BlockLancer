'use client';

import React, { useState, useEffect } from 'react';
import { useStacks } from '@/hooks/useStacks';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { Wallet, LogOut, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';

interface StacksWalletConnectProps {
  className?: string;
  showBalance?: boolean;
}

export default function StacksWalletConnect({
  className = '',
  showBalance = true
}: StacksWalletConnectProps) {
  const { isSignedIn, userAddress, connectWallet, disconnectWallet } = useStacks();
  const [balance, setBalance] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch STX balance
  useEffect(() => {
    if (isSignedIn && userAddress) {
      fetch(`https://api.testnet.hiro.so/extended/v1/address/${userAddress}/stx`)
        .then(res => res.json())
        .then(data => {
          if (data && data.balance !== undefined) {
            const stxBalance = parseInt(data.balance) / 1000000;
            setBalance(stxBalance);
          }
        })
        .catch(err => {
          console.error('Error fetching balance:', err);
          setBalance(0); // Set to 0 on error
        });
    }
  }, [isSignedIn, userAddress]);

  const handleCopyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsOpen(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isSignedIn && userAddress) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-4 py-2.5 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-200 group"
        >
          {/* Wallet Icon */}
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>

          {/* Balance and Address */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              {showBalance && balance !== null ? (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {balance.toFixed(2)} STX
                </span>
              ) : (
                <div className="w-16 h-5 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600 dark:text-white/70 font-medium">
                {formatAddress(userAddress)}
              </span>
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl z-20 overflow-hidden">
              {/* Address Section */}
              <div className="p-4 border-b border-gray-200 dark:border-white/10">
                <div className="text-xs text-gray-500 dark:text-white/50 mb-1 font-medium">Wallet Address</div>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-gray-900 dark:text-white/90 font-mono">
                    {userAddress.slice(0, 10)}...{userAddress.slice(-10)}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600 dark:text-white/70" />
                    )}
                  </button>
                </div>
              </div>

              {/* Balance Section */}
              {showBalance && balance !== null && (
                <div className="p-4 border-b border-gray-200 dark:border-white/10">
                  <div className="text-xs text-gray-500 dark:text-white/50 mb-1 font-medium">Balance</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {balance.toFixed(6)} STX
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/50 mt-1">
                    Testnet
                  </div>
                </div>
              )}

              {/* Explorer Link */}
              <div className="p-4 border-b border-gray-200 dark:border-white/10">
                <a
                  href={`https://explorer.hiro.so/address/${userAddress}?chain=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </a>
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 group"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Disconnect Wallet</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {isConnecting ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Connecting...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </div>
      )}
    </Button>
  );
}

// Compact version for navigation bars
export function CompactStacksWalletConnect({ className = '' }: { className?: string }) {
  const { isSignedIn, userAddress, connectWallet, disconnectWallet } = useStacks();
  const [balance, setBalance] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isSignedIn && userAddress) {
      fetch(`https://api.testnet.hiro.so/extended/v1/address/${userAddress}/stx`)
        .then(res => res.json())
        .then(data => {
          if (data && data.balance !== undefined) {
            const stxBalance = parseInt(data.balance) / 1000000;
            setBalance(stxBalance);
          }
        })
        .catch(err => {
          console.error('Error fetching balance:', err);
          setBalance(0); // Set to 0 on error
        });
    }
  }, [isSignedIn, userAddress]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } finally {
      setIsConnecting(false);
    }
  };

  if (isSignedIn && userAddress) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/20 rounded-lg hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
            <Wallet className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {balance !== null ? `${balance.toFixed(2)} STX` : formatAddress(userAddress)}
          </span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-lg shadow-xl z-20 p-2">
              <button
                onClick={() => {
                  disconnectWallet();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Disconnect</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      size="sm"
      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
    >
      {isConnecting ? <LoadingSpinner size="sm" /> : (
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" />
          Connect
        </div>
      )}
    </Button>
  );
}
