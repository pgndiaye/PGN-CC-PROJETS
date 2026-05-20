---
id: 09-mobile-money-payment
title: Mobile Money Payment (SENE-PAY)
edition: Both
depends_on: [02-auth-module, 08-orders-module]
source_files:
  - apps/backend/src/modules/payments/payments.module.ts
  - apps/backend/src/modules/payments/payments.service.ts
  - apps/backend/src/modules/payments/payments.controller.ts
  - apps/backend/src/modules/payments/dto/initiate-payment.dto.ts
  - apps/mobile/src/hooks/usePayment.ts
  - apps/mobile/src/screens/PaymentWebViewScreen.tsx
routes:
  - POST /api/v1/payments/initiate
  - POST /api/v1/payments/webhook
models: []
test_files:
  - apps/backend/src/modules/payments/payments.service.spec.ts
data_flow: greenfield
last_synced: 2026-05-20
status: in_progress
phase: doc
mdd_version: 1.6.13
tags: [payments, mobile-money, senepay, wave, orange-money, webhook, nestjs, react-native]
path: Commerce/Payments
initiative: ezviz-senegal
wave: ezviz-senegal-wave-3
wave_status: in_progress
integration_contracts: []
satisfies_contracts: []
known_issues: []
---

# 09 — Mobile Money Payment (SENE-PAY)

## Purpose

Enables a commercial agent to initiate a Wave, Orange Money, or Free Money payment for an existing order via the SENE-PAY payment gateway. The backend creates a SENE-PAY checkout session, returns the checkout URL to the mobile app, the customer approves the payment on their phone, and SENE-PAY's webhook confirms the transaction — automatically updating the order status to PAID.

## Architecture

```
Mobile App → POST /api/v1/payments/initiate (orderId, method, phone)
           ← { checkoutUrl, sessionToken }
           → Opens WebView with checkoutUrl

Customer approves on Wave / Orange Money / Free Money app

SENE-PAY → POST /api/v1/payments/webhook (signed payload)
Backend  → verifies HMAC signature
         → updates Order: status=PAID, paymentRef=sessionToken, paymentMethod=*
```

No new Prisma model — the existing `Order.paymentRef` stores the SENE-PAY session token; `Order.status` and `Order.paymentMethod` are updated on webhook confirmation.

SENE-PAY API base: `https://api.sene-pay.com/api/v1`
Authentication: `X-Api-Key` + `X-Api-Secret` headers (secret key server-side only).

## Data Model

No new models. Fields used on `Order`:
- `paymentRef: String?` — stores the SENE-PAY `sessionToken` while pending, then the confirmed transaction reference
- `paymentMethod: PaymentMethod?` — set to `ORANGE_MONEY`, `WAVE`, or `CASH` on confirmation
- `status: OrderStatus` — flipped to `PAID` on successful webhook

## API Endpoints

### POST /api/v1/payments/initiate
- **Auth:** JWT required; roles ADMIN, COMMERCIAL
- **Body:**
  ```json
  {
    "orderId": "cuid",
    "paymentMethod": "WAVE" | "ORANGE_MONEY",
    "customerPhone": "7XXXXXXXX"
  }
  ```
- **Logic:**
  1. Load order, verify it is `PENDING` (reject if already `PAID` or `CANCELLED`)
  2. Call SENE-PAY `POST /checkout/sessions`:
     ```json
     {
       "amount": <order.total>,
       "currency": "XOF",
       "orderReference": <order.id>,
       "description": "Commande EZVIZ #<order.id.slice(-6)>",
       "webhookUrl": "<API_BASE>/api/v1/payments/webhook",
       "successUrl": "<APP_DEEP_LINK>/payment/success",
       "cancelUrl": "<APP_DEEP_LINK>/payment/cancel",
       "expiresInMinutes": 30
     }
     ```
  3. Store `sessionToken` in `order.paymentRef` (status stays PENDING)
  4. Return `{ checkoutUrl, sessionToken, expiresAt }`
- **Response 201:**
  ```json
  { "checkoutUrl": "https://checkout.sene-pay.com/...", "sessionToken": "...", "expiresAt": "ISO" }
  ```
- **Errors:** 400 if order not PENDING; 404 if order not found; 502 if SENE-PAY unreachable

### POST /api/v1/payments/webhook
- **Auth:** None (public endpoint) — verified via HMAC signature in request body/header
- **Body:** SENE-PAY signed payload with `sessionToken`, `status`, `transactionRef`, `amount`
- **Logic:**
  1. Verify HMAC signature using `SENEPAY_SECRET_KEY` (reject with 400 if invalid)
  2. Find order by `paymentRef = sessionToken`
  3. If `status === 'SUCCESS'`: update order `status=PAID`, `paymentRef=transactionRef`
  4. If `status === 'FAILED'` or `'CANCELLED'`: leave order as PENDING, log event
  5. Return `200 OK` immediately (SENE-PAY expects fast response)
- **Idempotency:** if order is already PAID, return 200 without re-processing

## Business Rules

1. Only `PENDING` orders can be submitted for payment — reject with 400 otherwise.
2. The webhook endpoint is public but HMAC-verified — reject unsigned or tampered payloads with 400.
3. Webhook response must be fast (< 5s) — no heavy logic inside the handler; update DB and return.
4. Session expires in 30 minutes — if the webhook fires after expiry, process normally (SENE-PAY guarantees delivery).
5. `SENEPAY_SECRET_KEY` is never exposed to the mobile client or included in any API response.
6. `customerPhone` from the initiate request is forwarded to SENE-PAY metadata only — not stored on the Order.

## Data Flow

Greenfield. The payment flow is:
- `order.total` → SENE-PAY `amount` (no transformation, raw XOF value)
- `order.id` → `orderReference` in SENE-PAY session (used to correlate webhook)
- SENE-PAY `sessionToken` → stored in `order.paymentRef` until confirmed
- SENE-PAY webhook `transactionRef` → replaces `order.paymentRef` on success

## Dependencies

- **02-auth-module:** JWT guard on `POST /initiate`; Commercial/Admin roles only.
- **08-orders-module:** Orders must exist and be PENDING before payment can be initiated. PaymentsService reads OrdersService (or PrismaService directly) to fetch and update orders.

## Security

- **Untrusted input:** `POST /webhook` accepts requests from SENE-PAY's servers. Any caller can POST to this endpoint. Verification is via HMAC signature computed with `SENEPAY_SECRET_KEY`.
- **HMAC verification:** must run BEFORE any DB write. A missing or invalid signature returns 400 immediately — no order mutation occurs.
- **Secret key:** `SENEPAY_SECRET_KEY` lives only in server environment variables. It is never returned in any API response or logged.
- **`SENEPAY_API_KEY`** (public key): used in `X-Api-Key` header on outbound requests to SENE-PAY — safe to expose in logs.
- **Injection:** `customerPhone` is passed to SENE-PAY metadata as-is. It is never stored in the DB or executed.

## Known Issues

(none — new feature)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
