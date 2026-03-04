;; BlockLancer Dispute Resolution Contract v4
;; @version clarity-4
;; Handles dispute creation, resolution with escrow integration, and pause mechanism

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-not-authorized (err u301))
(define-constant err-invalid-state (err u302))
(define-constant err-dispute-not-found (err u303))
(define-constant err-already-disputed (err u304))

;; Dispute Status Constants
(define-constant dispute-open u0)
(define-constant dispute-resolved u1)
(define-constant dispute-withdrawn u2)

;; Resolution Constants
(define-constant resolution-pending u0)
(define-constant resolution-client-wins u1)
(define-constant resolution-freelancer-wins u2)
(define-constant resolution-split u3)

;; Data Variables
(define-data-var next-dispute-id uint u1)
(define-data-var dao-contract-principal (optional principal) none)
(define-data-var escrow-contract-principal (optional principal) none)
(define-data-var reputation-contract-principal (optional principal) none)
(define-data-var contract-paused bool false)

;; Data Maps
(define-map disputes
  uint
  {
    contract-id: uint,
    opened-by: principal,
    client: principal,
    freelancer: principal,
    reason: (string-utf8 500),
    client-evidence: (optional (string-utf8 1000)),
    freelancer-evidence: (optional (string-utf8 1000)),
    status: uint,
    resolution: uint,
    created-at: uint,
    resolved-at: (optional uint)
  }
)

(define-map contract-disputes uint uint) ;; Maps contract-id to dispute-id

;; Private Functions

(define-private (assert-not-paused)
  (ok (asserts! (not (var-get contract-paused)) (err u999)))
)

(define-private (is-dispute-participant (dispute-id uint) (user principal))
  (match (map-get? disputes dispute-id)
    dispute-data (or
      (is-eq (get client dispute-data) user)
      (is-eq (get freelancer dispute-data) user)
    )
    false
  )
)

(define-private (get-dispute-status (dispute-id uint))
  (match (map-get? disputes dispute-id)
    dispute-data (get status dispute-data)
    dispute-resolved ;; Return resolved if not found
  )
)

;; Execute dispute resolution by calling escrow contract
(define-private (execute-dispute-resolution (dispute-id uint) (resolution-type uint))
  (let
    (
      (dispute-data (unwrap! (map-get? disputes dispute-id) err-dispute-not-found))
      (contract-id (get contract-id dispute-data))
    )
    (if (is-eq resolution-type resolution-client-wins)
      ;; Refund to client
      (contract-call? .blocklancer-escrow-v4 dao-refund-payment contract-id)
      (if (is-eq resolution-type resolution-freelancer-wins)
        ;; Release to freelancer
        (contract-call? .blocklancer-escrow-v4 dao-release-payment contract-id)
        ;; Split case - release to freelancer for now (simplified)
        (contract-call? .blocklancer-escrow-v4 dao-release-payment contract-id)
      )
    )
  )
)

;; Public Functions

;; Pause mechanism
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set contract-paused paused)
    (ok true)
  )
)

;; Open a dispute for a contract
(define-public (open-dispute
    (contract-id uint)
    (client principal)
    (freelancer principal)
    (reason (string-utf8 500)))
  (let
    (
      (dispute-id (var-get next-dispute-id))
      (current-time stacks-block-height)
      (existing-dispute (map-get? contract-disputes contract-id))
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (or (is-eq tx-sender client) (is-eq tx-sender freelancer)) err-not-authorized)
    (asserts! (is-none existing-dispute) err-already-disputed)

    ;; Create dispute record
    (map-set disputes dispute-id
      {
        contract-id: contract-id,
        opened-by: tx-sender,
        client: client,
        freelancer: freelancer,
        reason: reason,
        client-evidence: none,
        freelancer-evidence: none,
        status: dispute-open,
        resolution: resolution-pending,
        created-at: current-time,
        resolved-at: none
      }
    )

    ;; Map contract to dispute
    (map-set contract-disputes contract-id dispute-id)

    ;; Increment dispute ID
    (var-set next-dispute-id (+ dispute-id u1))

    ;; Record reputation for dispute opened (best-effort)
    (match (contract-call? .blocklancer-reputation record-dispute-opened tx-sender)
      ok-val true err-val true)

    (ok dispute-id)
  )
)

;; Submit evidence for a dispute
(define-public (submit-evidence
    (dispute-id uint)
    (evidence (string-utf8 1000)))
  (let
    (
      (dispute-data (unwrap! (map-get? disputes dispute-id) err-dispute-not-found))
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (is-dispute-participant dispute-id tx-sender) err-not-authorized)
    (asserts! (is-eq (get status dispute-data) dispute-open) err-invalid-state)

    ;; Update evidence based on who is submitting
    (if (is-eq tx-sender (get client dispute-data))
      ;; Client submitting evidence
      (map-set disputes dispute-id
        (merge dispute-data {client-evidence: (some evidence)})
      )
      ;; Freelancer submitting evidence
      (map-set disputes dispute-id
        (merge dispute-data {freelancer-evidence: (some evidence)})
      )
    )

    (ok true)
  )
)

;; Resolve dispute (DAO only) - accepts resolution type parameter
(define-public (dao-resolve-dispute
    (dispute-id uint)
    (dao-proposal-id uint)
    (resolution-type uint))
  (let
    (
      (dispute-data (unwrap! (map-get? disputes dispute-id) err-dispute-not-found))
      (current-time stacks-block-height)
    )
    (try! (assert-not-paused))
    ;; Only DAO contract can call this
    (asserts! (is-eq tx-sender (unwrap! (var-get dao-contract-principal) err-not-authorized)) err-not-authorized)
    (asserts! (is-eq (get status dispute-data) dispute-open) err-invalid-state)
    ;; Validate resolution type
    (asserts! (or (is-eq resolution-type resolution-client-wins)
                  (is-eq resolution-type resolution-freelancer-wins)
                  (is-eq resolution-type resolution-split)) err-invalid-state)

    ;; Update dispute with resolution
    (map-set disputes dispute-id
      (merge dispute-data {
        status: dispute-resolved,
        resolution: resolution-type,
        resolved-at: (some current-time)
      })
    )

    ;; Execute escrow action based on resolution using static contract calls
    (try! (execute-dispute-resolution dispute-id resolution-type))

    ;; Record reputation for dispute outcome (best-effort)
    (if (is-eq resolution-type resolution-client-wins)
      ;; Client wins: client is winner, freelancer is loser
      (match (contract-call? .blocklancer-reputation record-dispute-outcome
        (get client dispute-data) (get freelancer dispute-data) resolution-type)
        ok-val true err-val true)
      (if (is-eq resolution-type resolution-freelancer-wins)
        ;; Freelancer wins: freelancer is winner, client is loser
        (match (contract-call? .blocklancer-reputation record-dispute-outcome
          (get freelancer dispute-data) (get client dispute-data) resolution-type)
          ok-val true err-val true)
        ;; Split: record both as partial outcomes
        (begin
          (match (contract-call? .blocklancer-reputation record-dispute-outcome
            (get client dispute-data) (get freelancer dispute-data) resolution-type)
            ok-val true err-val true)
          (match (contract-call? .blocklancer-reputation record-dispute-outcome
            (get freelancer dispute-data) (get client dispute-data) resolution-type)
            ok-val true err-val true)
        )
      )
    )

    (ok true)
  )
)

;; Admin functions to set contract references
(define-public (set-dao-contract (dao-contract principal))
  (begin
    (try! (assert-not-paused))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set dao-contract-principal (some dao-contract))
    (ok true)
  )
)

(define-public (set-escrow-contract (escrow-contract principal))
  (begin
    (try! (assert-not-paused))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set escrow-contract-principal (some escrow-contract))
    (ok true)
  )
)

(define-public (set-reputation-contract (reputation-contract principal))
  (begin
    (try! (assert-not-paused))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set reputation-contract-principal (some reputation-contract))
    (ok true)
  )
)

;; Withdraw dispute (only the person who opened it)
(define-public (withdraw-dispute (dispute-id uint))
  (let
    (
      (dispute-data (unwrap! (map-get? disputes dispute-id) err-dispute-not-found))
      (current-time stacks-block-height)
    )
    (try! (assert-not-paused))
    ;; Validations
    (asserts! (is-eq tx-sender (get opened-by dispute-data)) err-not-authorized)
    (asserts! (is-eq (get status dispute-data) dispute-open) err-invalid-state)

    ;; Update dispute status
    (map-set disputes dispute-id
      (merge dispute-data {
        status: dispute-withdrawn,
        resolved-at: (some current-time)
      })
    )

    ;; Remove contract dispute mapping
    (map-delete contract-disputes (get contract-id dispute-data))

    (ok true)
  )
)

;; Read-only Functions

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused)
)

;; Get dispute details
(define-read-only (get-dispute (dispute-id uint))
  (map-get? disputes dispute-id)
)

;; Get dispute by contract ID
(define-read-only (get-contract-dispute (contract-id uint))
  (match (map-get? contract-disputes contract-id)
    dispute-id (map-get? disputes dispute-id)
    none
  )
)

;; Check if contract has an active dispute
(define-read-only (has-active-dispute (contract-id uint))
  (match (map-get? contract-disputes contract-id)
    dispute-id (is-eq (get-dispute-status dispute-id) dispute-open)
    false
  )
)

;; Get dispute ID for a contract
(define-read-only (get-contract-dispute-id (contract-id uint))
  (map-get? contract-disputes contract-id)
)

;; Get total dispute count
(define-read-only (get-dispute-count)
  (var-get next-dispute-id)
)

;; Get all disputes for a user (simplified - returns first few)
(define-read-only (get-user-disputes (user principal))
  (let ((dispute-1 (map-get? disputes u1))
        (dispute-2 (map-get? disputes u2))
        (dispute-3 (map-get? disputes u3)))
    ;; In a real implementation, this would be more sophisticated
    ;; For MVP, we'll keep it simple
    {
      dispute-1: dispute-1,
      dispute-2: dispute-2,
      dispute-3: dispute-3
    }
  )
)
