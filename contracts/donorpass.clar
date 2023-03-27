(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-constant CLEARFUND_CONTRACT .clearfund)
(define-constant ERR_CLEARFUND_ONLY (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))

(define-non-fungible-token donorpass uint)

(define-data-var lastTokenId uint u0)

;; #[allow(unchecked_data)]
(define-public (transfer (nft-id uint) (sender principal) (recipient principal)) 
  (begin
		(asserts! (is-eq tx-sender sender) ERR_NOT_TOKEN_OWNER)
		(nft-transfer? donorpass nft-id sender recipient)
	)
)

(define-read-only (get-last-token-id)
	(ok (var-get lastTokenId))
)

(define-read-only (get-token-uri (token-id uint))
	(ok none)
)

(define-read-only (get-owner (token-id uint))
	(ok (nft-get-owner? donorpass token-id))
)

;; #[allow(unchecked_data)]
(define-public (mint (recipient principal))
	(let
		(
			(token-id (+ (var-get lastTokenId) u1))
		)
		(asserts! (is-eq tx-sender CLEARFUND_CONTRACT) ERR_CLEARFUND_ONLY)
		(try! (nft-mint? donorpass token-id recipient))
		(var-set lastTokenId token-id)
		(ok token-id)
	)
)