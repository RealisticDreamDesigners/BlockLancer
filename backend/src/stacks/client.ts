import { config } from '../config.js';
import pino from 'pino';

const logger = pino({ name: 'stacks-client' });

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call a read-only Clarity function via Hiro API with retry logic.
 * Returns the parsed JSON result from the API.
 */
export async function callReadOnly(
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: string[] = [],
  senderAddress?: string
): Promise<any> {
  const url = `${config.hiroApiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  const body = {
    sender: senderAddress || contractAddress,
    arguments: args,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status === 429 || response.status === 403) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn(
          { status: response.status, attempt, delay, functionName },
          'Rate limited, retrying...'
        );
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Hiro API error ${response.status}: ${text}`);
      }

      const data = await response.json();

      if (!data.okay || data.result === undefined) {
        // Some read-only functions return {okay: false, cause: "..."}
        if (!data.okay && data.cause) {
          logger.warn({ functionName, cause: data.cause }, 'Read-only call returned not-okay');
          return null;
        }
        return data;
      }

      return data.result;
    } catch (err: any) {
      if (attempt === MAX_RETRIES - 1) {
        logger.error(
          { err: err.message, functionName, contractName, attempt },
          'Read-only call failed after retries'
        );
        throw err;
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      logger.warn(
        { err: err.message, functionName, attempt, delay },
        'Read-only call error, retrying...'
      );
      await sleep(delay);
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} retries: ${functionName}`);
}

/**
 * Decode a Clarity value hex string into a JSON-friendly structure.
 * Uses Hiro's API to decode the value.
 */
export function decodeClarityValue(hex: string): any {
  // Parse hex-encoded Clarity values
  // Format: 0x prefix + type byte + data
  if (!hex || hex === '0x00') return null;

  // Type bytes:
  // 0x00 = int, 0x01 = uint, 0x02 = buffer, 0x03 = bool-true, 0x04 = bool-false
  // 0x05 = standard principal, 0x06 = contract principal
  // 0x07 = ok, 0x08 = err, 0x09 = none, 0x0a = some
  // 0x0b = list, 0x0c = tuple, 0x0d = string-ascii, 0x0e = string-utf8

  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const typeByte = parseInt(cleanHex.slice(0, 2), 16);

  switch (typeByte) {
    case 0x00: // int (i128)
      return parseInt(cleanHex.slice(2), 16);
    case 0x01: // uint (u128)
      return parseUint128(cleanHex.slice(2));
    case 0x03: // bool true
      return true;
    case 0x04: // bool false
      return false;
    case 0x09: // none
      return null;
    case 0x0a: // some - recurse on inner value
      return decodeClarityValue('0x' + cleanHex.slice(2));
    default:
      // For complex types, return the hex for now
      // The bootstrap/state-reader will use the Hiro API's JSON endpoint instead
      return hex;
  }
}

function parseUint128(hex: string): number {
  // u128 is 16 bytes big-endian
  const bi = BigInt('0x' + hex.slice(0, 32));
  // Safe to convert to number if within safe integer range
  if (bi <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(bi);
  }
  return Number(bi); // May lose precision for very large values
}

/**
 * Serialize a JS value to Clarity hex argument format for read-only calls.
 */
export function serializeUint(value: number): string {
  // uint is type byte 0x01 + 16-byte big-endian representation
  const hex = BigInt(value).toString(16).padStart(32, '0');
  return '0x01' + hex;
}

export function serializePrincipal(principal: string): string {
  // For read-only call arguments, Hiro API expects hex-encoded Clarity values
  // Standard principal: 0x05 + version(1) + hash160(20)
  // Contract principal: 0x06 + version(1) + hash160(20) + name-length(1) + name
  //
  // However, the Hiro API also accepts the principal string directly in some contexts.
  // We'll use the post-body `arguments` which expects hex Clarity serialization.
  //
  // For simplicity, we use the cv hex serialization approach:
  // This is complex to do manually, so we'll use a helper function that
  // directly formats the arguments for the API.
  //
  // Actually, the Hiro API /v2/contracts/call-read expects serialized Clarity Values
  // as hex strings in the arguments array.
  // We need the @stacks/transactions library to serialize these properly.

  // Import will be done at the call site
  return principal; // Placeholder - actual serialization happens in callReadOnlyTyped
}

/**
 * Higher-level typed read-only call that handles argument serialization
 * using @stacks/transactions library.
 */
export async function callReadOnlyTyped(
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: any[] = [],
  senderAddress?: string
): Promise<any> {
  // Dynamically import @stacks/transactions for serialization
  const { serializeCV, cvToJSON, uintCV, principalCV } = await import(
    '@stacks/transactions'
  );

  // Serialize arguments to hex
  const serializedArgs = args.map((arg) => {
    if (typeof arg === 'number') {
      return serializeCV(uintCV(arg));
    }
    if (typeof arg === 'string' && (arg.startsWith('ST') || arg.startsWith('SP'))) {
      return serializeCV(principalCV(arg));
    }
    // Already serialized hex
    return arg;
  });

  const result = await callReadOnly(
    contractAddress,
    contractName,
    functionName,
    serializedArgs,
    senderAddress
  );

  if (result === null) return null;

  // If result is a hex string, decode it
  if (typeof result === 'string' && result.startsWith('0x')) {
    const { hexToCV } = await import('@stacks/transactions');
    const cv = hexToCV(result);
    return cvToJSON(cv);
  }

  return result;
}
