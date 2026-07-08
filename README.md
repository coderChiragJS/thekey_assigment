# Community Forum — Saved Posts

A small but complete full-stack slice: a paginated course-forum feed plus an
end-to-end **bookmark ("Saved Posts")** feature, with real authorization
enforced against a faked identity.

Single **Next.js 15 (App Router)** app · **TypeScript strict** · **Drizzle +
SQLite (libsql)** · **React Query v5** · **Zod** · **Vitest**.

> Design decisions, trade-offs, and "what I'd do next" live in **[NOTES.md](./NOTES.md)**.

## Setup — runnable from a clean checkout

Requires **Node 18+** (developed on Node 26) and npm. No Docker, no external
services — the database is a local SQLite file.

```bash
# 1. install
npm install

# 2. create schema + seed data (writes ./forum.db)
npm run db:setup

# 3. start the app  ->  http://localhost:3000  (redirects to /feed)
npm run dev

# run unit + API tests
npm test

# strict typecheck
npm run typecheck
```

All scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js app |
| `npm run build` / `start` | Production build / serve |
| `npm run db:setup` | `db:migrate` then `db:seed` |
| `npm run db:generate` | Regenerate a Drizzle migration from the schema |
| `npm test` | Run all Vitest suites (domain unit + API integration) |
| `npm run typecheck` | `tsc --noEmit` (strict) |

## Faked auth — how to act as different users

There is no login (out of scope). The client sends the current identity as
headers, and the API enforces authorization for real:

```
x-user-id: user_ada
x-role:    student   # or "moderator"
```

In the UI, use the **"Viewing as"** dropdown (top right) to switch between seeded
users. Switch to **Linus** and open the *TypeScript* course to see a `403`
(he's not enrolled); switch to the **moderator** to see every course.

### Seeded identities

| User | Role | Enrolled in |
| --- | --- | --- |
| Ada Lovelace (`user_ada`) | student | Intro to TypeScript, Database Design |
| Grace Hopper (`user_grace`) | student | Intro to TypeScript, UX Fundamentals |
| Linus Torvalds (`user_linus`) | student | Database Design |
| Margaret Hamilton (`user_mod`) | moderator | — (bypasses enrollment) |

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
