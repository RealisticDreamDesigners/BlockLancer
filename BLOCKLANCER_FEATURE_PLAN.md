# BlockLancer Feature Implementation Plan

## Context

The core BlockLancer platform (5 Clarity contracts, TypeScript backend, Next.js frontend) is deployed on Stacks testnet and merged to main. We're now adding 7 new features inspired by SecureFlow-scaffold analysis. **All features are additive** — they enhance and extend existing functionality. No existing feature is replaced.

**Removed**: Arbiter System (feature #4) — it would replace DAO dispute resolution, which the user built and wants preserved. The DAO remains the sole dispute resolution mechanism.

**Principle**: Existing feature enhancements first, then new features.

---

## Feature List (Implementation Order)

| Phase | Feature | Type | Priority |
|-------|---------|------|----------|
| 1 | Milestone Rejection UX | Enhance existing | High |
| 2 | Platform Fee System | Activate existing | High |
| 3 | Admin Pause Mechanism | Enhance existing | Medium |
| 4 | On-Chain Reputation System | New (additive) | High |
| 5 | Emergency Refund After Deadline | Enhance existing | Medium |
| 6 | Job Marketplace | New (additive) | Medium |
| 7 | Multi-Token Support | Enhance existing | Lower |

---

## Contract Upgrade Strategy

Deployed contracts can't be modified. We deploy new versions **once**, batching all contract changes together:

- **`blocklancer-escrow-v3`** — Adds: resubmission from rejected state, fee integration with payments, pause guard, deadline refund claim, multi-token (Phase 7)
- **`blocklancer-dispute-v4`** — Adds: pass resolution type from DAO (not hardcoded), pause guard, static `contract-call?` to escrow-v3
- **`blocklancer-dao-v2`** — Adds: pause guard, static `contract-call?` to escrow-v3 and dispute-v4 (replacing placeholder execute functions)
- **`blocklancer-payments-v2`** — Adds: `get-treasury` read-only function, minor adjustments for escrow integration
- **`blocklancer-reputation`** — New contract
- **`blocklancer-marketplace`** — New contract
- **`blocklancer-membership`** — No changes needed

**Cross-contract calls**: Use static `contract-call?` (e.g., `(contract-call? .blocklancer-escrow-v3 dao-release-payment id)`). No traits needed since all contracts are deployed together with known addresses.

**Deploy order**: escrow-v3 + payments-v2 first → then dispute-v4, dao-v2, reputation, marketplace (since they reference escrow-v3).

---

## Phase 1: Milestone Rejection UX

**Goal**: Surface the existing `reject-milestone` contract function in the UI. Show rejection reasons, status badges. Resubmission support is deferred to Phase 2 (requires escrow-v3).

### What already exists
- `reject-milestone` function in escrow contract (line 276-300) — sets status to `u3`, stores `rejection-reason`
- Backend chainhook handler already processes `reject-milestone` events (`backend/src/chainhook/handlers/escrow-handler.ts`)
- State reader already reads `rejection-reason` from milestones (`backend/src/chainhook/state-reader.ts`)
- `milestones` DB table has `rejection_reason` and `status` columns
- Frontend `rejectMilestone` function exists in `useStacks.ts` (uses `prompt()` for reason input)

### Changes needed

**Backend** (minor):
- `backend/src/db/queries/escrows.ts` — Add `getMilestoneById(escrowId, milestoneIndex)` query
- `backend/src/api/routes/escrows.ts` — Add `GET /api/escrows/:id/milestones/:milestoneId` endpoint

**Frontend**:
- `frontend/src/components/dispute/DisputeCard.tsx` or equivalent milestone display — Show "Rejected" badge with rejection reason when milestone status = 3
- `frontend/src/hooks/useStacks.ts` — Replace `prompt()` in rejectMilestone with proper modal trigger
- Create `frontend/src/components/milestone/RejectionReasonModal.tsx` — Modal with textarea for rejection reason
- `frontend/src/lib/apiClient.ts` — Add `getMilestoneFromBackend()` function

### Verification
1. Create escrow, add milestone, submit as freelancer
2. Reject as client with reason → verify reason shows in UI
3. Verify backend DB has rejection_reason populated
4. Verify milestone card shows "Rejected" status badge with reason text

---

## Phase 2: Platform Fee System

**Goal**: Activate the fee infrastructure already in the payments contract. Wire escrow milestone approval to deduct platform fees. Requires deploying escrow-v3 and payments-v2.

### What already exists
- Payments contract has: `calculate-platform-fee` (1.5% for pro tier), `process-platform-fee`, `upgrade-to-pro`, tier system
- Escrow contract has fee code **commented out** at lines 244-254, 315-325, 370-384
- Backend `payments-handler.ts` exists but only handles `set-user-tier` and `process-platform-fee`

### New contracts

**`contracts/blocklancer-escrow-v3.clar`** (copy escrow-v2 + changes):
- Line 211: Change `(is-eq ... milestone-pending)` to `(or (is-eq ... milestone-pending) (is-eq ... milestone-rejected))` — enables resubmission (from Phase 1b)
- Lines 244-254: Uncomment fee integration in `approve-milestone` — use static `(contract-call? .blocklancer-payments-v2 calculate-platform-fee ...)`
- Lines 315-325: Uncomment fee integration in `dao-release-payment`
- Lines 370-384: Uncomment helper functions, convert to static contract-call
- Add `claim-deadline-refund` function (for Phase 5, include now to avoid another version)
- Add `contract-paused` var + `assert-not-paused` guard (for Phase 3, include now)

**`contracts/blocklancer-payments-v2.clar`** (copy payments + changes):
- Add `(define-read-only (get-treasury) (var-get platform-treasury))`
- Ensure `calculate-platform-fee` works when called from escrow-v3

### Backend changes

**New migration: `backend/migrations/002_platform_fees.sql`**
```sql
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS fee_amount BIGINT DEFAULT 0;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS net_amount BIGINT DEFAULT 0;
CREATE TABLE IF NOT EXISTS platform_fees (...);
CREATE TABLE IF NOT EXISTS user_tiers (...);
```

**New files**:
- `backend/src/db/queries/platform-fees.ts` — upsert fees, user tiers
- `backend/src/api/routes/payments.ts` — GET /api/payments/fees/total, GET /api/payments/user/:address/tier, GET /api/payments/stats

**Modified files**:
- `backend/src/stacks/contracts.ts` — Update contract names to v3/v2, add new function names
- `backend/src/config.ts` — Update contract env vars for new versions
- `backend/src/chainhook/handlers/payments-handler.ts` — Handle `upgrade-to-pro` events
- `backend/src/chainhook/state-reader.ts` — Add `readUserTierInfo()`, `readPlatformStats()`
- `backend/src/api/server.ts` — Register payments routes
- `backend/src/sync/bootstrap.ts` — Add `bootstrapUserTiers()` and `bootstrapPlatformFees()`

### Frontend changes

**New files**:
- `frontend/src/hooks/usePayments.ts` — Hook for fee data, user tier, upgrade action
- `frontend/src/components/payments/TierBadge.tsx` — Free/Pro badge
- `frontend/src/components/payments/UpgradeModal.tsx` — Upgrade to Pro flow
- `frontend/src/components/payments/FeeBreakdown.tsx` — Fee display on milestone approval

**Modified files**:
- `frontend/src/lib/apiClient.ts` — Add payment/tier API functions
- `frontend/src/hooks/useStacks.ts` — Update contract names to escrow-v3, update approve-milestone to show fee
- All contract reference files — Update contract names

### Verification
1. Deploy escrow-v3, payments-v2 to testnet via Clarinet
2. Create escrow, add milestone, approve → verify fee deducted (1.5% for pro users)
3. Check `curl localhost:8080/api/payments/stats` shows collected fees
4. Verify freelancer receives (amount - fee), treasury gets fee
5. Test upgrade-to-pro flow on frontend

---

## Phase 3: Admin Pause Mechanism

**Goal**: Emergency circuit breaker. Contract owner can pause/unpause contracts. All state-changing functions check pause status first.

### Contract changes (already included in Phase 2 contracts)

Add to escrow-v3, dispute-v4, dao-v2:
```clarity
(define-data-var contract-paused bool false)
(define-private (assert-not-paused) (ok (asserts! (not (var-get contract-paused)) (err u999))))
(define-public (set-paused (paused bool)) ...)
(define-read-only (is-paused) (var-get contract-paused))
```
Add `(try! (assert-not-paused))` as first line of every public state-changing function.

### Backend changes

**New migration: `backend/migrations/003_pause_state.sql`**
```sql
CREATE TABLE IF NOT EXISTS contract_pause_state (
  contract_name VARCHAR(128) UNIQUE NOT NULL,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  paused_by VARCHAR(128),
  paused_at TIMESTAMP WITH TIME ZONE
);
```

**New files**:
- `backend/src/db/queries/pause-state.ts`
- `backend/src/api/routes/admin.ts` — GET /api/admin/pause-state

**Modified files**:
- `backend/src/chainhook/handlers/escrow-handler.ts` — Handle `set-paused` event
- `backend/src/chainhook/state-reader.ts` — Add `readPauseState()` for each contract
- `backend/src/api/server.ts` — Register admin routes
- `backend/src/api/routes/health.ts` — Include pause status

### Frontend changes

**New files**:
- `frontend/src/components/admin/PauseControl.tsx` — Pause/unpause buttons with confirmation
- `frontend/src/hooks/usePauseState.ts` — Read and set pause state

**Modified files**:
- `frontend/src/app/admin/page.tsx` — Add pause control section
- Show banner across site when contracts are paused

### Verification
1. Call `set-paused(true)` on escrow-v3
2. Try `create-escrow` → should fail with err u999
3. Call `set-paused(false)` → retry → should succeed
4. Verify admin page shows pause toggle and current state

---

## Phase 4: On-Chain Reputation System

**Goal**: Track user reliability scores based on completed escrows, dispute outcomes. Scores visible on user profiles and a leaderboard page.

### New contract: `contracts/blocklancer-reputation.clar`

- `user-reputation` map: `principal → {score, completed-escrows, cancelled-escrows, disputes-opened, disputes-lost, on-time-completions, late-completions, total-volume, last-updated}`
- Starting score: 500, max: 1000
- `record-escrow-completion(client, freelancer, amount)` — boosts both parties (+20 client, +25 freelancer)
- `record-dispute-outcome(winner, loser, resolution)` — +5 winner, -30 loser
- `get-reputation(user)` — read-only
- Only authorized contracts (escrow-v3, dispute-v4) can call record functions — controlled via stored principal vars
- Admin `set-escrow-contract`, `set-dispute-contract` to authorize callers

### Backend changes

**New migration: `backend/migrations/004_reputation.sql`**
```sql
CREATE TABLE IF NOT EXISTS user_reputation (
  address VARCHAR(128) UNIQUE NOT NULL,
  score INTEGER NOT NULL DEFAULT 500,
  completed_escrows INTEGER DEFAULT 0,
  disputes_lost INTEGER DEFAULT 0,
  total_volume BIGINT DEFAULT 0,
  ...
);
```

**New files**:
- `backend/src/db/queries/reputation.ts` — upsertReputation, getByAddress, getLeaderboard
- `backend/src/api/routes/reputation.ts` — GET /api/reputation/:address, GET /api/reputation/leaderboard
- `backend/src/chainhook/handlers/reputation-handler.ts`

**Modified files**:
- `backend/src/stacks/contracts.ts` — Add REPUTATION contract
- `backend/src/config.ts` — Add REPUTATION_CONTRACT env var
- `backend/src/api/server.ts` — Register reputation routes
- `backend/src/chainhook/server.ts` — Add `/webhooks/reputation`
- `backend/src/sync/bootstrap.ts` — Compute initial scores from existing escrow/dispute data

### Frontend changes

**New files**:
- `frontend/src/hooks/useReputation.ts` — React Query hook
- `frontend/src/components/reputation/ReputationBadge.tsx` — Score badge (star rating)
- `frontend/src/components/reputation/ReputationCard.tsx` — Full breakdown
- `frontend/src/components/reputation/Leaderboard.tsx` — Top users
- `frontend/src/app/reputation/page.tsx` — Leaderboard page

**Modified files**:
- `frontend/src/lib/apiClient.ts` — Add reputation API functions
- Show reputation badge next to user addresses in escrow/dispute cards

### Verification
1. Deploy reputation contract, set escrow-v3 and dispute-v4 as authorized callers
2. Complete an escrow → check score > 500
3. Open and resolve dispute → verify loser score decreased
4. Check leaderboard page shows ranked users

---

## Phase 5: Emergency Refund After Deadline

**Goal**: If a milestone deadline passes without approval, the client can claim a refund after a grace period (144 blocks / ~1 day).

### Contract changes (already in escrow-v3 from Phase 2)

New function `claim-deadline-refund(contract-id, milestone-id)`:
- Only client can call
- Milestone must be pending or submitted (not approved/rejected)
- `stacks-block-height > deadline + 144` (grace period)
- Transfers milestone amount back to client
- Sets milestone status to `u4` (refunded)
- Updates contract remaining balance

### Backend changes
- `backend/src/chainhook/handlers/escrow-handler.ts` — Add `claim-deadline-refund` case
- `backend/src/stacks/contracts.ts` — Add function name
- Create `backend/src/jobs/deadline-checker.ts` — periodic check for overdue milestones (optional notifications)

### Frontend changes
- Milestone card: Show "Overdue" badge when current block > milestone deadline
- Show "Claim Refund" button for clients when grace period passed
- `frontend/src/hooks/useStacks.ts` — Add `claimDeadlineRefund()` function

### Verification
1. Create escrow with milestone deadline = current block + 5
2. Wait for deadline + 144 blocks
3. Client calls claim-deadline-refund → STX returned
4. Verify milestone status = 4 (refunded) in UI and DB

---

## Phase 6: Job Marketplace

**Goal**: New section where clients post job listings, freelancers apply, accepted applications convert to escrow contracts.

### New contract: `contracts/blocklancer-marketplace.clar`

- `jobs` map: `uint → {poster, title, description, budget-min, budget-max, deadline, status, skills, created-at, escrow-id}`
- `job-applications` map: `{job-id, applicant} → {cover-letter, proposed-amount, proposed-timeline, status, applied-at}`
- Status: open(0), filled(1), cancelled(2). Application status: pending(0), accepted(1), rejected(2)
- Functions: `post-job`, `apply-to-job`, `accept-application`, `cancel-job`
- `accept-application` links to an escrow but does NOT auto-create it (client creates escrow separately, then updates the job with escrow-id)

### Backend changes

**New migration: `backend/migrations/005_marketplace.sql`**
```sql
CREATE TABLE IF NOT EXISTS jobs (...);
CREATE TABLE IF NOT EXISTS job_applications (...);
```

**New files**:
- `backend/src/db/queries/marketplace.ts`
- `backend/src/api/routes/marketplace.ts` — GET /api/jobs, GET /api/jobs/:id, GET /api/jobs/:id/applications, POST search/filter
- `backend/src/chainhook/handlers/marketplace-handler.ts`

**Modified files**:
- `backend/src/stacks/contracts.ts`, `config.ts`, `api/server.ts`, `chainhook/server.ts`, `sync/bootstrap.ts`

### Frontend changes

**New files**:
- `frontend/src/app/jobs/page.tsx` — Job listing with search/filter
- `frontend/src/app/jobs/[id]/page.tsx` — Job detail + applications
- `frontend/src/app/jobs/create/page.tsx` — Post job form
- `frontend/src/components/marketplace/JobCard.tsx`
- `frontend/src/components/marketplace/ApplicationForm.tsx`
- `frontend/src/hooks/useMarketplace.ts`
- `frontend/src/lib/marketplaceContract.ts`

### Verification
1. Post a job on frontend
2. Apply as another user
3. Accept application → create linked escrow
4. Complete milestone flow through the linked escrow

---

## Phase 7: Multi-Token Support

**Goal**: Support SIP-010 fungible tokens in addition to STX for escrow payments.

### Contract changes (in escrow-v3)

- Add SIP-010 trait reference
- Add `token-contract: (optional principal)` to escrow map (none = STX)
- New `create-escrow-token` function that accepts a SIP-010 trait parameter
- Modify payment flows to use `(contract-call? token transfer ...)` instead of `stx-transfer?` when token-contract is set
- Keep existing STX flow unchanged for backward compatibility

### Backend changes
- Migration: Add `token_contract` column to escrows table
- Update all payment-related queries to include token info
- API: Include token type in escrow responses

### Frontend changes
- Token selector dropdown in escrow creation
- Display token name/symbol on all amount fields
- Handle SIP-010 approval flows

### Verification
1. Deploy test SIP-010 token on testnet
2. Create escrow with that token
3. Complete milestone flow → verify token transfers
4. Verify STX escrows still work unchanged

---

## Database Migrations Summary

| Migration | Phase | New Tables | Modified Tables |
|-----------|-------|------------|-----------------|
| 002_platform_fees.sql | 2 | platform_fees, user_tiers | milestones (+fee_amount, +net_amount) |
| 003_pause_state.sql | 3 | contract_pause_state | — |
| 004_reputation.sql | 4 | user_reputation | — |
| 005_marketplace.sql | 6 | jobs, job_applications | — |
| 006_multi_token.sql | 7 | — | escrows (+token_contract) |

---

## New Contract Deployment Summary

| Contract | File | Deploy Phase |
|----------|------|-------------|
| blocklancer-escrow-v3 | `contracts/blocklancer-escrow-v3.clar` | Phase 2 |
| blocklancer-payments-v2 | `contracts/blocklancer-payments-v2.clar` | Phase 2 |
| blocklancer-dispute-v4 | `contracts/blocklancer-dispute-v4.clar` | Phase 2 |
| blocklancer-dao-v2 | `contracts/blocklancer-dao-v2.clar` | Phase 2 |
| blocklancer-reputation | `contracts/blocklancer-reputation.clar` | Phase 4 |
| blocklancer-marketplace | `contracts/blocklancer-marketplace.clar` | Phase 6 |

Note: Phases 2, 3, and 5 all modify the escrow contract. To avoid deploying multiple versions, all escrow changes (fees, pause, deadline refund, resubmission) are bundled into escrow-v3 deployed in Phase 2. The backend/frontend for Phases 3 and 5 are built later but the contract code is already deployed.

---

## Key Files Reference

| File | Role |
|------|------|
| `contracts/blocklancer-escrow.clar` | Current escrow — lines 244-254, 315-325, 370-384 have commented-out fee code |
| `contracts/blocklancer-payments.clar` | Current payments — already has tier system and fee calculation |
| `contracts/blocklancer-dispute.clar` | Current dispute — line 158 hardcodes resolution to client-wins |
| `contracts/blocklancer-dao.clar` | Current DAO — lines 189-264 have placeholder execute functions |
| `backend/src/stacks/contracts.ts` | Contract name constants — must update for v3/v2 names |
| `backend/src/config.ts` | Env vars for contract addresses |
| `backend/src/api/server.ts` | Route registration hub |
| `backend/src/chainhook/server.ts` | Webhook endpoint registration |
| `backend/src/sync/bootstrap.ts` | Bootstrap sync — needs new entity bootstrappers |
| `frontend/src/hooks/useStacks.ts` | Primary hook with all escrow write operations |
| `frontend/src/lib/apiClient.ts` | Backend-first API client |
| `Clarinet.toml` | Contract registration for Clarinet |

---

## Verification Strategy

After each phase:
1. **Contract**: Test with `clarinet test` locally
2. **Deploy**: Deploy to testnet, verify with `stx call-read-only`
3. **Backend**: Run migrations, restart backend, verify API endpoints with `curl`
4. **Frontend**: Start dev server, test flows in browser
5. **Integration**: Full flow from frontend → backend → blockchain → chainhook → backend → frontend

---

## Architecture Principles

1. **Additive only** — No existing feature is replaced or removed
2. **DAO sovereignty** — The DAO remains the sole dispute resolution mechanism
3. **Batch contract deploys** — All contract changes bundled to minimize version proliferation
4. **Static contract calls** — No traits needed; all contracts deployed together with known addresses
5. **Backend-first data** — Frontend reads from backend API, not directly from chain (except write operations)
6. **Progressive enhancement** — Each phase builds on the previous, but phases are independently useful
