(define-constant CONTRACT_ADDRESS (as-contract tx-sender))

(define-constant ERR_TITLE_DESCRIPTION_LINK_EMPTY (err u101))
(define-constant ERR_INVALID_FUND_GOAL (err u102))
(define-constant ERR_START_NOT_VALID (err u103))
(define-constant ERR_END_NOT_VALID (err u104))
(define-constant ERR_ID_NOT_FOUND (err u105))
(define-constant ERR_CANNOT_CANCEL (err u106))
(define-constant ERR_NOT_OWNER (err u107))
(define-constant ERR_NOT_STARTED (err u108))
(define-constant ERR_ENDED (err u109))
(define-constant ERR_PLEDGE_GREATER_THAN_ZERO (err u110))
(define-constant ERR_STX_TRANSFER_FAILED (err u111))
(define-constant ERR_NOT_PLEDGED (err u112))
(define-constant ERR_INVALID_UNPLEDGE_AMT (err u113))
(define-constant ERR_NOT_ENDED (err u114))
(define-constant ERR_GOAL_NOT_MET (err u115))
(define-constant ERR_ALREADY_CLAIMED (err u116))
(define-constant ERR_TARGET_NOT_REACHED (err u117))

;; calculate roughly 90 days based on block times of 10 minutes
(define-constant FUNDING_TIME_LIMIT u12960)

(define-data-var last-id uint u0)

(define-map Campaigns uint {
    title: (string-utf8 256),
    description: (buff 33),
    link: (string-utf8 256),
    fundGoal: uint,
    startsAt: uint,
    endsAt: uint,
    campaignOwner: principal,
    pledgedCount: uint,
    pledgedAmount: uint,
    claimed: bool,
    targetReached: bool,
    targetReachedBy: uint
})

(define-map Investments {contributor: principal, campaignId: uint} {amount: uint})

(define-public (launch (title (string-utf8 256)) (description (buff 33)) (link (string-utf8 256)) (fund-goal uint) (starts-at uint) (ends-at uint))
    (let ((id (var-get last-id)))
        (asserts! (and (> (len title) u0) (> (len description) u0) (> (len link) u0)) ERR_TITLE_DESCRIPTION_LINK_EMPTY)
        (asserts! (> fund-goal u0) ERR_INVALID_FUND_GOAL)
        (asserts! (> starts-at block-height) ERR_START_NOT_VALID)
        (asserts! (> ends-at block-height) ERR_END_NOT_VALID)
        (asserts! (< ends-at FUNDING_TIME_LIMIT) ERR_END_NOT_VALID)
        (map-set Campaigns (+ id u1) {
            title: title,
            description: description,
            link: link,
            fundGoal: fund-goal,
            startsAt: starts-at,
            endsAt: ends-at,
            campaignOwner: tx-sender,
            pledgedCount: u0,
            pledgedAmount: u0,
            claimed: false,
            targetReached: false,
            targetReachedBy: u0
        })
        (var-set last-id (+ id u1))
        (ok (var-get last-id))
    )
)

(define-read-only (get-campaign (campaign-id uint))
    (let ((campaign (map-get? Campaigns campaign-id)))
        (asserts! (is-some campaign) ERR_ID_NOT_FOUND)
        (ok (unwrap-panic campaign))
    )
)

;; #[allow(unchecked_data)]
(define-public (cancel (campaign-id uint))
    (let (
            (campaign-tuple (try! (get-campaign campaign-id)))
            (start-block (get startsAt campaign-tuple))
            (campaign-owner (get campaignOwner campaign-tuple))
        ) 
        (asserts! (< block-height start-block) ERR_CANNOT_CANCEL)
        (asserts! (is-eq campaign-owner tx-sender) ERR_NOT_OWNER)
        (map-delete Campaigns campaign-id)
        (ok true)
    )
)

;; #[allow(unchecked_data)]
(define-public (update (campaign-id uint) (title (string-utf8 256)) (description (buff 33)) (link (string-utf8 256)))
    (let (
            (campaign-tuple (try! (get-campaign campaign-id)))
            (campaign-owner (get campaignOwner campaign-tuple))
            (end-block (get endsAt campaign-tuple))
        )
        (asserts! (is-eq campaign-owner tx-sender) ERR_NOT_OWNER)
        (asserts! (and (> (len title) u0) (> (len description) u0) (> (len link) u0)) ERR_TITLE_DESCRIPTION_LINK_EMPTY)
        (asserts! (< block-height end-block) ERR_ENDED)
        (map-set Campaigns campaign-id
            (merge campaign-tuple {
                title: title,
                description: description,
                link: link
            })
        )
        (ok true)
    )
)

;; #[allow(unchecked_data)]
(define-public (pledge (campaign-id uint) (pledge-amount uint)) 
    (let (  
            (sender-principal tx-sender)
            (campaign-tuple (try! (get-campaign campaign-id)))
            (start-block (get startsAt campaign-tuple))
            (end-block (get endsAt campaign-tuple))
            (pledged-count (get pledgedCount campaign-tuple))
            (total-pledged (get pledgedAmount campaign-tuple))
            (fund-goal (get fundGoal campaign-tuple))
            (new-pledged (+ total-pledged pledge-amount))
            (investor-key-tuple {contributor: sender-principal, campaignId: campaign-id})
            (investor-tuple (map-get? Investments investor-key-tuple))
            (investor-exists (is-some investor-tuple))
        )
        (asserts! (> pledge-amount u0) ERR_PLEDGE_GREATER_THAN_ZERO)
        (asserts! (> block-height start-block) ERR_NOT_STARTED)
        (asserts! (< block-height end-block) ERR_ENDED)
        (asserts! (try! (stx-transfer? pledge-amount sender-principal CONTRACT_ADDRESS)) ERR_STX_TRANSFER_FAILED)
        (if (>= pledge-amount u500)
            (try! (as-contract (contract-call? .donorpass mint sender-principal)))
            u1
        )
        (if investor-exists
            (map-set Investments investor-key-tuple
                (merge (unwrap-panic investor-tuple) {
                    amount: (+ (get amount (unwrap-panic investor-tuple)) pledge-amount),
                })
            )
            (map-set Investments investor-key-tuple {amount: pledge-amount})
        )
        (if (>= new-pledged fund-goal)
            (map-set Campaigns campaign-id
                (merge campaign-tuple {
                    pledgedAmount: (+ total-pledged pledge-amount),
                    targetReached: true,
                    targetReachedBy: (+ block-height u1),
                    pledgedCount: (if investor-exists pledged-count (+ pledged-count u1))
                })
            )
            (map-set Campaigns campaign-id
                (merge campaign-tuple {
                    pledgedAmount: (+ total-pledged pledge-amount),
                    pledgedCount: (if investor-exists pledged-count (+ pledged-count u1))
                })
            )
        )
        (ok true)
    )
)

;; #[allow(unchecked_data)]
(define-public (claim (campaign-id uint)) 
    (let (
            (campaign-tuple (try! (get-campaign campaign-id)))
            (target-reached (get targetReached campaign-tuple))
            (campaign-owner (get campaignOwner campaign-tuple))
            (end-block (get endsAt campaign-tuple))
            (total-pledged (get pledgedAmount campaign-tuple))
            (claimed-status (get claimed campaign-tuple))
        )
        (asserts! (not claimed-status) ERR_ALREADY_CLAIMED)
        (asserts! target-reached ERR_TARGET_NOT_REACHED)
        (asserts! (is-eq tx-sender campaign-owner) ERR_NOT_OWNER)
        (try! (as-contract (stx-transfer? total-pledged tx-sender campaign-owner)))
        (map-set Campaigns campaign-id
            (merge campaign-tuple {
                claimed: true
            })
        )
        (ok true)
    )
)

(define-read-only (get-investment (campaign-id uint) (investor principal)) 
    (ok (map-get? Investments  {contributor: investor, campaignId: campaign-id}))
)

;; #[allow(unchecked_data)]
(define-public (unpledge (campaign-id uint) (unpledge-amount uint))
    (let (
            (sender-principal tx-sender)
            (investor-key-tuple {contributor: sender-principal, campaignId: campaign-id})
            (investor-tuple (map-get? Investments investor-key-tuple))
            (investor-exists (asserts! (is-some investor-tuple) ERR_NOT_PLEDGED))
            (investor-pledged (unwrap-panic (get amount investor-tuple)))
            (campaign-tuple (try! (get-campaign campaign-id)))
            (pledge-count (get pledgedCount campaign-tuple))
            (pledge-amount (get pledgedAmount campaign-tuple))
            (end-block (get endsAt campaign-tuple))
        )
        (asserts! (> unpledge-amount u0) ERR_PLEDGE_GREATER_THAN_ZERO)
        (asserts! (>= investor-pledged unpledge-amount) ERR_INVALID_UNPLEDGE_AMT)
        (asserts! (< block-height end-block) ERR_ENDED)
        (try! (as-contract (stx-transfer? unpledge-amount tx-sender sender-principal)))
        (if (is-eq unpledge-amount investor-pledged)
            (begin 
                (map-set Campaigns campaign-id
                    (merge campaign-tuple {
                        pledgedCount: (- pledge-count u1),
                        pledgedAmount: (- pledge-amount unpledge-amount)
                    })
                ) 
                (map-delete Investments investor-key-tuple)
            )
            (begin 
                (map-set Campaigns campaign-id
                    (merge campaign-tuple {
                        pledgedAmount: (- pledge-amount unpledge-amount)
                    })
                )
                (map-set Investments investor-key-tuple 
                    {
                        amount: (- investor-pledged unpledge-amount)
                    }
                )
            )
        )
        (ok true)
    )
)

;; #[allow(unchecked_data)]
(define-public (refund (campaign-id uint)) 
    (let (
            (campaign-tuple (try! (get-campaign campaign-id)))
            (end-block (get endsAt campaign-tuple))
            (reached-goal (get targetReached campaign-tuple))
            (sender-principal tx-sender)
            (investor-key-tuple {contributor: sender-principal, campaignId: campaign-id})
            (investor-tuple (map-get? Investments investor-key-tuple))
            (investor-exists (asserts! (is-some investor-tuple) ERR_NOT_PLEDGED))
            (investor-pledged (unwrap-panic (get amount investor-tuple)))
        )
        (asserts! (> block-height end-block) ERR_NOT_ENDED)
        (asserts! (not reached-goal) ERR_GOAL_NOT_MET)
        (try! (as-contract (stx-transfer? investor-pledged tx-sender sender-principal)))
        (map-delete Investments investor-key-tuple)
        (ok true)
    )
)