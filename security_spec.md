# Security Specification & Threat Model: CivicPulse AI

## 1. Five Threat Zones & Countermeasures

| Threat Zone | Identified Risk | Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection in citizen feedback, oversized text, corrupted geo-coords, prompt injection in translation. | Schema validation with regex and length constraints (`maxLength: 2000`). Sanitization before prompt ingestion. Treat citizen inputs as data parameters, never instruction code. |
| **Planning & Reasoning** | Prompt injection seeking to manipulate AI priority scores, hallucinate projects, or bypass category filters. | Structured JSON output schemas with strict enum constraints, validation of reasoning against government ground-truth metrics, fallback model ladder. |
| **Tool Execution** | SSRF or unauthenticated API triggering of recommendation generation, credential theft. | Express middleware authentication, server-side secret management via env/Secret Manager, rate limiting. |
| **Memory & State** | Cross-user data leaks in Firestore, privilege escalation to Policymaker role, unauthorized updates to project budgets. | Firestore rules enforcing path ownership (`request.auth.uid == userId`), RBAC checks via `/policymakers/$(request.auth.uid)`, terminal state locking. |
| **Inter-System Communication** | Leakage of Gemini API credentials or Firebase admin credentials to client browser. | Gemini API is accessed strictly via server-side proxy (`/api/*`). Zero keys exposed in frontend bundle. Client uses Firebase client SDK with scoped auth. |

## 2. Data Invariants

1. **Role Integrity**: A standard citizen cannot modify their role to `policymaker` or self-assign into the `/policymakers/` collection.
2. **Citizen Request Ownership**: A citizen can only create requests where `userId == request.auth.uid`, and can only update or delete their own requests while in mutable states.
3. **Policymaker Authority**: Only verified policymakers can update project statuses, modify national priority weights, or add official government capacity records.
4. **Immutable Identity**: `userId`, `id`, and creation timestamps cannot be altered once created.
5. **No Blanket Reads**: Public or shared collections evaluate queries against structured constraints; user private data is strictly owner-isolated.

## 3. The "Dirty Dozen" Threat Payloads

1. **Privilege Escalation via User Profile**: `{ "role": "policymaker" }` injected during signup by non-admin. Expected: Rejected by role creation check.
2. **Citizen Request Spoofing**: Request with `userId: "victim_user_123"`. Expected: Rejected by `incoming().userId == request.auth.uid`.
3. **Denial of Wallet Payload**: 5MB string injected into `description`. Expected: Rejected by `incoming().description.size() <= 2000`.
4. **ID Poisoning Attack**: Request ID `../../system/root`. Expected: Rejected by `isValidId(id)` regex check `^[a-zA-Z0-9_\-]+$`.
5. **Terminal State Tampering**: Citizen attempts to edit a request that is already marked `Completed`. Expected: Rejected by terminal state gate.
6. **Project Budget Hijacking**: Unauthenticated or citizen user attempts to update `budgetAllocated` on `/projects/p1`. Expected: Rejected by `isPolicymaker()` gate.
7. **Ghost Field Injection**: Adding `isAdminOverride: true` to `/citizenRequests/r1`. Expected: Rejected by `affectedKeys().hasOnly(...)`.
8. **National Priority Tampering**: Unauthorized mutation of priority weights to distort AI recommendations. Expected: Denied without policymaker authorization.
9. **Cluster Data Manipulation**: Direct client modification of cluster statistics without policymaker privilege. Expected: Denied.
10. **Notification Interception / Tampering**: User reading or modifying notifications of another user. Expected: Denied by `userId == request.auth.uid`.
11. **Timestamp Spoofing**: Providing a forged past/future timestamp. Expected: Enforced `incoming().createdAt == request.time`.
12. **Null-Auth Write**: Attempting unauthenticated submission. Expected: Rejected by `isSignedIn()`.
