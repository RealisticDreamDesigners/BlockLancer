# BlockLancer — Complete Project Reference

> **Purpose**: This document is the single source of truth for new team members and AI assistants working on BlockLancer. Read this before touching any code.

---

## Table of Contents

1. [What Is BlockLancer](#1-what-is-blocklancer)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Smart Contracts (Clarity 4)](#4-smart-contracts-clarity-4)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Data Flow: End-to-End](#7-data-flow-end-to-end)
8. [Feature Status & Phases](#8-feature-status--phases)
9. [Environment & Configuration](#9-environment--configuration)
10. [Deployment & Operations](#10-deployment--operations)
11. [What Needs Work](#11-what-needs-work)
12. [Do Not Touch](#12-do-not-touch)
13. [Conventions & Patterns](#13-conventions--patterns)
14. [Error Code Reference](#14-error-code-reference)
15. [Quick Start for New Contributors](#15-quick-start-for-new-contributors)

---

## 1. What Is BlockLancer

BlockLancer is a **milestone-based escrow platform** built on the **Stacks blockchain** (Bitcoin Layer 2). It allows:

- **Clients** to lock funds in on-chain escrow contracts with defined milestones
- **Freelancers** to submit work per milestone and receive payment upon client approval
- **DAO members** to resolve disputes via supermajority voting when parties disagree
- **A marketplace** where clients post jobs and freelancers apply, with escrow creation upon acceptance

The platform runs on **Stacks testnet** with 7 Clarity smart contracts, a TypeScript/Fastify backend for indexing, and a Next.js frontend.

**Network**: Stacks Testnet
**Deployer Address**: `ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J`
**Stacks Explorer**: https://explorer.hiro.so/?chain=testnet

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Smart Contracts | Clarity 4 | Stacks 2.5+ |
| Backend | Node.js + Fastify + TypeScript | Node 18+ |
| Database | PostgreSQL | 14+ |
| Frontend | Next.js 15 + React 19 + TypeScript | |
| State Management | TanStack React Query + Zustand | v5 / v5 |
| Styling | Tailwind CSS | v3 |
| Wallet | @stacks/connect | v7 |
| Blockchain API | Hiro API (testnet) | |
| Toasts | sonner | v2 |
| Icons | lucide-react | |
| Dev Tools | Clarinet (contract testing) | |

---

## 3. Repository Structure

```
blocklancer-stacks/
├── contracts/                    # Clarity smart contracts (active)
│   ├── blocklancer-escrow-v3.clar       # Escrow v4 (deployed as blocklancer-escrow-v4)
│   ├── blocklancer-dispute-v4.clar      # Dispute v5 (deployed as blocklancer-dispute-v5)
│   ├── blocklancer-dao-v2.clar          # DAO v3 (deployed as blocklancer-dao-v3)
│   ├── blocklancer-payments-v2.clar     # Payments v2
│   ├── blocklancer-reputation.clar      # Reputation system
│   ├── blocklancer-marketplace.clar     # Job marketplace
│   ├── blocklancer-membership.clar      # Committee membership
│   └── backup-v1/                      # Archived v1 contracts (DO NOT USE)
│
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Entry point — starts server, runs bootstrap
│   │   ├── config.ts                   # Environment config (DATABASE_URL, contracts, etc.)
│   │   ├── types/index.ts              # Shared type definitions
│   │   ├── api/
│   │   │   ├── server.ts               # Fastify app creation + route registration
│   │   │   └── routes/
│   │   │       ├── escrows.ts          # GET /api/escrows/:id, /user/:addr, /count
│   │   │       ├── disputes.ts         # GET /api/disputes/:id, /all, /contract/:id
│   │   │       ├── dao.ts              # GET /api/dao/stats, /proposals, /member/:addr
│   │   │       ├── committee.ts        # GET /api/committee/status/:addr, /count
│   │   │       ├── marketplace.ts      # GET /api/jobs, /api/jobs/:id, POST /api/jobs/sync
│   │   │       ├── payments.ts         # GET /api/payments/stats, /user/:addr/tier
│   │   │       ├── reputation.ts       # GET /api/reputation/:addr, /leaderboard
│   │   │       ├── admin.ts            # GET /api/admin/pause-state
│   │   │       ├── health.ts           # GET /api/health
│   │   │       └── pending-tx.ts       # POST /api/pending-tx, GET /api/pending-tx/:txId
│   │   ├── chainhook/
│   │   │   ├── server.ts               # POST /webhooks/{escrow,dispute,dao,...}
│   │   │   ├── state-reader.ts         # Read-only calls to Hiro API (readEscrowState, etc.)
│   │   │   └── handlers/
│   │   │       ├── escrow-handler.ts
│   │   │       ├── dispute-handler.ts
│   │   │       ├── dao-handler.ts
│   │   │       ├── membership-handler.ts
│   │   │       ├── payments-handler.ts
│   │   │       ├── reputation-handler.ts
│   │   │       └── marketplace-handler.ts
│   │   ├── db/
│   │   │   ├── pool.ts                 # PostgreSQL connection pool
│   │   │   ├── migrate.ts              # Migration runner
│   │   │   └── queries/                # One file per domain (escrows.ts, marketplace.ts, etc.)
│   │   ├── stacks/
│   │   │   ├── client.ts               # callReadOnly / callReadOnlyTyped via Hiro API
│   │   │   └── contracts.ts            # Contract address/name constants + function lists
│   │   └── sync/
│   │       └── bootstrap.ts            # Initial sync from chain + periodic polling
│   └── migrations/                     # SQL migration files (002-006)
│
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router pages
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── layout.tsx              # Root layout (metadata, providers)
│   │   │   ├── providers.tsx           # React Query + TransactionContext
│   │   │   ├── dashboard/              # User dashboard + create escrow
│   │   │   ├── contracts/              # Contract list + detail pages
│   │   │   ├── disputes/               # Dispute list + detail pages
│   │   │   ├── dao/                    # DAO proposals + membership
│   │   │   ├── jobs/                   # Marketplace: list, create, detail
│   │   │   ├── reputation/             # Reputation leaderboard
│   │   │   └── admin/                  # Admin dashboard
│   │   ├── components/                 # Organized by domain
│   │   │   ├── layout/                 # AppLayout, Navigation, Breadcrumbs, HealthBanner
│   │   │   ├── marketplace/            # JobCard, ApplicationForm, CreateEscrowFromJobModal
│   │   │   ├── dispute/                # DisputeCard, ProposalCard, CreateProposalModal
│   │   │   ├── payments/               # FeeBreakdown, TierBadge, UpgradeModal
│   │   │   ├── reputation/             # ReputationBadge, ReputationCard, Leaderboard
│   │   │   ├── admin/                  # PauseControl
│   │   │   ├── milestone/              # RejectionReasonModal
│   │   │   └── ui/                     # Button, LoadingSpinner, StacksWalletConnect
│   │   ├── hooks/                      # React hooks (one per domain)
│   │   │   ├── useStacks.ts            # Main hook: wallet, escrow operations
│   │   │   ├── useContractCall.ts      # Unified TX wrapper with toasts + queue
│   │   │   ├── useMarketplace.ts       # Job CRUD, apply, accept/reject
│   │   │   ├── useVoting.ts            # DAO voting
│   │   │   ├── useReputation.ts        # Reputation queries
│   │   │   └── ...                     # usePayments, useCommittee, usePauseState, etc.
│   │   ├── lib/
│   │   │   ├── apiClient.ts            # Backend-first API client with Hiro fallback
│   │   │   ├── blockTime.ts            # Block height ↔ date conversion (42s testnet)
│   │   │   ├── networkConfig.ts        # Network/API URL config
│   │   │   ├── txPoller.ts             # Transaction confirmation polling
│   │   │   ├── contractCallWrapper.ts  # Low-level TX call wrapper
│   │   │   └── daoContract.ts          # DAO-specific contract calls
│   │   ├── contexts/
│   │   │   └── TransactionContext.tsx   # Global TX queue (prevents nonce conflicts)
│   │   └── types/
│   │       └── index.ts                # Frontend type definitions
│   └── .env.local                      # Frontend environment variables
│
├── Clarinet.toml                       # Contract registration for Clarinet
├── deploy-v4.mjs                       # Deployment script for v4 contracts
├── BLOCKLANCER_FEATURE_PLAN.md          # 7-phase feature plan
└── settings/                           # Clarinet deployment settings
```

### IMPORTANT: File Name ≠ Deploy Name

The Clarity contracts have a versioning mismatch that is **intentional**:

| File Name | Deployed As (On-Chain Name) |
|-----------|---------------------------|
| `blocklancer-escrow-v3.clar` | `blocklancer-escrow-v4` |
| `blocklancer-dispute-v4.clar` | `blocklancer-dispute-v5` |
| `blocklancer-dao-v2.clar` | `blocklancer-dao-v3` |
| `blocklancer-payments-v2.clar` | `blocklancer-payments-v2` |
| `blocklancer-reputation.clar` | `blocklancer-reputation` |
| `blocklancer-marketplace.clar` | `blocklancer-marketplace` |
| `blocklancer-membership.clar` | `blocklancer-membership` |

This mapping is configured in `Clarinet.toml`. The file names reflect the source version, while the deploy names reflect the on-chain version. **Stacks contracts are immutable once deployed** — you can never update a deployed contract, only deploy new versions with new names.

---

## 4. Smart Contracts (Clarity 4)

### 4.1 Escrow Contract (`blocklancer-escrow-v4`)

**File**: `contracts/blocklancer-escrow-v3.clar`
**Error prefix**: `u100-u108`

The core of the platform. Holds client funds in escrow with milestone-based release.

**Data structures**:
- `contracts` map: `uint → {client, freelancer, total-amount, remaining-balance, status, created-at, end-date, description}`
- `milestones` map: `{contract-id, milestone-id} → {description, amount, status, deadline, submission-note, rejection-reason}`
- `milestone-counters` map: `uint → uint` (tracks milestone count per escrow)

**Status constants**:
- Contract: active(0), completed(1), disputed(2), cancelled(3)
- Milestone: pending(0), submitted(1), approved(2), rejected(3), refunded(4)

**Key public functions**:
| Function | Who Calls | What It Does |
|----------|-----------|-------------|
| `create-escrow(freelancer, amount, end-date, description)` | Client | Creates escrow, locks STX |
| `add-milestone(contract-id, description, amount, deadline)` | Client | Adds milestone to escrow |
| `submit-milestone(contract-id, milestone-id, note)` | Freelancer | Submits work for approval |
| `approve-milestone(contract-id, milestone-id)` | Client | Approves + pays freelancer (calls payments for fee) |
| `reject-milestone(contract-id, milestone-id, reason)` | Client | Rejects with reason (freelancer can resubmit) |
| `claim-deadline-refund(contract-id, milestone-id)` | Client | Refunds if milestone overdue by 144 blocks (~1 day) |
| `dao-release-payment(contract-id)` | DAO only | Force-releases remaining funds to freelancer |
| `dao-refund-payment(contract-id)` | DAO only | Force-refunds remaining funds to client |

**Cross-contract calls**:
- Calls `blocklancer-payments-v2.calculate-platform-fee` on milestone approval
- Calls `blocklancer-reputation.record-escrow-completion` on milestone approval
- Calls `blocklancer-reputation.record-escrow-cancellation` on deadline refund

**Wiring vars** (set by admin after deployment):
- `dao-contract-principal` — which DAO can call `dao-release-payment` / `dao-refund-payment`
- `payments-contract-principal` — which payments contract to use for fees
- `reputation-contract-principal` — which reputation contract to update

### 4.2 Dispute Contract (`blocklancer-dispute-v5`)

**File**: `contracts/blocklancer-dispute-v4.clar`
**Error prefix**: `u300-u304`

Handles disputes between clients and freelancers, resolved by DAO voting.

**Data structures**:
- `disputes` map: `uint → {contract-id, opened-by, client, freelancer, reason, client-evidence, freelancer-evidence, status, resolution, created-at, resolved-at}`
- `contract-disputes` map: `uint → uint` (one dispute per escrow)

**Status**: open(0), resolved(1), withdrawn(2)
**Resolution**: pending(0), client-wins(1), freelancer-wins(2), split(3)

**Key functions**:
| Function | Who Calls | What It Does |
|----------|-----------|-------------|
| `open-dispute(contract-id, reason)` | Client or Freelancer | Opens dispute, locks escrow |
| `submit-evidence(dispute-id, evidence)` | Dispute participant | Adds evidence text |
| `dao-resolve-dispute(dispute-id, resolution-type)` | DAO only | Resolves + executes escrow action |
| `withdraw-dispute(dispute-id)` | Opener only | Withdraws (if still open) |

**Resolution execution** (inside `dao-resolve-dispute`):
- `client-wins (u1)` → calls escrow `dao-refund-payment`
- `freelancer-wins (u2)` → calls escrow `dao-release-payment`
- `split (u3)` → calls escrow `dao-release-payment` (50/50 split handled at escrow level)

**Cross-contract calls**:
- Calls `blocklancer-escrow-v4.dao-release-payment` / `dao-refund-payment`
- Calls `blocklancer-reputation.record-dispute-opened` / `record-dispute-outcome`

### 4.3 DAO Contract (`blocklancer-dao-v3`)

**File**: `contracts/blocklancer-dao-v2.clar`
**Error prefix**: `u500-u509`

Multisig governance with up to 100 voting members. Resolves disputes and manages escrow overrides.

**Key parameters**:
- Max members: 100
- Supermajority threshold: 70%
- Voting period: 720 blocks (~5 days at ~10 min/block on testnet)
- Early execution: Proposal executes immediately when threshold met (doesn't wait for full period)

**Proposal types**: dispute(0), escrow-release(1), escrow-refund(2), remove-member(3)
**Proposal status**: active(0), passed(1), failed(2), executed(3)
**Vote options**: yes(1), no(2), abstain(3)

**Key functions**:
| Function | Who Calls | What It Does |
|----------|-----------|-------------|
| `admin-add-dao-member(member)` | Admin only | Adds member directly |
| `propose-dispute-resolution(dispute-id, resolution, description)` | DAO member | Creates proposal to resolve dispute |
| `propose-escrow-release(escrow-id, description)` | DAO member | Proposes releasing escrow to freelancer |
| `propose-escrow-refund(escrow-id, description)` | DAO member | Proposes refunding escrow to client |
| `vote-on-proposal(proposal-id, vote)` | DAO member | Casts vote (yes/no/abstain) |
| `finalize-proposal-manual(proposal-id)` | Anyone | Executes proposal if threshold met or period ended |

**Current DAO members** (3):
1. `ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J` (deployer)
2. `ST1RKQJJ25YDYHY6CGHQTTCRQ57FCV2DE0XFNKJK`
3. `ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC`

### 4.4 Payments Contract (`blocklancer-payments-v2`)

**File**: `contracts/blocklancer-payments-v2.clar`
**Error prefix**: `u400-u406`

Platform fee system with free/pro tiers.

**Fee model**:
- **Free tier**: 0% fee, 3 contract limit, 100 STX max per contract
- **Pro tier**: 1.5% fee on milestone approvals, unlimited contracts
- Pro upgrade costs a monthly fee (paid to platform treasury)

**Key functions**: `calculate-platform-fee(user, amount)`, `process-platform-fee(user, amount)`, `upgrade-to-pro()`, `get-platform-stats()`, `get-user-tier-info(user)`

### 4.5 Marketplace Contract (`blocklancer-marketplace`)

**File**: `contracts/blocklancer-marketplace.clar`
**Error prefix**: `u700-u706`

Job board where clients post jobs and freelancers apply.

**Job status**: open(0), filled(1), cancelled(2)
**Application status**: pending(0), accepted(1), rejected(2)

**Key functions**: `post-job(title, desc, budget-min, budget-max, deadline, skills)`, `apply-to-job(job-id, cover-letter, amount, timeline)`, `accept-application(job-id, applicant)`, `reject-application(job-id, applicant)`, `link-escrow-to-job(job-id, escrow-id)`, `cancel-job(job-id)`

**Important**: `accept-application` marks the job as "filled" but does NOT create an escrow. The client must create an escrow separately, then call `link-escrow-to-job` to associate them.

### 4.6 Reputation Contract (`blocklancer-reputation`)

**File**: `contracts/blocklancer-reputation.clar`

Tracks on-chain reliability scores (0-1000, starting at 500).

**Score changes**:
| Event | Score Impact |
|-------|-------------|
| Escrow completion (client) | +20 |
| Escrow completion (freelancer) | +25 |
| Dispute won | +5 |
| Dispute lost | -30 |
| On-time completion | +10 |
| Late completion | -5 |
| Dispute opened | tracked (no immediate score change) |
| Escrow cancellation | -15 (client) |

**Authorization**: Only `blocklancer-escrow-v4` and `blocklancer-dispute-v5` can call record functions (set via `set-escrow-contract` / `set-dispute-contract`).

### 4.7 Membership Contract (`blocklancer-membership`)

**File**: `contracts/blocklancer-membership.clar`

5-member committee that votes to approve new DAO members.

**Flow**: Nominee stakes 100 STX → Committee member proposes → 3/5 approval → Added to DAO via `admin-add-dao-member`.

### 4.8 Cross-Contract Wiring

All contracts reference each other via stored principal variables, set after deployment:

```
escrow-v4:
  ├── dao-contract → dao-v3
  ├── payments-contract → payments-v2
  └── reputation-contract → reputation

dispute-v5:
  ├── dao-contract → dao-v3
  ├── escrow-contract → escrow-v4
  └── reputation-contract → reputation

dao-v3:
  ├── escrow-contract → escrow-v4
  ├── dispute-contract → dispute-v5
  └── membership-contract → membership

reputation:
  ├── escrow-contract → escrow-v4
  └── dispute-contract → dispute-v5
```

These are wired by calling `set-dao-contract`, `set-escrow-contract`, etc. after deployment. The `deploy-v4.mjs` script handles all 12 wiring calls.

---

## 5. Backend Architecture

### 5.1 Entry Point (`backend/src/index.ts`)

Startup sequence:
1. Test database connection
2. Run SQL migrations
3. Create Fastify server with CORS + all route plugins
4. Register chainhook webhook routes
5. Start listening on port 8080
6. Run bootstrap sync (background — reads all on-chain state into DB)
7. Start periodic cleanup (expired pending TXs, every 5 min)
8. Start periodic polling (new jobs/escrows from chain, every 30 sec)

### 5.2 Data Pipeline

There are **two ways** data flows from blockchain to database:

**A. Chainhook Webhooks (real-time)**:
```
On-chain TX → Chainhook node watches contract → POST /webhooks/{type} →
handler reads full state from Hiro API → upserts into PostgreSQL
```
Requires a running Chainhook node with predicates configured.

**B. Bootstrap + Polling Sync (startup + periodic)**:
```
Backend starts → reads total counts from each contract →
iterates through all IDs → reads state from Hiro API → upserts into DB
Polling: every 30 seconds, checks for new items since last sync
```
Works without Chainhook. This is the primary mechanism for testnet development.

### 5.3 State Reader (`backend/src/chainhook/state-reader.ts`)

Reads on-chain state via Hiro API's `call-read-only` endpoint. Uses `@stacks/transactions` to serialize arguments.

**Key functions**:
- `readEscrowState(id)` → calls `get-contract` on escrow
- `readMilestoneState(escrowId, milestoneId)` → calls `get-milestone`
- `readDisputeState(id)` → calls `get-dispute`
- `readProposalState(id)` → calls `get-proposal` on DAO
- `readJobState(id)` → calls `get-job` on marketplace
- `readJobApplicationState(jobId, applicant)` → calls `get-application`
- `readTotalEscrows()` / `readTotalJobs()` / etc. → count functions

### 5.4 Database Schema

**Core tables** (created by base migration):
- `escrows` — on_chain_id, client, freelancer, total_amount, remaining_balance, status, etc.
- `milestones` — escrow_on_chain_id, milestone_index, description, amount, status, etc.
- `disputes` — on_chain_id, contract_id, opened_by, client, freelancer, status, resolution
- `proposals` — on_chain_id, proposer, proposal_type, yes_votes, no_votes, status
- `blockchain_events` — raw event log (tx_id, block_height, function_name, args)
- `sync_state` — tracks bootstrap progress per entity type
- `pending_transactions` — optimistic UI pending TXs

**Feature tables** (migrations 002-006):
- `platform_fees` — fee transactions
- `user_tiers` — address, tier (0=free, 1=pro)
- `contract_pause_state` — per-contract pause status
- `user_reputation` — address, score, completed_escrows, disputes_won, etc.
- `jobs` — on_chain_id, poster, title, description, budget_min/max, deadline, status, skills
- `job_applications` — job_on_chain_id, applicant, cover_letter, proposed_amount, status

### 5.5 API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Backend health check |
| GET | `/api/escrows/:id` | Escrow details + milestones |
| GET | `/api/escrows/user/:address` | User's escrows |
| GET | `/api/escrows/count` | Total escrow count |
| GET | `/api/disputes/:id` | Dispute details |
| GET | `/api/disputes/all` | All disputes |
| GET | `/api/proposals/:id` | Proposal details |
| GET | `/api/proposals/all` | All proposals |
| GET | `/api/dao/stats` | DAO stats (members, threshold) |
| GET | `/api/dao/member/:address` | Member status |
| GET | `/api/committee/status/:address` | Committee member status |
| GET | `/api/jobs` | Jobs list (filterable by status/poster) |
| GET | `/api/jobs/:id` | Job details |
| GET | `/api/jobs/:id/applications` | Job applications |
| POST | `/api/jobs/sync` | Force re-sync jobs from chain |
| GET | `/api/reputation/:address` | User reputation |
| GET | `/api/reputation/leaderboard` | Top users by score |
| GET | `/api/payments/stats` | Platform fee stats |
| GET | `/api/payments/user/:address/tier` | User tier info |
| GET | `/api/admin/pause-state` | All contract pause states |
| POST | `/api/pending-tx` | Submit pending TX for optimistic UI |
| POST | `/webhooks/{type}` | Chainhook webhook endpoints |

---

## 6. Frontend Architecture

### 6.1 App Layout

```
AppLayout (components/layout/AppLayout.tsx)
├── NextTopLoader (orange GitHub-style loading bar)
├── Navigation (sidebar + mobile hamburger)
│   ├── Dashboard, Contracts, Jobs, Disputes, DAO, Reputation, Admin
│   └── StacksWalletConnect button
├── HealthBanner (shows warnings if paused/backend down)
├── PendingTransactions widget (shows confirming TXs)
├── {page content}
└── Toaster (sonner, position="top-right", richColors)
```

### 6.2 Data Fetching Pattern

**Backend-first with Hiro fallback** (`lib/apiClient.ts`):
1. Check if backend is reachable (cached 30 seconds)
2. If yes → fetch from `http://localhost:8080/api/...`
3. If no → fall back to Hiro API read-only calls

**React Query** (`providers.tsx`):
- Default stale time: 15 seconds
- GC time: 5 minutes
- All queries use `queryKey` arrays for cache management
- Mutations invalidate relevant query keys

### 6.3 Transaction Flow

All on-chain write operations go through `useContractCall` hook:

```
User action → useContractCall.execute() →
  validates wallet connected →
  opens Hiro Wallet popup (openContractCall) →
  user signs TX →
  shows "Broadcasting..." toast →
  submits to pending TX backend →
  invalidates React Query cache →
  txPoller monitors confirmation →
  shows success/failure toast
```

**TransactionContext** (`contexts/TransactionContext.tsx`):
- Sequential TX queue — prevents nonce conflicts
- Only one TX broadcasts at a time
- Others wait in queue

### 6.4 Block Height vs Dates

**Critical**: All contracts use `stacks-block-height` for time comparisons, NOT Unix timestamps.

`lib/blockTime.ts` handles conversion:
- **Testnet block time**: ~42 seconds per block
- **Current testnet block height**: ~3.9 million
- `dateToBlockHeight(date)` → converts date to block height
- `blockHeightToTimestamp(blockHeight)` → converts block height to date
- `fetchCurrentBlockHeight()` → fetches real block height from Hiro API (cached 60s)
- `estimateCurrentBlockHeight()` → uses cache or hardcoded anchor fallback
- `formatBlockHeight(blockHeight)` → human-readable date string
- `formatBlockDuration(blocks)` → "~5 days" etc.

**WARNING**: Never pass Unix timestamps where block heights are expected. This caused a critical bug where job posting failed because deadline ~271K was below current block height ~3.9M.

### 6.5 Key Hooks

| Hook | Domain | Key Functions |
|------|--------|--------------|
| `useStacks` | Core | wallet connect, createContract, addMilestone, submitMilestone, approveMilestone, rejectMilestone, claimDeadlineRefund |
| `useContractCall` | TX wrapper | execute() — unified TX flow with toasts + queue |
| `useMarketplace` | Jobs | postJob, applyToJob, acceptApplication, rejectApplication, linkEscrowToJob, cancelJob |
| `useVoting` | DAO | voteOnProposal, finalizeProposal |
| `useDAOAdmin` | DAO Admin | proposeDisputeResolution, proposeEscrowRelease/Refund, adminAddMember |
| `useReputation` | Reputation | useUserReputation, useLeaderboard |
| `usePayments` | Fees | useUserTier, usePlatformStats |
| `useCommittee` | Membership | setCommitteeMember, proposeMember, voteOnMembership |
| `usePauseState` | Admin | pauseContract, unpauseContract |
| `useContractLinking` | Wiring | setDaoContract, setEscrowContract, etc. |

---

## 7. Data Flow: End-to-End

### Example: Client Posts a Job

```
1. Frontend: User fills job form → clicks "Post Job"
2. useMarketplace.postJob() → useContractCall.execute()
3. Hiro Wallet opens → user signs TX
4. TX broadcasts to Stacks testnet mempool
5. Toast: "Broadcasting Post Job..."
6. React Query invalidates ['jobs'] after 2 seconds
7. TX confirms on-chain (~30-60 seconds)

Backend picks it up via polling (every 30 seconds):
8. pollForNewData() → syncLatestJobs()
9. readTotalJobs() from chain → finds new job ID
10. readJobState(id) via Hiro API → gets all job fields
11. upsertJob(state) → saves to PostgreSQL jobs table

Frontend displays it:
12. /jobs page → useQuery(['jobs']) → getJobsFromBackend()
13. Backend returns jobs from PostgreSQL
14. JobCard component renders
```

### Example: Freelancer Applies to Job

```
1. Frontend: /jobs/[id] → clicks "Apply" → fills ApplicationForm
2. useMarketplace.applyToJob() → TX to marketplace contract
3. Backend polling picks up new application count
4. readJobState(id) → updates job.application_count
5. readJobApplicationState(id, applicant) → inserts application into DB
6. Job poster sees application on /jobs/[id] page
```

### Example: Dispute Resolution

```
1. Client or freelancer opens dispute on escrow
2. Dispute contract stores dispute, escrow status → disputed
3. DAO member proposes resolution (propose-dispute-resolution)
4. All DAO members vote (vote-on-proposal)
5. When 70% supermajority reached → finalize-proposal-manual
6. DAO executes resolution → calls escrow (release/refund)
7. Reputation updated for winner/loser
```

---

## 8. Feature Status & Phases

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Milestone Rejection UX** | Complete | Reject button + RejectionReasonModal + resubmission support |
| 2 | **Platform Fee System** | Complete | 1.5% pro tier fee on milestone approval, FeeBreakdown component exists but needs integration into milestone approval flow |
| 3 | **Admin Pause Mechanism** | Complete | PauseControl component on /admin, HealthBanner shows warnings |
| 4 | **On-Chain Reputation** | Complete | ReputationBadge, Leaderboard page, score updates on escrow/dispute events |
| 5 | **Emergency Deadline Refund** | Complete | `claimDeadlineRefund()` in useStacks.ts, needs "Claim Refund" button on overdue milestones in contract detail page |
| 6 | **Job Marketplace** | Complete | Job posting, applications, accept/reject, CreateEscrowFromJobModal, linked escrow display |
| 7 | **Multi-Token Support** | Partial | DB migration exists (006), contract has structure for `token-contract`, no frontend UI yet |

### V4 Contract Upgrade

All contracts were upgraded and deployed as a batch:
- `blocklancer-escrow-v4` — reputation calls, deadline refund, fee integration
- `blocklancer-dispute-v5` — reputation calls, updated escrow reference
- `blocklancer-dao-v3` — 5-day voting period (720 blocks), early execution when threshold met
- 12 cross-contract wiring calls confirmed on testnet
- 3 DAO members migrated to new contract

---

## 9. Environment & Configuration

### Frontend `.env.local`

```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_HIRO_API_KEY=49c6e72fb90e5b04c2f53721cd1f9a59

NEXT_PUBLIC_DAO_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dao-v3
NEXT_PUBLIC_MEMBERSHIP_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-membership
NEXT_PUBLIC_DISPUTE_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dispute-v5
NEXT_PUBLIC_ESCROW_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-escrow-v4
NEXT_PUBLIC_PAYMENTS_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-payments-v2
NEXT_PUBLIC_REPUTATION_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-reputation
NEXT_PUBLIC_MARKETPLACE_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-marketplace

NEXT_PUBLIC_APP_NAME=BlockLancer
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Backend `.env`

```env
DATABASE_URL=postgresql://blocklancer_user:blocklancer_password@localhost:5432/blocklancer
PORT=8080
HOST=0.0.0.0

STACKS_NETWORK=testnet
HIRO_API_URL=https://api.testnet.hiro.so

DEPLOYER_ADDRESS=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J
ESCROW_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-escrow-v4
DISPUTE_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dispute-v5
DAO_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-dao-v3
MEMBERSHIP_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-membership
PAYMENTS_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-payments-v2
REPUTATION_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-reputation
MARKETPLACE_CONTRACT=ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J.blocklancer-marketplace

BOOTSTRAP_BATCH_SIZE=3
BOOTSTRAP_BATCH_DELAY_MS=500
CHAINHOOK_AUTH_TOKEN=blocklancer-secret-token
```

---

## 10. Deployment & Operations

### Running Locally

```bash
# 1. Start PostgreSQL
cd backend && docker compose up -d

# 2. Start backend (auto-runs migrations + bootstrap)
cd backend && npm run dev

# 3. Start frontend
cd frontend && npm run dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Health:   http://localhost:8080/api/health
```

### Deploying New Contracts

Since Stacks contracts are immutable, deploying updates means deploying entirely new contracts:

1. Write new contract version in `contracts/`
2. Add entry to `Clarinet.toml` with correct deploy name
3. Run `clarinet check` to verify syntax
4. Update `deploy-v4.mjs` (or create new deploy script)
5. Run deploy script from `blocklancer-e2e/` directory (needs `@stacks/transactions` and `@stacks/network`)
6. Wire cross-contract references via `set-*-contract` calls
7. Update `.env` files (backend + frontend + e2e)
8. Update hardcoded contract references in code
9. Re-add DAO members to new DAO contract

**Deploy script**: `deploy-v4.mjs` — deploys contracts, wires references, migrates DAO members. Run from `blocklancer-e2e/` directory which has the required node_modules.

### Contract Verification

```bash
# Check contract syntax and types
clarinet check

# Run contract tests (if written)
clarinet test

# Verify on-chain deployment
# Use Hiro Explorer: https://explorer.hiro.so/txid/{tx-hash}?chain=testnet
```

---

## 11. What Needs Work

### High Priority

1. **FeeBreakdown integration**: The `FeeBreakdown` component exists at `frontend/src/components/payments/FeeBreakdown.tsx` but is not shown during milestone approval flow in `frontend/src/app/contracts/[id]/page.tsx`. Should show gross amount, 1.5% fee, net amount to freelancer before user confirms approval.

2. **Deadline Refund button**: `claimDeadlineRefund()` exists in `useStacks.ts` but no button triggers it. In the contract detail page (`frontend/src/app/contracts/[id]/page.tsx`), for each milestone, check if deadline + 144 blocks has passed. If so, show an orange "Claim Refund" button for the client.

3. **Platform Stats on Admin page**: The admin page (`frontend/src/app/admin/page.tsx`) should show total platform fees collected and treasury balance. The `usePayments().getPlatformStats()` hook exists.

### Medium Priority

4. **Multi-Token UI (Phase 7)**: The escrow contract supports an optional `token-contract` field and the DB has the column (`006_multi_token.sql`), but the frontend has no token selector UI. Need a dropdown on the escrow creation page that lets users choose STX or a SIP-010 token contract.

5. **Chainhook setup**: The backend webhook endpoints exist (`/webhooks/*`) but no Chainhook node is running. The 30-second polling sync works as a stopgap. For production, set up Chainhook with predicates for all 7 contracts.

6. **E2E Tests**: The `blocklancer-e2e/` directory exists with test infrastructure but tests need updating for v4 contracts.

### Low Priority

7. **Notification system**: `useNotifications` hook and `NotificationBell` component exist but are not fully integrated.

8. **Activity feed**: `components/activity/` exists but may need refinement.

---

## 12. Do Not Touch

These are stable, working subsystems. Do not modify unless you have a specific, tested reason:

### Contracts
- **`contracts/backup-v1/`** — Archived. Never deploy these. They exist only for reference.
- **Cross-contract wiring** — The 12 `set-*-contract` calls in `deploy-v4.mjs` are carefully ordered. Do not reorder or skip any.
- **Error code ranges** — Escrow (100-108), Dispute (300-304), DAO (500-509), Marketplace (700-706). These are referenced throughout the frontend for error message display. Do not change.

### Backend
- **`backend/src/stacks/client.ts`** — The `callReadOnlyTyped()` function handles argument serialization and response parsing for all read-only calls. It works with all 7 contracts.
- **`backend/src/db/migrate.ts`** — The migration runner. Migrations are additive and idempotent.
- **`backend/src/chainhook/state-reader.ts`** — All read functions follow the same `result.value?.value || result.value || result` pattern to handle different Hiro API response formats. This pattern is correct and handles edge cases.

### Frontend
- **`frontend/src/lib/apiClient.ts`** — The backend-first fallback pattern. `isBackendAvailable()` is intentionally not exported (private, cached 30s). Don't expose it.
- **`frontend/src/contexts/TransactionContext.tsx`** — Sequential TX queue. This prevents nonce conflicts. Don't parallelize TX submissions.
- **`frontend/src/lib/blockTime.ts`** — Uses 42s testnet block time with real API-based block height caching. The anchor fallback (block 3876860 at unix 1772544000) was calibrated from real testnet data.
- **Sonner Toaster** — Already configured in `AppLayout.tsx` at `position="top-right" richColors`. Don't add another Toaster instance.
- **React Query provider** — Already in `providers.tsx`. Don't add another QueryClientProvider.

### Architecture Decisions
- **DAO is the sole dispute resolution mechanism** — No arbiter system, no alternative. The DAO votes on all disputes.
- **Backend-first data fetching** — Frontend always tries backend first, falls back to Hiro API. Don't bypass this pattern.
- **Static contract calls** — Contracts use `contract-call?` with hardcoded contract names, not traits. This is intentional and avoids trait complexity.
- **Additive-only changes** — Never remove existing features. Only add or enhance.

---

## 13. Conventions & Patterns

### Code Style

- **TypeScript strict mode** in both frontend and backend
- **Functional components** with hooks (no class components)
- **Domain-organized** components: `components/{domain}/{Component}.tsx`
- **One hook per domain**: `useMarketplace.ts`, `useVoting.ts`, etc.
- **Database queries**: One file per domain in `backend/src/db/queries/`

### UI Conventions

- **Brand color**: Orange (`orange-600` / `#ea580c`) for primary buttons, links, loading indicators
- **Status badges**: Green (active/open), Blue (completed/filled), Red (disputed/rejected), Gray (cancelled/default). These are semantic — don't change to orange.
- **ReputationBadge tiers**: Gold (800+), Silver (600+), Bronze (400+), Gray (<400). Semantic colors — don't change.
- **Loading states**: Use `Loader2` spinner from lucide-react with `text-orange-600`
- **Breadcrumbs**: Auto-generated from URL path. Use `customLabels` prop for human-readable overrides.
- **Block heights**: Always display with `formatBlockHeight()` / `formatBlockDuration()` from `blockTime.ts`

### Contract Call Pattern

```typescript
// All contract calls go through useContractCall
const { execute } = useContractCall();

const result = await execute({
  callOptions: {
    network,
    contractAddress: contract.address,
    contractName: contract.name,
    functionName: 'function-name',
    functionArgs: [uintCV(value), stringUtf8CV(text)],
    postConditions: [],
    postConditionMode: PostConditionMode.Allow,
  },
  actionLabel: 'Human Readable Action',
  onBroadcast: () => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['relevantKey'] });
  },
});
```

### Adding a New Feature Checklist

1. **Contract**: Write Clarity contract (if needed) → add to `Clarinet.toml` → `clarinet check`
2. **Migration**: Create SQL migration in `backend/migrations/` → auto-runs on backend start
3. **DB Queries**: Add query file in `backend/src/db/queries/`
4. **Handler**: Add chainhook handler in `backend/src/chainhook/handlers/`
5. **State Reader**: Add read functions in `backend/src/chainhook/state-reader.ts`
6. **API Route**: Create route in `backend/src/api/routes/` → register in `server.ts`
7. **Bootstrap**: Add bootstrap function in `backend/src/sync/bootstrap.ts`
8. **API Client**: Add fetch functions in `frontend/src/lib/apiClient.ts`
9. **Hook**: Create hook in `frontend/src/hooks/`
10. **Components**: Create components in `frontend/src/components/{domain}/`
11. **Page**: Create page in `frontend/src/app/{route}/page.tsx`
12. **Navigation**: Add link in `frontend/src/components/layout/Navigation.tsx`

---

## 14. Error Code Reference

### Escrow Contract (u100-u108)
| Code | Constant | Meaning |
|------|----------|---------|
| u100 | err-owner-only | Only contract owner can call |
| u101 | err-not-authorized | Caller not client/freelancer |
| u102 | err-invalid-state | Wrong contract/milestone status |
| u103 | err-insufficient-funds | Not enough balance |
| u104 | err-invalid-milestone | Milestone doesn't exist |
| u105 | err-invalid-amount | Amount is 0 or invalid |
| u106 | err-deadline-exceeded | Past the deadline |
| u107 | err-milestone-amount-mismatch | Milestone total != escrow amount |
| u108 | err-invalid-time-parameters | Bad time/deadline values |

### Dispute Contract (u300-u304)
| Code | Constant | Meaning |
|------|----------|---------|
| u300 | err-owner-only | Only contract owner |
| u301 | err-not-authorized | Not a dispute participant |
| u302 | err-invalid-state | Wrong dispute status |
| u303 | err-dispute-not-found | Dispute ID doesn't exist |
| u304 | err-already-disputed | Escrow already has a dispute |

### DAO Contract (u500-u509)
| Code | Constant | Meaning |
|------|----------|---------|
| u500 | err-admin-only | Only admin |
| u501 | err-not-member | Caller not a DAO member |
| u502 | err-proposal-not-found | Proposal doesn't exist |
| u503 | err-voting-ended | Voting period is over |
| u504 | err-already-voted | Already voted on this proposal |
| u505 | err-insufficient-votes | Not enough votes to pass |
| u506 | err-dao-full | 100 member limit reached |
| u507 | err-invalid-proposal-type | Unknown proposal type |
| u508 | err-proposal-already-executed | Proposal already finalized |
| u509 | err-member-already-exists | Member already in DAO |

### Marketplace Contract (u700-u706)
| Code | Constant | Meaning |
|------|----------|---------|
| u700 | err-owner-only | Only contract owner |
| u701 | err-not-authorized | Not the job poster |
| u702 | err-invalid-state | Wrong job/application status |
| u703 | err-job-not-found | Job ID doesn't exist |
| u704 | err-already-applied | Already applied to this job |
| u705 | err-application-not-found | Application doesn't exist |
| u706 | err-invalid-budget | Budget is 0 or min > max |

### Shared
| Code | Meaning |
|------|---------|
| u999 | Contract is paused |

---

## 15. Quick Start for New Contributors

### 1. Clone and Install

```bash
git clone <repo-url>
cd blocklancer-stacks

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Set Up Database

```bash
cd backend
docker compose up -d  # Starts PostgreSQL
# Migrations run automatically when backend starts
```

### 3. Configure Environment

Frontend `.env.local` and backend `.env` are already configured for testnet. If they're missing, copy from the examples in Section 9 above.

### 4. Run

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 5. Get Testnet STX

1. Install Hiro Wallet browser extension
2. Create/import a wallet
3. Switch to testnet
4. Get testnet STX from https://explorer.hiro.so/sandbox/faucet?chain=testnet

### 6. Test the Flow

1. Go to http://localhost:3000
2. Connect wallet
3. Post a job on /jobs/create
4. Wait ~30 seconds for backend polling to index it
5. See it on /jobs page
6. Create an escrow on /dashboard/create
7. Add milestones, submit work, approve

### 7. Verify Backend Health

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/jobs
curl http://localhost:8080/api/escrows/count
```

### 8. Type-Check Before Committing

```bash
cd frontend && npx tsc --noEmit
cd ../backend && npx tsc --noEmit
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     STACKS TESTNET                          │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  escrow-v4   │ │ dispute-v5   │ │   dao-v3     │       │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘       │
│         │                │                │                 │
│  ┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐       │
│  │ payments-v2  │ │  reputation  │ │ marketplace  │       │
│  └──────────────┘ └──────────────┘ └──────┬───────┘       │
│                                           │                 │
│  ┌──────────────┐                         │                 │
│  │  membership  │                         │                 │
│  └──────────────┘                         │                 │
└───────────────────────────────────────────┼─────────────────┘
                                            │
                    ┌───────────────────────┐│
                    │     HIRO API          ││ read-only calls
                    │  api.testnet.hiro.so  │◄┘
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │     BACKEND           │
                    │  Fastify :8080        │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │  State Reader   │  │  Reads on-chain state
                    │  │  (Hiro API)     │  │  via callReadOnlyTyped()
                    │  └────────┬────────┘  │
                    │           │           │
                    │  ┌────────▼────────┐  │
                    │  │  PostgreSQL DB  │  │  Indexed state
                    │  └────────┬────────┘  │
                    │           │           │
                    │  ┌────────▼────────┐  │
                    │  │  API Routes     │  │  REST endpoints
                    │  └────────┬────────┘  │
                    └───────────┼───────────┘
                                │
                    ┌───────────▼───────────┐
                    │     FRONTEND          │
                    │  Next.js :3000        │
                    │                       │
                    │  apiClient.ts         │  Backend-first fetch
                    │  React Query          │  Cache + invalidation
                    │  useContractCall      │  TX wrapper + toasts
                    │  @stacks/connect      │  Wallet integration
                    └───────────────────────┘
```

---

*Last updated: March 2026*
*Contract versions: escrow-v4, dispute-v5, dao-v3, payments-v2, reputation, marketplace, membership*
*Testnet deployer: ST30M31FNAKNX5EJKV10V7SJSE07VVDFFZHZHGE0J*
