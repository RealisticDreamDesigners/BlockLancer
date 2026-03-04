import { formatDate } from '@/types';
import { getApiBaseUrl } from '@/lib/networkConfig';

// Stacks testnet block time (~42 seconds empirically)
// Mainnet is ~10 minutes (600s), but testnet is much faster
const TESTNET_AVG_BLOCK_TIME = 42; // seconds
const MAINNET_AVG_BLOCK_TIME = 600; // seconds

const isTestnet = process.env.NEXT_PUBLIC_NETWORK !== 'mainnet';
const AVG_BLOCK_TIME = isTestnet ? TESTNET_AVG_BLOCK_TIME : MAINNET_AVG_BLOCK_TIME;

// Cached block height from API (refreshed every 60s)
let cachedBlockHeight: { height: number; fetchedAt: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Fetch the current Stacks block height from the API.
 * Returns cached value if fresh (< 60s old).
 */
export async function fetchCurrentBlockHeight(): Promise<number> {
  if (cachedBlockHeight && Date.now() - cachedBlockHeight.fetchedAt < CACHE_TTL) {
    return cachedBlockHeight.height;
  }

  try {
    const apiBase = getApiBaseUrl();
    const resp = await fetch(`${apiBase}/v2/info`, {
      headers: process.env.NEXT_PUBLIC_HIRO_API_KEY
        ? { 'X-API-Key': process.env.NEXT_PUBLIC_HIRO_API_KEY }
        : {},
    });
    if (resp.ok) {
      const data = await resp.json();
      const height = data.stacks_tip_height || data.burn_block_height;
      if (height) {
        cachedBlockHeight = { height, fetchedAt: Date.now() };
        return height;
      }
    }
  } catch {
    // Fall through to estimate
  }

  // Fallback: return cached value even if stale, or estimate
  return cachedBlockHeight?.height ?? estimateCurrentBlockHeight();
}

/**
 * Synchronous estimate of current block height.
 * Uses cached API value if available, otherwise falls back to a hardcoded anchor.
 */
export function estimateCurrentBlockHeight(): number {
  if (cachedBlockHeight) {
    // Project forward from cached value
    const elapsedMs = Date.now() - cachedBlockHeight.fetchedAt;
    const additionalBlocks = Math.floor(elapsedMs / (AVG_BLOCK_TIME * 1000));
    return cachedBlockHeight.height + additionalBlocks;
  }

  // Fallback anchor: known block height at a known time
  // March 3, 2026 ~3876860 at unix 1772544000
  const ANCHOR_BLOCK = 3876860;
  const ANCHOR_TIMESTAMP = 1772544000;
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - ANCHOR_TIMESTAMP;
  return ANCHOR_BLOCK + Math.floor(elapsed / AVG_BLOCK_TIME);
}

/**
 * Convert a Stacks block height to a Unix timestamp in milliseconds.
 */
export function blockHeightToTimestamp(blockHeight: number): number {
  const currentBlock = estimateCurrentBlockHeight();
  const blockDiff = blockHeight - currentBlock;
  const nowMs = Date.now();
  return nowMs + blockDiff * AVG_BLOCK_TIME * 1000;
}

/**
 * Format a block height as a human-readable date string.
 */
export function formatBlockHeight(blockHeight: number): string {
  return formatDate(blockHeightToTimestamp(blockHeight));
}

/**
 * Convert a Date to an approximate Stacks block height.
 */
export function dateToBlockHeight(date: Date): number {
  const currentBlock = estimateCurrentBlockHeight();
  const nowMs = Date.now();
  const diffMs = date.getTime() - nowMs;
  const diffBlocks = Math.floor(diffMs / (AVG_BLOCK_TIME * 1000));
  return Math.max(currentBlock + 1, currentBlock + diffBlocks);
}

/**
 * Convert a number of days to approximate block count.
 * 1 day = 86400s / AVG_BLOCK_TIME
 */
export function daysToBlocks(days: number): number {
  return Math.round((days * 86400) / AVG_BLOCK_TIME);
}

/**
 * Convert blocks to approximate days.
 */
export function blocksToDays(blocks: number): number {
  return Math.round((blocks * AVG_BLOCK_TIME) / 86400);
}

/**
 * Format a number of blocks as an approximate human-readable duration.
 */
export function formatBlockDuration(blocks: number): string {
  const totalSeconds = blocks * AVG_BLOCK_TIME;
  const totalMinutes = totalSeconds / 60;

  if (totalMinutes < 60) {
    const rounded = Math.round(totalMinutes);
    return `~${rounded} minute${rounded !== 1 ? 's' : ''}`;
  }

  const totalHours = totalMinutes / 60;
  if (totalHours < 24) {
    const rounded = Math.round(totalHours);
    return `~${rounded} hour${rounded !== 1 ? 's' : ''}`;
  }

  const totalDays = totalHours / 24;
  const rounded = Math.round(totalDays);
  return `~${rounded} day${rounded !== 1 ? 's' : ''}`;
}
