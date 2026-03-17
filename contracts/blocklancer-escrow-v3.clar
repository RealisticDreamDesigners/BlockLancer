;; BlockLancer Core Escrow Contract v3
;; @version clarity-4
;; Handles contract creation, milestone management, and escrow logic
;; Upgrades from v2: pause mechanism, resubmission support, fee integration,
;; deadline refund claims, multi-token support structure, is-standard principal validation

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-authorized (err u101))
(define-constant err-invalid-state (err u102))
(define-constant err-insufficient-funds (err u103))
(define-constant err-invalid-milestone (err u104))
(define-constant err-invalid-amount (err u105))
(define-constant err-deadline-exceeded (err u106))
(define-constant err-milestone-amount-mismatch (err u107))
(define-constant err-invalid-time-parameters (err u108))
(define-constant err-sbtc-transfer-failed (err u109))

;; sBTC Token Contract Reference (mainnet; Clarinet remaps for devnet/testnet)
(define-constant sbtc-token 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Contract Status Constants
(define-constant status-active u0)
(define-constant status-completed u1)
(define-constant status-disputed u2)
(define-constant status-cancelled u3)

;; Milestone Status Constants
(define-constant milestone-pending u0)
(define-constant milestone-submitted u1)
(define-constant milestone-approved u2)
(define-constant milestone-rejected u3)
(define-constant milestone-refunded u4)

;; Deadline refund grace period (~1 day in blocks)
(define-constant grace-period-blocks u144)

;; Data Variables
(define-data-var next-contract-id uint u1)
(define-data-var dao-contract-principal (optional principal) none)
(define-data-var payments-contract-principal (optional principal) none)
(define-data-var reputation-contract-principal (optional principal) none)
(define-data-var contract-paused bool false)

;; Data Maps
(define-map contracts
  uint
  {
    client: principal,
    freelancer: principal,
    total-amount: uint,
    remaining-balance: uint,
    status: uint,
    created-at: uint,
    end-date: uint,
    description: (string-utf8 500)
  }
)

(define-map milestones
  {contract-id: uint, milestone-id: uint}
  {
    description: (string-utf8 300),
    amount: uint,
    status: uint,
    deadline: uint,
    submission-note: (optional (string-utf8 500)),
    rejection-reason: (optional (string-utf8 500))
  }
)

(define-map milestone-counters uint uint)

;; Events
(define-map contract-events
  uint
  {
    event-type: (string-ascii 32),
    timestamp: uint,
    details: (string-utf8 200)
  }
)

;; Multi-token support: none = STX, (some principal) = SIP-010 token
(define-map contract-token-type uint (optional principal))

;; Private Functions

(define-private (assert-not-paused)
  (ok (asserts! (not (var-get contract-paused)) (err u999)))
)

(define-private (is-client (contract-id uint) (user principal))
  (match (map-get? contracts contract-id)
    contract-data (is-eq (get client contract-data) user)
    false
  )
)

(define-private (is-freelancer (contract-id uint) (user principal))
  (match (map-get? contracts contract-id)
    contract-data (is-eq (get freelancer contract-data) user)
    false
  )
)

(define-private (is-contract-active (contract-id uint))
  (match (map-get? contracts contract-id)
    contract-data (is-eq (get status contract-data) status-active)
    false
  )
)

;; Check whether an escrow uses sBTC
(define-private (is-sbtc-escrow (contract-id uint))
  (is-some (default-to none (map-get? contract-token-type contract-id)))
)

;; Release payment from escrow supporting both STX and sBTC.
;; Transfers net-amount to recipient and fee-amount to treasury.
(define-private (release-payment-with-fee
    (contract-id uint)
    (total-amount uint)
    (fee-amount uint)
    (recipient principal)
    (treasury principal))
  (let ((net-amount (- total-amount fee-amount)))
    (if (is-sbtc-escrow contract-id)
      (if (> fee-amount u0)
        (begin
          (try! (as-contract (begin
            (try! (contract-call? sbtc-token transfer net-amount tx-sender recipient none))
            (contract-call? sbtc-token transfer fee-amount tx-sender treasury none)
          )))
          (ok true)
        )
        (begin
          (try! (as-contract
            (contract-call? sbtc-token transfer total-amount tx-sender recipient none)
          ))
          (ok true)
        )
      )
      (if (> fee-amount u0)
        (begin
          (try! (as-contract (begin
            (try! (stx-transfer? net-amount tx-sender recipient))
            (stx-transfer? fee-amount tx-sender treasury)
          )))
          (ok true)
        )
        (begin
          (try! (as-contract
            (stx-transfer? total-amount tx-sender recipient)
          ))
          (ok true)
        )
      )
    )
  )
)

;; Refund tokens from escrow (no fee deduction).
(define-private (refund-from-escrow (contract-id uint) (amount uint) (recipient principal))
  (if (is-sbtc-escrow contract-id)
    (as-contract
      (contract-call? sbtc-token transfer amount tx-sender recipient none))
    (as-contract
      (stx-transfer? amount tx-sender recipient))
  )
)

(define-private (get-total-milestone-amount (contract-id uint))
  (let ((milestone-count (default-to u0 (map-get? milestone-counters contract-id))))
    (fold + (map get-milestone-amount (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10)) u0)
  )
)

(define-private (get-milestone-amount (milestone-id uint))
  u0 ;; Simplified for now - would need proper iteration
)

;; Public Functions

;; Pause mechanism (owner only)
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set contract-paused paused)
    (ok true)
  )
)

;; Create a new escrow contract
(define-public (create-escrow
    (client principal)
    (freelancer principal)
    (description (string-utf8 500))
    (end-date uint)
    (total-amount uint))
  (let
    (
      (contract-id (var-get next-contract-id))
      (current-time stacks-block-height)
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (is-standard client) err-not-authorized)
    (asserts! (is-standard freelancer) err-not-authorized)
    (asserts! (> end-date current-time) err-invalid-time-parameters)
    (asserts! (> total-amount u0) err-invalid-amount)
    (asserts! (not (is-eq client freelancer)) err-not-authorized)

    ;; Transfer payment to contract
    (try! (stx-transfer? total-amount tx-sender (as-contract tx-sender)))

    ;; Create contract record
    (map-set contracts contract-id
      {
        client: client,
        freelancer: freelancer,
        total-amount: total-amount,
        remaining-balance: total-amount,
        status: status-active,
        created-at: current-time,
        end-date: end-date,
        description: description
      }
    )

    ;; Initialize milestone counter
    (map-set milestone-counters contract-id u0)

    ;; Set default token type (STX = none)
    (map-set contract-token-type contract-id none)

    ;; Increment contract ID
    (var-set next-contract-id (+ contract-id u1))

    (ok contract-id)
  )
)

;; Create an escrow funded with sBTC instead of STX
(define-public (create-escrow-sbtc
    (client principal)
    (freelancer principal)
    (description (string-utf8 500))
    (end-date uint)
    (total-amount uint))
  (let
    (
      (contract-id (var-get next-contract-id))
      (current-time stacks-block-height)
      (escrow-principal (as-contract tx-sender))
    )
    (try! (assert-not-paused))
    (asserts! (is-standard client) err-not-authorized)
    (asserts! (is-standard freelancer) err-not-authorized)
    (asserts! (> end-date current-time) err-invalid-time-parameters)
    (asserts! (> total-amount u0) err-invalid-amount)
    (asserts! (not (is-eq client freelancer)) err-not-authorized)

    ;; Transfer sBTC from caller to escrow contract
    (unwrap! (contract-call? sbtc-token transfer total-amount tx-sender escrow-principal none)
             err-sbtc-transfer-failed)

    ;; Create contract record
    (map-set contracts contract-id
      {
        client: client,
        freelancer: freelancer,
        total-amount: total-amount,
        remaining-balance: total-amount,
        status: status-active,
        created-at: current-time,
        end-date: end-date,
        description: description
      }
    )

    (map-set milestone-counters contract-id u0)

    ;; Mark this escrow as sBTC-funded
    (map-set contract-token-type contract-id (some sbtc-token))

    (var-set next-contract-id (+ contract-id u1))

    (ok contract-id)
  )
)

;; Add a milestone to an existing contract
(define-public (add-milestone
    (contract-id uint)
    (description (string-utf8 300))
    (amount uint)
    (deadline uint))
  (let
    (
      (contract-data (unwrap! (map-get? contracts contract-id) err-invalid-state))
      (current-milestone-count (default-to u0 (map-get? milestone-counters contract-id)))
      (new-milestone-id (+ current-milestone-count u1))
      (current-time (- stacks-block-height u1))
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (is-client contract-id tx-sender) err-not-authorized)
    (asserts! (is-contract-active contract-id) err-invalid-state)
    (asserts! (> deadline current-time) err-deadline-exceeded)
    (asserts! (< deadline (get end-date contract-data)) err-invalid-time-parameters)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (<= amount (get remaining-balance contract-data)) err-insufficient-funds)

    ;; Create milestone
    (map-set milestones {contract-id: contract-id, milestone-id: new-milestone-id}
      {
        description: description,
        amount: amount,
        status: milestone-pending,
        deadline: deadline,
        submission-note: none,
        rejection-reason: none
      }
    )

    ;; Update milestone counter
    (map-set milestone-counters contract-id new-milestone-id)

    (ok new-milestone-id)
  )
)

;; Submit a milestone as completed (freelancer)
;; Supports resubmission of rejected milestones
(define-public (submit-milestone
    (contract-id uint)
    (milestone-id uint)
    (submission-note (string-utf8 500)))
  (let
    (
      (milestone-key {contract-id: contract-id, milestone-id: milestone-id})
      (milestone-data (unwrap! (map-get? milestones milestone-key) err-invalid-milestone))
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (is-freelancer contract-id tx-sender) err-not-authorized)
    (asserts! (is-contract-active contract-id) err-invalid-state)
    (asserts! (or (is-eq (get status milestone-data) milestone-pending) (is-eq (get status milestone-data) milestone-rejected)) err-invalid-state)

    ;; Update milestone status
    (map-set milestones milestone-key
      (merge milestone-data {
        status: milestone-submitted,
        submission-note: (some submission-note)
      })
    )

    (ok true)
  )
)

;; Approve a milestone and release payment (client)
(define-public (approve-milestone
    (contract-id uint)
    (milestone-id uint))
  (let
    (
      (milestone-key {contract-id: contract-id, milestone-id: milestone-id})
      (milestone-data (unwrap! (map-get? milestones milestone-key) err-invalid-milestone))
      (contract-data (unwrap! (map-get? contracts contract-id) err-invalid-state))
      (payment-amount (get amount milestone-data))
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (is-client contract-id tx-sender) err-not-authorized)
    (asserts! (is-contract-active contract-id) err-invalid-state)
    (asserts! (is-eq (get status milestone-data) milestone-submitted) err-invalid-state)

    ;; Release payment to freelancer with platform fee integration
    (let (
      (fee-amount (contract-call? .blocklancer-payments-v2 calculate-platform-fee (get freelancer contract-data) payment-amount))
      (treasury (contract-call? .blocklancer-payments-v2 get-treasury))
    )
      (try! (release-payment-with-fee contract-id payment-amount fee-amount (get freelancer contract-data) treasury))
    )

    ;; Update milestone status
    (map-set milestones milestone-key
      (merge milestone-data {status: milestone-approved})
    )

    ;; Update contract remaining balance
    (map-set contracts contract-id
      (merge contract-data {
        remaining-balance: (- (get remaining-balance contract-data) payment-amount)
      })
    )

    ;; Record reputation for escrow completion (best-effort, don't abort on failure)
    (match (contract-call? .blocklancer-reputation record-escrow-completion
      (get client contract-data) (get freelancer contract-data) payment-amount)
      ok-val true err-val true)

    ;; Check if contract is completed
    (try! (check-contract-completion contract-id))

    (ok true)
  )
)

;; Reject a milestone submission (client)
(define-public (reject-milestone
    (contract-id uint)
    (milestone-id uint)
    (rejection-reason (string-utf8 500)))
  (let
    (
      (milestone-key {contract-id: contract-id, milestone-id: milestone-id})
      (milestone-data (unwrap! (map-get? milestones milestone-key) err-invalid-milestone))
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (is-client contract-id tx-sender) err-not-authorized)
    (asserts! (is-contract-active contract-id) err-invalid-state)
    (asserts! (is-eq (get status milestone-data) milestone-submitted) err-invalid-state)

    ;; Update milestone status
    (map-set milestones milestone-key
      (merge milestone-data {
        status: milestone-rejected,
        rejection-reason: (some rejection-reason)
      })
    )

    (ok true)
  )
)

;; DAO-controlled payment release (only for dispute resolution)
(define-public (dao-release-payment (contract-id uint))
  (let
    (
      (contract-data (unwrap! (map-get? contracts contract-id) err-invalid-state))
      (payment-amount (get remaining-balance contract-data))
      (freelancer (get freelancer contract-data))
    )
    (try! (assert-not-paused))
    ;; Only DAO can call this
    (asserts! (is-eq tx-sender (unwrap! (var-get dao-contract-principal) err-not-authorized)) err-not-authorized)
    (asserts! (is-contract-active contract-id) err-invalid-state)
    (asserts! (> payment-amount u0) err-insufficient-funds)

    ;; Release payment to freelancer with platform fee integration
    (let (
      (fee-amount (contract-call? .blocklancer-payments-v2 calculate-platform-fee freelancer payment-amount))
      (treasury (contract-call? .blocklancer-payments-v2 get-treasury))
    )
      (try! (release-payment-with-fee contract-id payment-amount fee-amount freelancer treasury))
    )

    ;; Update contract status
    (map-set contracts contract-id
      (merge contract-data {
        remaining-balance: u0,
        status: status-completed
      })
    )

    (ok true)
  )
)

;; DAO-controlled payment refund (only for dispute resolution)
(define-public (dao-refund-payment (contract-id uint))
  (let
    (
      (contract-data (unwrap! (map-get? contracts contract-id) err-invalid-state))
      (refund-amount (get remaining-balance contract-data))
      (client (get client contract-data))
    )
    (try! (assert-not-paused))
    ;; Only DAO can call this
    (asserts! (is-eq tx-sender (unwrap! (var-get dao-contract-principal) err-not-authorized)) err-not-authorized)
    (asserts! (is-contract-active contract-id) err-invalid-state)
    (asserts! (> refund-amount u0) err-insufficient-funds)

    ;; Refund to client (no platform fees on refunds)
    (try! (refund-from-escrow contract-id refund-amount client))

    ;; Update contract status
    (map-set contracts contract-id
      (merge contract-data {
        remaining-balance: u0,
        status: status-cancelled
      })
    )

    (ok true)
  )
)

;; Claim deadline refund for overdue milestones (client)
(define-public (claim-deadline-refund (contract-id uint) (milestone-id uint))
  (let
    (
      (milestone-key {contract-id: contract-id, milestone-id: milestone-id})
      (milestone-data (unwrap! (map-get? milestones milestone-key) err-invalid-milestone))
      (contract-data (unwrap! (map-get? contracts contract-id) err-invalid-state))
      (refund-amount (get amount milestone-data))
    )
    (try! (assert-not-paused))
    ;; Only client can claim
    (asserts! (is-client contract-id tx-sender) err-not-authorized)
    (asserts! (is-contract-active contract-id) err-invalid-state)
    ;; Must be pending or submitted (not approved, rejected, or already refunded)
    (asserts! (or (is-eq (get status milestone-data) milestone-pending) (is-eq (get status milestone-data) milestone-submitted)) err-invalid-state)
    ;; Deadline + grace period must have passed
    (asserts! (> stacks-block-height (+ (get deadline milestone-data) grace-period-blocks)) err-deadline-exceeded)
    ;; Must have sufficient balance
    (asserts! (>= (get remaining-balance contract-data) refund-amount) err-insufficient-funds)

    ;; Transfer refund to client
    (try! (refund-from-escrow contract-id refund-amount (get client contract-data)))

    ;; Update milestone status to refunded
    (map-set milestones milestone-key
      (merge milestone-data {status: milestone-refunded})
    )

    ;; Update contract remaining balance
    (map-set contracts contract-id
      (merge contract-data {
        remaining-balance: (- (get remaining-balance contract-data) refund-amount)
      })
    )

    ;; Record reputation for escrow cancellation (best-effort)
    (match (contract-call? .blocklancer-reputation record-escrow-cancellation
      (get client contract-data))
      ok-val true err-val true)

    (ok true)
  )
)

;; Admin functions to set contract references
(define-public (set-dao-contract (dao-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set dao-contract-principal (some dao-contract))
    (ok true)
  )
)

(define-public (set-payments-contract (payments-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set payments-contract-principal (some payments-contract))
    (ok true)
  )
)

(define-public (set-reputation-contract (reputation-contract principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set reputation-contract-principal (some reputation-contract))
    (ok true)
  )
)

;; Check if contract is completed and update status
(define-private (check-contract-completion (contract-id uint))
  (let
    (
      (contract-data (unwrap! (map-get? contracts contract-id) err-invalid-state))
      (milestone-count (default-to u0 (map-get? milestone-counters contract-id)))
    )
    ;; If remaining balance is 0 or very small, mark as completed
    (if (<= (get remaining-balance contract-data) u100)
      (begin
        (map-set contracts contract-id
          (merge contract-data {status: status-completed})
        )
        ;; Return any dust amount to client
        (if (> (get remaining-balance contract-data) u0)
          (refund-from-escrow contract-id (get remaining-balance contract-data) (get client contract-data))
          (ok true)
        )
      )
      (ok true)
    )
  )
)

;; Read-only functions

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused)
)

;; Get contract details
(define-read-only (get-contract (contract-id uint))
  (map-get? contracts contract-id)
)

;; Get milestone details
(define-read-only (get-milestone (contract-id uint) (milestone-id uint))
  (map-get? milestones {contract-id: contract-id, milestone-id: milestone-id})
)

;; Get milestone count for a contract
(define-read-only (get-milestone-count (contract-id uint))
  (default-to u0 (map-get? milestone-counters contract-id))
)

;; Check if user is authorized for contract
(define-read-only (is-authorized (contract-id uint) (user principal))
  (or (is-client contract-id user) (is-freelancer contract-id user))
)

;; Get the next contract ID (tells us total contracts)
(define-read-only (get-next-contract-id)
  (var-get next-contract-id)
)

;; Get total contracts created so far
(define-read-only (get-total-contracts)
  (- (var-get next-contract-id) u1)
)

;; Get contract token type (none = STX, some = SIP-010 token principal)
(define-read-only (get-contract-token (contract-id uint))
  (default-to none (map-get? contract-token-type contract-id))
)
