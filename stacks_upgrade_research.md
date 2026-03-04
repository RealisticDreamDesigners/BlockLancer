# BlockLancer Stacks Ecosystem Upgrade Research

Comprehensive research on 4 Stacks ecosystem technologies for integration into BlockLancer: USDCx, sBTC, Turnkey Wallet Abstraction, and x402 Payment Protocol.

---

## Table of Contents

1. [USDCx (Bridged USDC via Circle xReserve)](#1-usdcx)
2. [sBTC (Bridged Bitcoin)](#2-sbtc)
3. [Turnkey Wallet Abstraction](#3-turnkey-wallet-abstraction)
4. [x402 Payment Protocol](#4-x402-payment-protocol)
5. [Integration Roadmap for BlockLancer](#5-integration-roadmap)

---

## 1. USDCx

### What Is It?

USDCx is a **1:1 USDC-backed stablecoin** issued through **Circle's xReserve protocol**, native to the Stacks blockchain. It is NOT a wrapped token or third-party bridge -- it's Circle's own first-party infrastructure.

- Each USDCx token is backed by exactly 1 USDC held in Circle's reserves
- Launched on Stacks mainnet in **December 2025**
- Written in **Clarity 3** (epoch 3.3)
- Fully implements the **SIP-010** fungible token standard

### Contract Addresses

| Contract | Mainnet Principal |
|----------|-------------------|
| **USDCx Token** | `SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx` |
| **USDCx Bridge (xReserve)** | `SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1` |

**Testnet:**
| Contract | Testnet Principal |
|----------|-------------------|
| **USDCx Token** | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx` |
| **USDCx Bridge** | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1` |

### Token Details

| Property | Value |
|----------|-------|
| Name | `USDCx` |
| Symbol | `USDCx` |
| Decimals | `6` (same as USDC on Ethereum) |
| Internal FT Name | `usdcx-token` |
| Total Supply | ~$25M (at time of research) |
| Standard | SIP-010 compliant |

### How to Use in Clarity (Escrow Integration)

**Reading balance:**
```clarity
(contract-call? 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx get-balance user-principal)
```

**Transferring (e.g., depositing into escrow):**
```clarity
;; Client deposits USDCx into escrow contract
(try! (contract-call? 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx
  transfer
  amount
  tx-sender
  (as-contract tx-sender)  ;; escrow contract holds the funds
  none))
```

**Releasing from escrow to freelancer:**
```clarity
(as-contract
  (contract-call? 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx
    transfer
    amount
    tx-sender        ;; within as-contract = contract's own principal
    freelancer
    none))
```

**Key insight:** The transfer function checks `(or (is-eq tx-sender sender) (is-eq contract-caller sender))`. This means our escrow contract can transfer tokens deposited by users if the user initiated the call through our contract, and `as-contract` allows the contract to send its own held tokens.

### Frontend Integration

```typescript
import { createAssetInfo, makeStandardFungiblePostCondition, FungibleConditionCode } from '@stacks/transactions';

// Post-condition for USDCx transfers
const postConditions = [
  makeStandardFungiblePostCondition(
    senderAddress,
    FungibleConditionCode.Equal,
    microAmount,
    createAssetInfo(
      'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE',
      'usdcx',
      'usdcx-token'  // fungible token name from define-fungible-token
    )
  ),
];
```

### Bridging (Ethereum <-> Stacks)

| Parameter | Deposit (USDC -> USDCx) | Withdrawal (USDCx -> USDC) |
|-----------|-------------------------|----------------------------|
| Time | ~15 minutes | ~60 minutes |
| Fee | ETH gas only | STX gas + ~$4.80 |
| Minimum | 10 USDC (mainnet) | 4.80 USDCx |
| Method | Ethereum `depositToRemote()` | Stacks `burn()` on usdcx-v1 |

**Users get USDCx by:**
1. Bridging from Ethereum via xReserve
2. Acquiring on a Stacks DEX (e.g., Bitflow)
3. BlockLancer does NOT need to handle bridging itself

### Error Handling

- `u4` -- ERR_NOT_OWNER (unauthorized transfer)
- `u400` -- ERR_UNAUTHORIZED (missing role)
- `u401` -- ERR_PAUSED (protocol paused by Circle)

The contract can be paused by Circle. Our escrow should handle `ERR_PAUSED` gracefully.

---

## 2. sBTC

### What Is It?

sBTC is a **1:1 Bitcoin-backed fungible token** on Stacks that follows the **SIP-010** standard. It allows users to move BTC from Bitcoin L1 to Stacks L2 and back, enabling Bitcoin in smart contracts and DeFi.

**Key difference from wBTC:** sBTC uses a decentralized threshold signer set (15 community-chosen signers, 70% consensus) instead of a centralized custodian (BitGo). Signers earn BTC rewards from Stacks consensus -- no additional peg fees.

### Current Status (March 2026)

- **Mainnet:** LIVE since December 17, 2024
- **Withdrawals:** LIVE since April 30, 2025
- **TVL:** Growing rapidly (first 1,000 BTC cap filled in 4 days)
- **Institutional access:** Fireblocks integration live since February 2026
- **15 community signers** active

### Contract Address

| Network | Contract |
|---------|----------|
| **Mainnet** | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` |
| **Testnet** | Auto-remapped by Clarinet |

### Token Details

| Property | Value |
|----------|-------|
| Name | `sBTC` |
| Symbol | `sBTC` |
| Decimals | `8` (same as Bitcoin satoshis) |
| 1 sBTC | `100,000,000` smallest units |
| Standard | SIP-010 (implicit) |

### sBTC Contract Suite

- **`sbtc-token`** -- SIP-010 fungible token (transfers, balances, minting/burning)
- **`sbtc-deposit`** -- Processes deposit requests (minting sBTC)
- **`sbtc-withdrawal`** -- Manages withdrawal requests (burning sBTC, releasing BTC)
- **`sbtc-registry`** -- Central registry for withdrawal requests, deposits, signer set
- **`sbtc-bootstrap-signers`** -- Signer bootstrapping and rotation

### How to Use in Clarity (Escrow Integration)

**Reading balance:**
```clarity
(contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token get-balance user-principal)
```

**Locking sBTC in escrow:**
```clarity
(try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
  transfer
  amount
  tx-sender
  (as-contract tx-sender)
  none))
```

**Releasing from escrow:**
```clarity
(as-contract
  (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
    transfer
    amount
    tx-sender
    freelancer
    none))
```

### Frontend Integration

```typescript
import { openContractCall } from '@stacks/connect';
import { Cl, Pc, PostConditionMode } from '@stacks/transactions';

const sbtcContract = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token';

openContractCall({
  contractAddress: 'YOUR_ESCROW_DEPLOYER',
  contractName: 'blocklancer-escrow-v5',
  functionName: 'create-escrow-sbtc',
  functionArgs: [...],
  postConditions: [
    Pc.principal(clientAddress)
      .willSendEq(amountInSatoshis)
      .ft(sbtcContract, 'sbtc-token'),
  ],
  postConditionMode: PostConditionMode.Deny,
  onFinish: (data) => { /* handle */ },
});
```

### Deposit/Withdrawal Flows

| Parameter | Deposit (BTC -> sBTC) | Withdrawal (sBTC -> BTC) |
|-----------|----------------------|--------------------------|
| Time | ~3 Bitcoin blocks (~30 min) | ~6 Bitcoin blocks (~60 min) |
| Min amount | 0.001 BTC | 546 satoshis (dust limit) |
| User fee | Bitcoin network TX fee | Bitcoin fee (capped at user's max-fee) |
| Protocol fee | Max 80,000 sats UTXO consolidation | None |
| Peg fee | **None** | **None** |

**sBTC Bridge UI:** `https://sbtc.stacks.co/`

### Developer Tools

```bash
npm install sbtc                    # deposit/withdrawal helpers
npm install @stacks/transactions    # transaction construction
npm install @stacks/connect         # wallet connection
```

### Balance Reading from Hiro API

```
GET https://api.hiro.so/extended/v1/address/{stacks-address}/balances
```
Response includes `fungible_tokens` with sBTC balance keyed by contract identifier.

---

## 3. Turnkey Wallet Abstraction

### What Is It?

**Turnkey** is a Wallet-as-a-Service (WaaS) platform that provides non-custodial key management using **AWS Nitro Enclaves**. It enables wallet creation and transaction signing without users needing browser extensions.

### Key Features

- **Non-custodial:** Private keys are generated and stored inside AWS Nitro Enclaves -- even Turnkey cannot access them
- **Passkey authentication:** Users authenticate with biometrics (Face ID, Touch ID, Windows Hello)
- **No browser extension required:** Unlike Hiro/Leather wallets
- **Multi-chain:** Supports Ethereum, Solana, Stacks, and more
- **Sub-organizations:** Each user gets their own isolated key space

### Stacks Integration

Turnkey can sign Stacks transactions via two methods:

**1. Using `signRawPayload`:**
```typescript
import { TurnkeyClient } from '@turnkey/http';
import { ApiKeyStamper } from '@turnkey/api-key-stamper';
import { makeSTXTokenTransfer, broadcastTransaction } from '@stacks/transactions';

const turnkeyClient = new TurnkeyClient(
  { baseUrl: 'https://api.turnkey.com' },
  new ApiKeyStamper({ apiPublicKey, apiPrivateKey })
);

// Create a Stacks transaction
const tx = await makeSTXTokenTransfer({
  recipient: 'SP...',
  amount: 1000000n,
  network: 'testnet',
  // Don't sign here -- Turnkey will sign
});

// Sign with Turnkey
const signResult = await turnkeyClient.signRawPayload({
  organizationId: 'org-...',
  signWith: walletAddress,
  payload: tx.serialize().toString('hex'),
  encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
  hashFunction: 'HASH_FUNCTION_SHA256',
});

// Apply signature and broadcast
tx.auth.spendingCondition.signature = signResult.signature;
await broadcastTransaction({ transaction: tx, network: 'testnet' });
```

**2. Using `@turnkey/stacks` package (if available):**
```typescript
import { TurnkeyStacksSigner } from '@turnkey/stacks';

const signer = new TurnkeyStacksSigner({
  turnkeyClient,
  organizationId: 'org-...',
  signWith: walletAddress,
});
```

### How It Fits BlockLancer

**Recommended: Dual-path architecture**

```
User arrives at BlockLancer
         |
    +----+----+
    |         |
Has Hiro   No extension
Wallet?    (mobile/new user)
    |         |
    v         v
Hiro       Turnkey
Wallet     (passkey login,
Connect    embedded wallet)
    |         |
    +----+----+
         |
  Same escrow contracts
  Same frontend logic
```

- **Hiro Wallet:** For power users who already have it
- **Turnkey:** For onboarding new users, mobile users, and programmatic wallets
- Both paths produce signed Stacks transactions that interact with the same contracts

### Pricing

| Plan | Cost | Wallets | Operations |
|------|------|---------|------------|
| Free | $0 | 100 wallets | 1,000 ops/month |
| Build | $249/mo | Unlimited | 5,000 ops/month |
| Scale | Custom | Unlimited | Custom |

### Security Model

- Keys generated inside **AWS Nitro Enclaves** (hardware-isolated)
- Turnkey employees cannot access private keys
- Quorum-based access policies (multi-approval)
- SOC 2 Type II compliant

### Limitations

- Requires internet connectivity (no offline signing)
- Additional API latency (~100-300ms) vs local wallet
- Stacks support is newer than EVM/Solana
- Need to handle the wallet creation flow in our own UI

---

## 4. x402 Payment Protocol

### What Is It?

x402 revives the HTTP `402 Payment Required` status code for automatic, programmatic payments within HTTP request-response cycles. Developed by Coinbase, now governed by the **x402 Foundation** (co-founded with Cloudflare, September 2025).

**Key stats:** 100+ million payments processed, V2 released December 2025, 5,600+ GitHub stars.

### How It Works (3-Step HTTP Handshake)

```
1. Client: GET /api/premium-data
2. Server: HTTP 402 + PAYMENT-REQUIRED header (payment instructions)
3. Client: Signs payment, retries with PAYMENT-SIGNATURE header
4. Server: Verifies payment, settles on-chain, returns 200 + data
```

### HTTP Headers

| Header | Direction | Content |
|--------|-----------|---------|
| `PAYMENT-REQUIRED` | Server -> Client (402) | Base64-encoded payment instructions |
| `PAYMENT-SIGNATURE` | Client -> Server (retry) | Base64-encoded signed payment |
| `PAYMENT-RESPONSE` | Server -> Client (200) | Settlement confirmation |

### Stacks Support

Stacks is **not in the official Coinbase SDK** but has **two community implementations:**

**A. `x402-stacks` npm package (by tony1908)**
- Supports: STX, sBTC
- Network IDs: `stacks:1` (mainnet), `stacks:2147483648` (testnet)

**B. `aibtcdev/x402-api` (production Cloudflare Worker)**
- Supports: STX, sBTC, USDCx
- Production: `x402.aibtc.com` (mainnet)
- Staging: `x402.aibtc.dev` (testnet)

### Server-Side Code Example (Express + Stacks)

```typescript
import express from 'express';
import { paymentMiddleware, getPayment } from 'x402-stacks';

const app = express();

app.use(paymentMiddleware({
  payTo: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  routes: {
    'POST /api/escrow/create': {
      price: 500000,        // 0.5 STX platform fee
      token: 'STX',
      network: 'mainnet',
      description: 'Escrow creation platform fee'
    },
    'POST /api/dispute/open': {
      price: 1000000,       // 1 STX dispute filing fee
      token: 'STX',
      network: 'mainnet',
      description: 'Dispute filing fee'
    }
  }
}));
```

### Client-Side Code Example

```typescript
import { privateKeyToAccount, wrapAxiosWithPayment } from 'x402-stacks';
import axios from 'axios';

const account = privateKeyToAccount(PRIVATE_KEY_HEX, 'mainnet');
const api = wrapAxiosWithPayment(axios.create(), account);

// Automatic 402 handling
const response = await api.post('/api/escrow/create', { ... });
```

### Where x402 Fits BlockLancer

| Use Case | Fit | Notes |
|----------|-----|-------|
| Platform fee on escrow creation | Good | Small STX/sBTC fee via HTTP 402 |
| Premium feature access | Excellent | Gate analytics, priority support |
| Dispute filing fees | Good | Pay-per-dispute via API |
| AI-powered contract review | Excellent | Pay-per-use AI analysis |
| Marketplace listing fees | Good | Charge per job listing |

### Where x402 Does NOT Fit

| Use Case | Issue |
|----------|-------|
| Escrow deposit holding | x402 is pay-and-deliver, not hold-and-release |
| Milestone-based releases | Requires conditional logic (use smart contracts) |
| Dispute resolution funds | Multi-party conditional logic needed |

### Recommended Architecture

```
x402 layer: Platform fees (small, immediate payments)
  - Escrow creation fee
  - Dispute filing fee
  - Premium API access

Smart Contract layer: Escrow operations (conditional, multi-party)
  - Escrow deposits (blocklancer-escrow-v4)
  - Milestone releases
  - Dispute resolution (blocklancer-dispute-v5)
  - DAO governance (blocklancer-dao-v3)
```

### Risks

1. Stacks support is **community-maintained**, not Coinbase-backed
2. Stacks block times (~10-30s) slower than EVM settlement (~2s)
3. No formal escrow scheme in x402 yet
4. Less battle-tested than EVM implementation

---

## 5. Integration Roadmap for BlockLancer

### Phase A: Multi-Token Escrow (USDCx + sBTC) -- HIGH PRIORITY

This directly builds on our existing `contract-token-type` map in `blocklancer-escrow-v3.clar`.

**Contract changes (new escrow-v5):**
1. Add `create-escrow-usdcx` function using USDCx `transfer`
2. Add `create-escrow-sbtc` function using sBTC `transfer`
3. Modify `approve-milestone` to check `contract-token-type` and dispatch to correct transfer (STX vs USDCx vs sBTC)
4. Same for `claim-deadline-refund` and all fund release paths
5. Fee collection logic branches by token type

**Frontend changes:**
1. Token selector on escrow creation page (STX / USDCx / sBTC)
2. Appropriate post-conditions per token type
3. Balance display showing all 3 token balances
4. Amount formatting: STX (6 decimals), USDCx (6 decimals), sBTC (8 decimals)

**Backend changes:**
1. Store token type in `escrows` table
2. Display token symbol in API responses
3. Read balances from Hiro API for all 3 tokens

### Phase B: Turnkey Wallet Abstraction -- MEDIUM PRIORITY

**Goal:** Allow users to sign up and create escrows without a browser extension.

**Implementation:**
1. Install `@turnkey/http`, `@turnkey/api-key-stamper`, `@turnkey/webauthn-stamper`
2. Add "Continue with Passkey" login option alongside "Connect Hiro Wallet"
3. Create Turnkey sub-organization per user on first passkey registration
4. Store Turnkey wallet address -> Stacks address mapping
5. Create a `TurnkeySigner` that signs Stacks transactions via Turnkey API
6. Existing `openContractCall` sites need a wrapper that dispatches to either Hiro or Turnkey
7. Fund new wallets with small STX for gas (could use x402 or a faucet)

**Architecture impact:** Medium -- requires a new auth flow, wallet creation backend, and signer abstraction layer.

### Phase C: x402 Platform Fees -- LOWER PRIORITY

**Goal:** Use HTTP 402 for collecting platform fees on specific actions.

**Implementation:**
1. Install `x402-stacks` npm package
2. Add payment middleware to backend API routes for:
   - `POST /api/escrow/create` -- 0.5 STX creation fee
   - `POST /api/dispute/open` -- 1 STX dispute fee
   - `GET /api/analytics/premium` -- premium dashboard access
3. Frontend: wrap API client with `wrapAxiosWithPayment` for automatic 402 handling
4. This works alongside existing on-chain fees (not replacing them)

**Note:** This is lower priority because our payments-v2 contract already handles platform fees on-chain. x402 would add an additional HTTP-layer fee or replace the on-chain one. This needs careful design to avoid double-charging.

### Summary Priority Matrix

| Technology | Priority | Effort | Impact | Status |
|-----------|----------|--------|--------|--------|
| **USDCx + sBTC** multi-token | HIGH | Medium (new contract + frontend) | High -- enables stablecoin escrows | Ready to implement |
| **Turnkey** wallet abstraction | MEDIUM | High (new auth system) | High -- removes extension requirement | Needs design phase |
| **x402** platform fees | LOWER | Low-Medium | Medium -- cleaner fee collection | Community SDK stability concern |

### Token Quick Reference

| Token | Contract (Mainnet) | Decimals | FT Name | Use Case |
|-------|-------------------|----------|---------|----------|
| STX | Native | 6 | N/A | Default escrow currency |
| USDCx | `SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx` | 6 | `usdcx-token` | USD-stable escrows |
| sBTC | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` | 8 | `sbtc-token` | Bitcoin-denominated escrows |

---

## Sources

### USDCx
- [USDCx Stacks Docs](https://docs.stacks.co/learn/bridging/usdcx)
- [Bridging USDCx Guide](https://docs.stacks.co/more-guides/bridging-usdcx)
- [Circle xReserve Blog](https://www.circle.com/blog/usdcx-on-stacks-now-available-via-circle-xreserve)
- [USDCx Launch Announcement](https://www.stacks.co/blog/usdcx-launch-stacks-bitcoin-defi)
- [SIP-010 Token Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md)
- [Circle Testnet Faucet](https://faucet.circle.com/)

### sBTC
- [sBTC Documentation](https://docs.stacks.co/learn/sbtc)
- [sBTC Integration Guide (Hiro)](https://www.hiro.so/blog/how-to-integrate-sbtc-into-your-application)
- [sBTC Token Contract Source](https://github.com/stacks-sbtc/sbtc/blob/main/contracts/contracts/sbtc-token.clar)
- [sBTC Builder Quickstart](https://docs.stacks.co/build/sbtc/sbtc-builder-quickstart)
- [sBTC Clarity Contracts](https://docs.stacks.co/concepts/sbtc/clarity-contracts)
- [sBTC Bridge](https://sbtc.stacks.co/)
- [sbtc npm Package](https://www.npmjs.com/package/sbtc)
- [sBTC DeFi Playbook](https://stacks.org/sbtc-defi-playbook)

### Turnkey Wallet Abstraction
- [Turnkey Documentation](https://docs.turnkey.com/)
- [Turnkey Stacks Integration](https://docs.turnkey.com/reference/stacks)
- [Turnkey SDK](https://www.npmjs.com/package/@turnkey/http)
- [Turnkey WebAuthn Stamper](https://www.npmjs.com/package/@turnkey/webauthn-stamper)

### x402
- [x402 Official Website](https://www.x402.org/)
- [Coinbase x402 GitHub](https://github.com/coinbase/x402)
- [x402 Specification](https://github.com/coinbase/x402/blob/main/specs/x402-specification.md)
- [x402 V2 Launch](https://www.x402.org/writing/x402-v2-launch)
- [Cloudflare x402 Foundation](https://blog.cloudflare.com/x402/)
- [x402-Stacks Library](https://github.com/tony1908/x402Stacks)
- [aibtcdev x402 API](https://github.com/aibtcdev/x402-api)
- [Stacks x402 Docs](https://docs.stacks.co/get-started/use-cases/ai#x402-stacks)
- [x402 Stacks Website](https://www.stacksx402.com/)
