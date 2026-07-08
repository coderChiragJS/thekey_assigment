# NOTES

Design decisions, trade-offs, and what I'd do next. The brief cares most about
how the layers fit together, so this explains the *why* behind each layer.

## Architecture at a glance

Data flows down into the API, then back up through the client layers into
presentation — the shape the brief sketches:

```
DB schema (Drizzle/SQLite)
   → pure domain logic         src/domain/*          (no DB, no I/O)
   → repository                src/server/repo.ts    (Drizzle queries)
   → API route handlers        src/app/api/**        (auth · Zod · status codes)
   → typed API client          src/lib/api-client.ts (Zod-parsed responses)
   → React Query hooks         src/hooks/*           (+ query-key factory)
   → presentational components src/components/*       (props only, no fetching)
```

The single hardest rule to get right — idempotency, soft-delete/reactivate,
and count behaviour — lives in `src/domain/saves.ts` as a **pure state machine**
with **no database**, so it's unit-tested in isolation (`saves.test.ts`). The
repository calls it to decide *what* to write, then persists separately.

## Data model (`src/db/schema.ts`)

`users`, `courses`, `enrollments`, `posts`, and the bookmark table `saved_posts`.

The bookmark is **one row per `(userId, postId)` forever**, enforced by a
**unique index** on those columns. State is expressed with timestamps rather
than a boolean:

- `createdAt` — first-ever save; immutable, so history survives re-saves.
- `savedAt` — updated on every (re-)save; drives *most-recently-saved-first*.
- `unsavedAt` — soft-delete marker; `NULL` means **active** (currently saved).

This is what lets un-save preserve the record and re-save **reactivate the same
row** instead of inserting a duplicate — the requirement that shapes everything
else. `posts.removedAt` is the analogous soft-remove for moderators.

Timestamps are stored as integer epoch-ms for correct ordering; IDs are readable
strings (`user_ada`, `post_ts101_1`) purely to keep seeds and tests legible.

## Business logic — no database (`src/domain/saves.ts`)

`applySave` / `applyUnsave` take the existing record (or `null`) and return the
next record plus a `changed` flag:

- **Save** — none → create · inactive → reactivate (keep `createdAt`, bump
  `savedAt`) · active → **no-op** (`changed: false`).
- **Un-save** — active → set `unsavedAt` · otherwise no-op.

Idempotency and "never double-count" fall out of that `changed` flag: the
repository skips the write when nothing changed, so saving twice can't inflate
the count. Because it's pure, all of this is proven without spinning up a DB.

## Authorization (`src/server/auth.ts` + `repo.ts` + route handlers)

Auth is **faked but enforced**. `readAuthContext` reads `x-user-id` + `x-role`
(what a signed token/session would carry in production); the *rules* are real.
Identity is parsed at the handler edge (`requireAuth`); the enrollment/role
checks live next to the data in `repo.ts` (`assertCourseAccess`, `removePost`).

Check order, applied consistently: **401 → 404 → 403**.

- **401** — no/invalid identity, on any endpoint.
- **404** — the post or course doesn't exist.
- **403** — a student acting in a course they're not enrolled in, or a student
  trying to remove a post. Moderators bypass enrollment.

I put existence (404) before enrollment (403) deliberately: a student legitimately
enrolled elsewhere gets a truthful "no such post" rather than a misleading 403,
and the two are seeded so the difference is testable. (If leaking existence to
unauthorized users were a concern, I'd flip to 403-first; noted as a conscious
trade-off.)

The **"own list only"** rule is enforced *structurally*: `/api/saved` takes no
user-id parameter, so there is simply no way to request someone else's list.

Status-code mapping is centralized: the domain/repo throws typed `AppError`s and
`src/server/http.ts` wraps every handler to map `AppError`/`ZodError` → HTTP, so
handlers stay thin (parse → authorize → call service → return).

## Fetching `hasSaved` / `savesCount` efficiently (no N+1)

This is called out in the brief, so it drove the query design. For a page of
posts, both flags come from **one query**, not one-query-per-post:

- `LEFT JOIN saved_posts … ON post_id = posts.id AND unsaved_at IS NULL` — join
  only *active* saves.
- `savesCount` = `count(saved_posts.id)` grouped by post.
- `hasSaved` = `max(case when saved_posts.user_id = :me then 1 else 0 end)`.

See `getCourseFeed` and `getSavedList` in `src/server/repo.ts`. The saved list
uses a second aliased join (`all_saves`) to aggregate the count while the primary
join defines list membership + ordering.

## Pagination — keyset, not OFFSET

`(timestamp, id)` keyset cursors (`src/server/pagination.ts`), opaque base64.
Stable under inserts/removals and cheap at scale; maps cleanly onto React
Query's `useInfiniteQuery` + a "Load more" button. Feed orders by
`(createdAt desc, id desc)`; saved by `(savedAt desc, id desc)`.

## Client data layer

- **Query-key factory** (`src/lib/query-keys.ts`) — every key is scoped by
  `userId`, so switching identity never serves another user's cached data.
- **Optimistic toggle** (`src/hooks/useToggleSave.ts`) — flips `hasSaved` and
  adjusts `savesCount` across all cached feeds immediately (and drops the row
  from the saved list on un-save), rolls back on error, and invalidates on
  settle so the server's authoritative counts win. Keeps the toggle responsive
  and the cache consistent after a mutation.
- **Typed client** (`src/lib/api-client.ts`) — attaches auth headers and
  **Zod-parses** responses, so the wire contract is validated on the way in.

## i18n

All user-facing strings come from message catalogs (`src/i18n/en.ts`,
`es.ts`) — two locales, keys kept in sync by typing Spanish against the English
key set. Pluralization uses `Intl.PluralRules` (`src/domain/plural.ts`), so
"1 save" / "12 saves" (and the Spanish forms) are correct rather than naive
string concatenation. Locale is switchable in the UI.

## Tests (`npm test`)

- **Unit, no DB** — `domain/saves.test.ts` (idempotent double-save doesn't
  double-count; un-save→re-save reactivates the same record with `createdAt`
  preserved; count derivation) and `plural.test.ts` (en + es).
- **API integration** — `test/api.test.ts` drives the **real route handlers**
  against a fresh temp SQLite DB: the authorization boundary (401 / 403 / 404,
  own-list isolation, moderator-only remove) and the happy path (save hydrates
  flags and shows in the feed; idempotent second save; un-save → re-save).

## Trade-offs & things deliberately descoped

- **Stack substitutions vs the "preferred" column.** Node (not Bun) and
  Next.js route handlers (not a standalone Elysia server) because Bun/Docker
  weren't available in this environment; **SQLite via libsql** instead of
  Postgres to keep it zero-infra and runnable from a clean checkout — all of
  these are explicitly allowed substitutes. libsql (rather than better-sqlite3)
  because it ships prebuilt binaries and compiles cleanly on Node 26. The schema
  is standard SQL and would map to Postgres+Drizzle with only the driver
  changed.
- **No real auth** — per the brief; identity is header-based and the UI has a
  dev user switcher.
- **Concurrency** — the unique `(userId, postId)` index is the source of truth:
  a concurrent double-save can't create two active rows, and the save path uses
  `INSERT … ON CONFLICT DO UPDATE` so a race collapses into a reactivation
  rather than an error.
- **Descoped to respect the time box**: comments/likes/views beyond what "Saved
  Posts" needs, real login, deployment, an admin UI, and an e2e browser test.

## What I'd do next with another day

- Swap the driver to **Postgres + Docker Compose** (schema already portable).
- **Playwright e2e** covering the optimistic toggle and the empty state.
- Infinite-scroll (intersection observer) instead of a "Load more" button.
- A `moderator` UI affordance for post removal (the API exists; no UI yet).
- More locales + externalized catalogs (JSON/ICU) and a formatted-message helper.
- Rate-limiting / audit trail on saves; a composite index on
  `saved_posts(user_id, saved_at)` to back the saved-list keyset at scale.
