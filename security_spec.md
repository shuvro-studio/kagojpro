# KagojPro Security Specification

## 1. Data Invariants
1. **Strict Account Isolation**: Every user account (`uid`) has an isolated namespace under `/users/{userId}`. Only the authenticated owner (`request.auth != null && request.auth.uid == userId`) can read, list, create, update, or delete any document under `/users/{userId}`.
2. **Owner Field Integrity**: Every subcollection document (`settings`, `notes`, `invoices`) stores `ownerId` matching `request.auth.uid` on creation and `ownerId` is immutable on update.
3. **Strict Key & Type Enforcement**: No ghost/shadow fields (`keys().hasAll(...) && keys().hasOnly(...)`) are permitted on create, and updates enforce exact `affectedKeys().hasOnly(...)` allowlists alongside full `isValid*()` payload validation.
4. **Server Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time`; `createdAt` is immutable on update.
5. **Bounded Arrays & Strings**: All strings enforce explicit `.size()` upper bounds, and invoice `items` are strictly bounded to `1 <= size <= 50` with validated element shape.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Cross-Account Read**: User B (`uidB`) attempts `get` on `/users/uidA/invoices/inv1`.
2. **Cross-Account List**: User B (`uidB`) attempts `list` on `/users/uidA/notes` without matching owner.
3. **Identity Spoofing on Create**: User A writes a note to `/users/uidA/notes/n1` with `ownerId: "uidB"`.
4. **Unauthenticated Write**: An unauthenticated client (`request.auth == null`) attempts `create` on `/users/uidA/notes/n1`.
5. **Shadow / Ghost Field Injection**: User A creates `/users/uidA` with extra field `role: "admin"` or `isAdmin: true`.
6. **Immutable `createdAt` Tampering**: User A updates `/users/uidA/notes/n1` changing `createdAt` to a past timestamp.
7. **Forged Client Timestamp**: User A creates `/users/uidA/invoices/inv1` with `updatedAt` set to a custom client timestamp instead of `request.time`.
8. **ID Poisoning**: User A attempts to create `/users/uidA/notes/<200-char-invalid$id>` with non-alphanumeric characters or oversized ID.
9. **Denial-of-Wallet Oversized String**: User A creates `/users/uidA/notes/n1` with `content` length > 20,000 chars or `title` > 120 chars.
10. **Unbounded Array / Invalid Item Shape**: User A creates an invoice with `items: []` (empty) or `items.size() > 50` or `items[0].unitPrice: -50`.
11. **Invalid Enum Status/Theme**: User A updates an invoice setting `status: "FREE"` or `theme: "hacked"`.
12. **Owner Transfer on Update**: User A updates `/users/uidA/invoices/inv1` changing `ownerId` to `"uidB"`.
