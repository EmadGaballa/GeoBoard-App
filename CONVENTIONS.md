# GeoBoard — Project-Wide Conventions

> These rules apply to **every new feature** in this project. Follow them
> strictly to keep authentication, authorization, and data handling consistent
> and secure.

---

## 1. Authenticated Routes Must Use the `authenticate` Middleware

```ts
import { authenticate } from "../middleware/auth.js"

router.get("/protected", authenticate, controller.handler)
router.post("/private", authenticate, controller.handler)
```

- The middleware extracts the user from the JWT (cookie or `Authorization` header)
  and attaches it to `req.user`.
- Inside the controller/handler, `req.user` is guaranteed to be present.
- Use `req.user!.id` (the `!` is safe here — `authenticate` already threw if
  no token was present).

### Public routes (no auth required)

- Only for truly public data: IP geolocation, geocoding, health check.
- Do not expose user-specific data without authentication.

---

## 2. Never Trust IDs from the Frontend

**The authenticated user's ID always comes from the JWT (`req.user.id`).**  
Never accept a `userId`, `ownerId`, or similar parameter from the client.

```ts
// ✅ CORRECT — use the authenticated user
const userId = req.user!.id
const data = await service.getMyData(userId)

// ❌ WRONG — never trust a client-supplied ID
const { userId } = req.params
const data = await service.getUserData(userId)
```

If a feature needs to act on a *different* resource (e.g., delete a saved
location by its own ID), still scope the query by the authenticated user:

```ts
// ✅ CORRECT — verify ownership in the query
await prisma.savedLocation.deleteMany({
  where: { id: locationId, userId: req.user!.id },
})
```

---

## 3. Validate All Input at the Controller Boundary

Use **Zod schemas** (defined in `common/validation.ts`) to validate every
request body, query string, and route parameter **before** passing data to
the service layer.

```ts
// ✅ CORRECT
const data = mySchema.parse(req.body) // throws ZodError on failure
await service.doWork(data)
```

Never pass raw `req.body` to a service — it may contain unexpected fields or
malicious data.

```ts
// ❌ WRONG — no validation
await service.doWork(req.body)
```

Zod errors are automatically caught by the global error handler and return a
400 response with field-level detail messages.

---

## 4. Users Can Only Access Their Own Data

Every database query that returns user-specific data must be scoped by
`req.user.id`:

```ts
const myData = await prisma.someModel.findMany({
  where: { userId: req.user!.id },
})
```

When deleting or updating a resource, verify ownership in the `where` clause:

```ts
const deleted = await prisma.someModel.deleteMany({
  where: { id: resourceId, userId: req.user!.id },
})
```

If the resource isn't found (because it doesn't exist or doesn't belong to
the user), return a 404 — do **not** reveal whether the resource exists but
belongs to another user.

---

## 5. Consistent API Response Format

Every endpoint must return responses using this envelope:

```ts
// Success
{
  "success": true,
  "data": { /* payload */ },
  "meta": { "timestamp": "2026-06-26T..." }   // optional, add as needed
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "details": [                                 // only for validation errors
    { "field": "email", "message": "Invalid email address" }
  ],
  "meta": { "timestamp": "2026-06-26T..." }
}
```

- The global `errorHandler` middleware in `middleware/errorHandler.ts` handles
  all errors — you do not need try/catch with manual responses in controllers.
- Simply `throw` an `AppError` (or one of its subclasses) from a service, or
  let Zod throw at the controller boundary.

---

## 6. Login Errors Must Be Vague; Registration Errors Should Be Specific

| Scenario | Behaviour |
|---|---|
| **Login** — wrong email or password | `"Invalid email or password"` (don't reveal which one) |
| **Register** — email taken | `"Email already registered"` |
| **Register** — username taken | `"Username is already taken"` |
| **Register** — validation failure | Return field-level details via Zod error |
| **Change password** — wrong current password | `"Current password is incorrect"` |

- Vague login errors prevent email enumeration attacks.
- Specific registration errors are fine because the user already told us the
  email/username they want to use.

---

## 7. Password Policy

Enforced by the `passwordSchema` in `common/validation.ts`:

- Minimum 10 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character
- Must not appear on a list of commonly leaked passwords

---

## 8. Auth Flows

### Registration
1. Controller validates body with `registerSchema`
2. Service checks email uniqueness (case-insensitive)
3. Service checks username uniqueness (case-insensitive)
4. Password is hashed with bcrypt (12 rounds)
5. User, preferences, and dashboard config are created in a transaction
6. JWT is issued, cookie is set, response returned

### Login
1. Controller validates body with `emailLoginSchema`
2. Service looks up user by email
3. Password compared with bcrypt
4. All prior sessions are invalidated (single-session policy)
5. New JWT issued, cookie set, response returned

### Logout
1. Token deleted from database
2. Cookie cleared

---

## 9. Password Changes Invalidate All Sessions

When a user changes their password, all existing sessions are deleted. This
forces re-authentication on all devices — standard practice for security.

---

## 10. Session Management

- JWT expires in 7 days.
- Each login replaces all previous sessions (single active session per user).
- `authenticate` middleware updates `lastUsed` on each request.
- `validateToken` in `auth.service.ts` checks both JWT validity and database
  session existence.

---

## 11. Never Log Sensitive Data

- Do not log passwords, password hashes, or JWT tokens.
- Do not log full request bodies that may contain credentials.
- In error logs, redact or omit user secrets.

---

## 12. Environment Variables Must Be Validated at Startup

The `validateConfig()` call in `server/index.ts` checks that required
variables (`JWT_SECRET`, `SESSION_SECRET`) are set before the server starts.
If you add a new required config value, add a corresponding check in
`config/index.ts`.