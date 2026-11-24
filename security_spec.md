# DineFlow Firestore Security Specification (Phase 0)

## Data Invariants
1. **Default Deny**: Any unmatched path under `/databases/{database}/documents` is strictly denied for read and write.
2. **Path ID Hardening**: All document IDs (`orderId`, `callId`, `reviewId`, `feedbackId`, `itemId`, `categoryId`, `tableId`) must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
3. **Zero PII Exposure**: No phone numbers, JSHIR, passport numbers, or emails are stored in public collections (`orders`, `service_calls`, `dish_reviews`, `feedbacks`, `menu_items`, `categories`, `tables`). Waiter HR/PII data stays isolated and is not written to public collections.
4. **Strict Key Allowlists**: Every `create` enforces `hasAll` + `hasOnly` to reject ghost/shadow fields. Every `update` enforces `isValid[Entity](incoming())` AND `affectedKeys().hasOnly(...)` per action.
5. **Immutable Audit Fields & Terminal Locks**: `id`, `created_at`, `order_number`, `table_number` cannot be mutated after creation. Orders in terminal states (`delivered` or `cancelled`) cannot be mutated unless performed by a verified admin.
6. **Bounded Strings & Lists**: Every string has an explicit `.size()` ceiling and every array (`items`, `tags`) has a strict upper bound (`<= 50` / `<= 10`) plus element type checks.

## Dirty Dozen Adversarial Payloads (Must All Be Rejected)
1. **Shadow Field Injection on Order**: Creating an order with an extra ghost key `isAdminOverride: true`.
2. **Invalid Order ID Poisoning**: Creating `/orders/../../../evil` or a 200-char ID.
3. **Oversized Note DoS**: Creating an order with `customer_note` of 2,000 characters (`> 300`).
4. **Invalid Initial Status**: Creating an order directly with `status: "delivered"` instead of `"new"`.
5. **Negative / Huge Total Amount**: Creating an order with `total_amount: -5000` or `total_amount: 99999999999`.
6. **Unbounded Items List**: Creating an order with 0 items or > 50 items.
7. **Mutating Order Price on Update**: Updating an order's `total_amount` or `table_number` or `created_at`.
8. **Updating Terminal Order**: Modifying an order whose `existing().status == 'delivered'` without admin privileges.
9. **Rating Out of Range**: Creating a `dish_reviews` doc with `rating: 99` or `rating: 0`.
10. **PII Leak Attempt on Feedback**: Submitting `customer_phone` inside `feedbacks` (rejected by `hasOnly`).
11. **Invalid Service Call Escalation**: Creating a `service_calls` doc with `status: "resolved"` or `call_count: 500`.
12. **Unverified Admin Email Spoof**: Attempting admin-only collection delete with `email_verified: false`.
