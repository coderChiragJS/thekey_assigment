# Community Forum — Saved Posts

A small but complete full-stack slice: a paginated course-forum feed plus an
end-to-end **bookmark ("Saved Posts")** feature, with real authorization
enforced against a faked identity.

Single **Next.js 15 (App Router)** app · **TypeScript strict** · **Drizzle +
SQLite (libsql)** · **React Query v5** · **Zod** · **Vitest**.

> Design decisions, trade-offs, and "what I'd do next" live in **[NOTES.md](./NOTES.md)**.

## Prerequisites

- **Node.js 18 or newer** (developed on Node 26) — check with `node -v`
- **npm** (comes with Node)

That's it. No Docker, no Postgres, no external services — the database is a local
SQLite file created by the setup step.

## Quick start

Copy-paste this whole block from a clean checkout:

```bash
npm install        # 1. install dependencies
npm run db:setup   # 2. create the schema + seed data (writes ./forum.db)
npm run dev        # 3. start the app
```

Then open **http://localhost:3000** (it redirects to `/feed`).

Run the tests and type checker any time:

```bash
npm test           # unit + API integration tests (24 tests)
npm run typecheck  # strict TypeScript, no emit
```

### All scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the app (feed + saved views + API) at :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:setup` | `db:migrate` then `db:seed` (one-time, re-runnable) |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:seed` | Load deterministic seed data |
| `npm run db:generate` | Regenerate a migration after a schema change |
| `npm test` | All Vitest suites (domain unit + API integration) |
| `npm run typecheck` | `tsc --noEmit` (strict) |

> **Single Next.js app** — the "server" and "web" are the same process, so
> `npm run dev` starts both the API (route handlers) and the UI. There is no
> separate server to run.

### Troubleshooting

- **Port 3000 in use** → `npm run dev -- -p 3001`.
- **"no such table" / empty app** → run `npm run db:setup` (it creates `forum.db`).
- **Start over** → `rm -f forum.db && npm run db:setup`.

## Using the app

There is no login (out of scope). Use the two dropdowns in the top bar:

- **Viewing as** — switch between seeded users. Try **Linus** on the *Intro to
  TypeScript* course → he's not enrolled, so you get a graceful **403** state.
  Switch to the **moderator** to see every course.
- **Language** — English / Español (watch the saves count pluralize correctly).

Then toggle the **bookmark** on any post and open the **Saved** tab.

### Seeded identities

| User | Role | Enrolled in |
| --- | --- | --- |
| Ada Lovelace (`user_ada`) | student | Intro to TypeScript, Database Design |
| Grace Hopper (`user_grace`) | student | Intro to TypeScript, UX Fundamentals |
| Linus Torvalds (`user_linus`) | student | Database Design |
| Margaret Hamilton (`user_mod`) | moderator | — (bypasses enrollment) |

## Faked auth

The client sends the current identity as headers; the API enforces the rules for
real:

```
x-user-id: user_ada
x-role:    student   # or "moderator"
```

## API

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/api/courses` | Courses the caller may see |
| `GET` | `/api/feed?courseId=&cursor=&limit=` | Course feed, newest-first, hydrated with `hasSaved` + `savesCount` |
| `POST` | `/api/posts/:id/save` | Idempotent save → `{ hasSaved, savesCount }` |
| `DELETE` | `/api/posts/:id/save` | Idempotent un-save (soft delete) |
| `GET` | `/api/saved?cursor=&limit=` | Caller's own saved posts, most-recently-saved first |
| `DELETE` | `/api/posts/:id` | Moderator-only post removal |

Authorization: `401` unauthenticated · `403` acting in a course you're not
enrolled in / student removing a post · `404` unknown post or course. The saved
list takes no user id — it is always scoped to the caller.

Quick smoke test:

```bash
curl -s "localhost:3000/api/feed?courseId=course_ts101" \
  -H "x-user-id: user_ada" -H "x-role: student" | jq
```

## Deploying to Vercel (optional)

> Deployment is **out of scope** for the assessment — the app runs fully
> locally. This section is only if you want a live demo.

A local SQLite **file** can't be used on Vercel's serverless (read-only,
ephemeral) filesystem, so the database must be hosted. Since this app already
uses **libsql**, the zero-code-change path is **[Turso](https://turso.tech)**
(hosted libsql):

1. **Create a Turso database** (free tier) and grab its URL + token:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash   # install the CLI
   turso auth signup
   turso db create community-forum
   turso db show community-forum --url          # -> libsql://...turso.io
   turso db tokens create community-forum       # -> the auth token
   ```
2. **Migrate + seed the hosted DB once, from your machine:**
   ```bash
   DATABASE_URL='libsql://...turso.io' DATABASE_AUTH_TOKEN='...' npm run db:setup
   ```
3. **Deploy** — push to GitHub, import the repo in Vercel, and set two
   Environment Variables in the Vercel project settings:
   - `DATABASE_URL` = `libsql://...turso.io`
   - `DATABASE_AUTH_TOKEN` = the token from step 1

   Vercel auto-detects Next.js; no extra config needed.

No code changes are required — `src/db/client.ts` already reads
`DATABASE_AUTH_TOKEN` and works against either a local file or a hosted URL.
