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
last_synced: 2026-05-21
status: in_progress
phase: integration-pending
mdd_version: 1.6.13
tags: [payments, mobile-money, senepay, wave, orange-money, webhook, nestjs, react-native]
path: Commerce/Payments
initiative: ezviz-senegal
wave: ezviz-senegal-wave-3
wave_status: in_progress
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "handleWebhook hardcodes paymentMethod: WAVE on SUCCESS — Orange Money payments stored as WAVE in DB"
---

# 09 — Mobile Money Payment (SENE-PAY)

## Purpose

Enables a commercial agent to initiate a Wave or Orange Money payment for an existing order via the SENE-PAY payment gateway. The backend creates a SENE-PAY checkout session, returns the checkout URL to the mobile app, the app opens it via `Linking.openURL()`, the customer approves the payment on their phone, and SENE-PAY's webhook confirms the transaction — automatically updating the order status to PAID.

**Supported methods:** `WAVE`, `ORANGE_MONEY` (Free Money is not supported).

## Architecture

```
Mobile App → POST /api/v1/payments/initiate (orderId, method, phone)
           ← { checkoutUrl, sessionToken, expiresAt }
           → Linking.openURL(checkoutUrl)  ← opens external Wave/OM app

Customer approves on Wave / Orange Money app
Deep link returns → ezvizsenegal://payment/success | ezvizsenegal://payment/cancel

SENE-PAY → POST /api/v1/payments/webhook  (x-senepay-signature header)
Backend  → verifies HMAC signature
         → updates Order: status=PAID, paymentRef=transactionRef, paymentMethod=*
```

No new Prisma model — the existing `Order.paymentRef` stores the SENE-PAY session token; `Order.status` and `Order.paymentMethod` are updated on webhook confirmation.

SENE-PAY API base: `https://api.sene-pay.com/api/v1`
Authentication: `X-Api-Key` + `X-Api-Secret` headers (secret key server-side only).
Outbound request timeout: 10 seconds (`AbortSignal.timeout(10000)`).

**Module wiring:** `PaymentsModule` imports `PrismaService` directly (no OrdersModule import) and exports `PaymentsService`.

## Data Model

No new models. Fields used on `Order`:
- `paymentRef: String?` — stores the SENE-PAY `sessionToken` while pending, then the confirmed transaction reference on webhook success
- `paymentMethod: PaymentMethod?` — set on webhook confirmation (⚠ see Known Issues — currently hardcoded to WAVE)
- `status: OrderStatus` — flipped to `PAID` on successful webhook

## DTOs

### InitiatePaymentDto

| Field | Type | Required | Validation |
|---|---|---|---|
| orderId | string | yes | @IsNotEmpty |
| paymentMethod | PaymentMethod | yes | @IsEnum (WAVE \| ORANGE_MONEY) |
| customerPhone | string | yes | @IsNotEmpty |

Client-side validation in `PaymentWebViewScreen`: phone must be ≥ 8 characters before the mutation fires.

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
  1. Load order, verify it is `PENDING` (reject 400 if already `PAID` or `CANCELLED`)
  2. Call SENE-PAY `POST /checkout/sessions` with 10s timeout:
     ```json
     {
       "amount": <order.total>,
       "currency": "XOF",
       "orderReference": <order.id>,
       "description": "Commande EZVIZ #<order.id.slice(-6)>",
       "webhookUrl": "<API_BASE>/api/v1/payments/webhook",
       "successUrl": "ezvizsenegal://payment/success",
       "cancelUrl": "ezvizsenegal://payment/cancel",
       "expiresInMinutes": 30,
       "metadata": { "customerPhone": <customerPhone>, "paymentMethod": <paymentMethod> }
     }
     ```
  3. Store `sessionToken` in `order.paymentRef` (status stays PENDING)
  4. Return `{ checkoutUrl, sessionToken, expiresAt }`
- **Response 201:**
  ```json
  { "checkoutUrl": "https://checkout.sene-pay.com/...", "sessionToken": "...", "expiresAt": "ISO" }
  ```
- **Errors:** 400 if order not PENDING; 404 if order not found; **503** if SENE-PAY unreachable (`ServiceUnavailableException`)

### POST /api/v1/payments/webhook
- **Auth:** None (public endpoint) — verified via HMAC signature in `x-senepay-signature` header
- **Body:** SENE-PAY signed payload with `sessionToken`, `status`, `transactionRef`, `amount`
- **Logic:**
  1. Verify HMAC signature using `SENEPAY_SECRET_KEY` from `x-senepay-signature` header (reject 400 if invalid)
  2. Find order by `paymentRef = sessionToken`
  3. If `status === 'SUCCESS'`: update order `status=PAID`, `paymentRef=transactionRef`, `paymentMethod=WAVE` ⚠ (hardcoded — see Known Issues)
  4. If `status === 'FAILED'` or `'CANCELLED'`: leave order as PENDING, log event
  5. Return `200 OK` immediately (SENE-PAY expects fast response)
- **Idempotency:** if order is already PAID, return 200 without re-processing

## Business Rules

1. Only `PENDING` orders can be submitted for payment — reject with 400 otherwise.
2. Only `WAVE` and `ORANGE_MONEY` are accepted payment methods — Free Money is not supported.
3. The webhook endpoint is public but HMAC-verified — reject unsigned or tampered payloads with 400.
4. Webhook response must be fast (< 5s) — no heavy logic inside the handler; update DB and return.
5. Session expires in 30 minutes — if the webhook fires after expiry, process normally (SENE-PAY guarantees delivery).
6. `SENEPAY_SECRET_KEY` is never exposed to the mobile client or included in any API response.
7. `customerPhone` and `paymentMethod` are forwarded to SENE-PAY as `metadata` — not stored on the Order.
8. Client-side phone validation: ≥ 8 characters required before the mutation is submitted.

## Data Flow

Greenfield. The payment flow is:
- `order.total` → SENE-PAY `amount` (raw XOF value, no transformation)
- `order.id` → `orderReference` in SENE-PAY session (used to correlate webhook)
- SENE-PAY `sessionToken` → stored in `order.paymentRef` until confirmed
- SENE-PAY webhook `transactionRef` → replaces `order.paymentRef` on success
- Deep link `ezvizsenegal://payment/success` / `ezvizsenegal://payment/cancel` → returned to mobile app after customer action

## Mobile Screen (`PaymentWebViewScreen.tsx`)

Despite the filename, this screen uses `Linking.openURL()` — not a WebView. Navigation entry point: `OrderDetailScreen` → "Encaisser en Mobile Money" button (PENDING orders only) passes `{ orderId, total }`.

Screen flow:
1. Phone number input (≥ 8 chars required) + payment method selector (WAVE | ORANGE_MONEY)
2. On submit: calls `useInitiatePayment()` mutation
3. On success: opens `checkoutUrl` via `Linking.openURL()` — hands off to external Wave / OM app
4. Deep link `ezvizsenegal://payment/success` returns the user to the app after approval

## Hooks (`usePayment.ts`)

| Hook | Purpose |
|---|---|
| `useInitiatePayment()` | Mutation — POST /payments/initiate; invalidates `['orders']` on success |

## Dependencies

- **02-auth-module:** JWT guard on `POST /initiate`; Commercial/Admin roles only.
- **08-orders-module:** Orders must exist and be PENDING before payment can be initiated. `PaymentsService` uses `PrismaService` directly to read and update orders (does not inject `OrdersService`). `OrderDetailScreen` navigates to `PaymentWebViewScreen` for PENDING orders.

## Security

- **Untrusted input:** `POST /webhook` accepts requests from SENE-PAY's servers. Any caller can POST to this endpoint. Verification is via HMAC signature in the `x-senepay-signature` header using `SENEPAY_SECRET_KEY`.
- **HMAC verification:** runs BEFORE any DB write. A missing or invalid signature returns 400 immediately — no order mutation occurs.
- **Secret key:** `SENEPAY_SECRET_KEY` lives only in server environment variables. Never returned in any API response or logged.
- **`SENEPAY_API_KEY`** (public key): used in `X-Api-Key` header on outbound requests to SENE-PAY — safe to expose in logs.
- **`customerPhone`:** passed to SENE-PAY metadata as-is; never stored in the DB or executed.

## Known Issues

- **`paymentMethod` hardcoded to WAVE in webhook handler:** `handleWebhook` always sets `paymentMethod: PaymentMethod.WAVE` on SUCCESS regardless of the actual payment method. Orange Money payments are stored as WAVE in the database. Fix: extract `paymentMethod` from the SENE-PAY webhook payload (available in `metadata.paymentMethod`) and map to the correct enum value.
