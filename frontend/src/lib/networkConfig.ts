import { STACKS_TESTNET, STACKS_MAINNET, STACKS_DEVNET } from '@stacks/network';

export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

const NETWORK_TYPE = (process.env.NEXT_PUBLIC_NETWORK || 'testnet') as NetworkType;
const API_KEY = process.env.NEXT_PUBLIC_HIRO_API_KEY || '-';

export function getNetworkType(): NetworkType {
  return NETWORK_TYPE;
}

export function getNetwork() {
  const baseNetwork =
    NETWORK_TYPE === 'mainnet'
      ? STACKS_MAINNET
      : NETWORK_TYPE === 'devnet'
        ? STACKS_DEVNET
        : STACKS_TESTNET;

  // For devnet, no API key needed
  if (NETWORK_TYPE === 'devnet') {
    return baseNetwork;
  }

  // For testnet/mainnet, inject API key if available
  if (API_KEY) {
    const customFetch = async (url: string, init?: RequestInit) => {
      const headers = {
        ...init?.headers,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      };
      return fetch(url, { ...init, headers });
    };
    return { ...baseNetwork, fetchFn: customFetch };
  }

  return baseNetwork;
}

export function getDeployerAddress(): string {
  if (NETWORK_TYPE === 'devnet') {
    return 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  }
  return 'ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J';
}

export function getApiBaseUrl(): string {
  switch (NETWORK_TYPE) {
    case 'mainnet':
      return 'https://api.hiro.so';
    case 'devnet':
      return 'http://localhost:3999';
    case 'testnet':
    default:
      return 'https://api.testnet.hiro.so';
  }
}
