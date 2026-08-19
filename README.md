# TaskFlow Frontend — RBAC Console

A role-aware React dashboard for the TaskFlow API: sidebar navigation, per-role views, a live profile, charts, and full task CRUD gated by `ADMIN` / `MANAGER` / `TEAM_LEAD` / `USER` permissions.

## v4 changes

- **Added the `TEAM_LEAD` role throughout.** Sidebar, route guards, the Dashboard's org-wide view, and task create/edit/delete permissions all now recognize `TEAM_LEAD` alongside `ADMIN`/`MANAGER`, matching the backend's `@PreAuthorize("hasAnyRole('ADMIN','MANAGER','TEAM_LEAD')")` on the task endpoints and the role-update endpoint.
- **Rewrote the role-change rules to match the backend exactly** (`utils/roles.js`): no one can change their own role, and — new in this version — **no one can change the role of someone who holds the same role as them** (Admin can't touch another Admin, Manager can't touch another Manager, Team Lead can't touch another Team Lead). Team Leads can promote a User up to Team Lead only; Managers can promote up to Manager but never Admin.
- **Fixed a real permission mismatch**: `GET /api/users` is actually `ADMIN`-only on the backend, not `ADMIN`/`MANAGER` as previously assumed — Manager and Team Lead were silently getting 403s from this call. Both the Team page and the task assignee picker now use `GET /api/users/workspace` for non-Admin roles, which is what those roles are actually allowed to call (and it's workspace-scoped, which fits the multi-tenant model better anyway).
- **Added workspace support**: a new `/workspaces` page (open to everyone — the backend's `GET /api/workspaces` has no role restriction) where any user can join a workspace once, `ADMIN`/`MANAGER` can rename one, and `ADMIN` can create new ones. This is the self-service front end for the backend's "join once, out of General or unassigned only" rule.
- **Registration now sends a `workspaceId`** (required by the backend's `UserRequest`). Since there's no public way to list workspaces before you're authenticated, every new account is registered into the seeded **General** workspace (`id 0`) and can move to a real team from the Workspaces page after logging in.
- **Corrected the scheduler countdown**: the backend's actual sweep interval is `@Scheduled(fixedRate = 250000)` (250s), not 500s as assumed in v3.2. `SchedulerPulse` and the sidebar's footer text now both reflect 250s.
- **Backend fixes made alongside this frontend update** (not frontend files, but required for the features above to actually work): `data.sql` was inserting the string `'General'` into the numeric `id` column instead of `0`, so the workspace this frontend assumes exists might not have (fixed, and made idempotent); `WorkspaceController.createWorkspace` used an invalid `@PreAuthorize("role('ADMIN')")` expression, which would have thrown at evaluation time (fixed to `hasRole('ADMIN')`); and `WorkspaceService.createWorkspace` was never calling `.save(...)`, so no workspace created through the API actually persisted (fixed).

## v3.2 changes

- **Fixed a real React bug**: `SchedulerPulse` called its parent's `setState` (via `onSweep`) from inside another state updater during render, triggering "Cannot update a component while rendering a different component." Moved the sweep notification into its own `useEffect`, which runs safely after commit.
- **Scheduler interval corrected**: matches the backend's actual `@Scheduled(fixedRate = 500000)` (500s), not the previously assumed 60s. The countdown now shows `mm:ss` since 500s doesn't read well as a bare seconds count.
- **Admin can now promote someone to Admin.** That restriction was my own unrequested addition, not something you asked for — removed. Admin still can't edit an *existing* Admin's role (that stays an out-of-band action), but can now set a User's or Manager's new role to Admin.
- **Manager could never actually change a User's role** (fixed last round, worth restating): Managers can set a User's role to User or Manager, not just User.
- **Task creation/editing consolidated to the All Tasks tab only** — no longer appears on My Tasks / Assigned to Me.
- **Card and table view toggle**, available wherever tasks are listed (My Tasks, Assigned, All Tasks). Preference persists across visits. The card view shows reporter, assignee, and due date+time directly on each card with a status-colored rail — closer to the original card design.
- **Light / dark mode toggle** (sun/moon icon in the top bar). Light mode brings back the warm canvas + teal accent look from the very first version; dark mode is the console-panel look from v2/v3. Preference persists and defaults to your OS setting on first visit. Charts (StatusBreakdownChart, AssigneeLoadChart) and the scheduler ring now use theme-aware colors instead of hardcoded dark values.
- **Every failed API call now surfaces a toast automatically** — wrong password, expired session (401), forbidden (403), server errors, even the API being unreachable — via a small pub/sub (`utils/toastBus.js`) that `client.js` emits into regardless of whether the calling page also shows its own inline error. Login/Register keep their inline error text *and* now also get the toast.

## v3.1 fixes

- **Manager could never actually promote a User to Manager** — the role-change modal offered Manager only "USER" as the new role for a target (who is already a User), so the submit button was always disabled. Fixed: Managers can still only *act on* User accounts (never touch a Manager/Admin account), but can now set the new role to User **or** Manager. Admins are unaffected.
- **"New task" and Edit/Delete were showing on every tab** (My Tasks, Assigned to Me, All Tasks) since `TaskBoard` derived creation rights from role alone. Task creation and editing now live only on the **All Tasks** tab — pass `allowCreate` explicitly per page (see `AllTasks.jsx` vs `MyTasks.jsx`/`AssignedTasks.jsx`).
- Cleaned up empty-state text in the task table: unassigned tasks now say "Unassigned" and tasks with no due date say "No due date" instead of a bare `—`, which read as broken/missing data.
- Reminder: the due-date-with-time and assignee columns were already correct in this codebase (`TaskList.jsx`) — if you were seeing missing time/assignee, double check you're running **this** project and not an older `taskflow-frontend` folder from before v2/v3.

## v3 changes

- **Fixed a due-date bug**: task create/edit could send a date-only string (e.g. `"2026-07-25"`) to the API, which the backend's `LocalDateTime` deserializer rejects with a 400. Date handling now goes through `src/utils/date.js`, which normalizes `datetime-local` input into a full `yyyy-MM-ddTHH:mm:ss` string and throws a clear validation error instead of silently sending a partial value.
- **Added role management**: the Team page (`/users`) now lets `ADMIN`/`MANAGER` change a user's role, enforcing the same hierarchy as the backend:
  - `ADMIN` → can change a `USER`'s or `MANAGER`'s role (never another `ADMIN`'s, never their own)
  - `MANAGER` → can change a `USER`'s role only (never a `MANAGER`'s/`ADMIN`'s, never their own)
  - Promoting someone to `ADMIN` is intentionally not offered through this UI — see `src/utils/roles.js`.
  - This is UI-level gating only; the real enforcement has to live in the API, since anyone can bypass frontend checks with a raw HTTP request.
  - The modal flags that a role change won't visibly take effect for the affected user until they next log in, since their current session token still carries the old role.

## A note on `npm audit`

Running `npm install` will report a few vulnerabilities. Here's what they actually are and what I did about each:

- **`react-router` / `react-router-dom` (moderate + high)** — two CVEs (an open redirect and an RSC-mode CSRF issue). I checked both advisories: **neither applies to this app**, because both explicitly only affect React Router's Framework Mode / Data Mode / RSC Server Actions — this app uses plain Declarative Mode (`<BrowserRouter>`), which both advisories call out as unaffected. I still bumped `react-router-dom` from `6.30.4` → `7.18.1` (the latest patched line) since it was a clean, no-code-change upgrade — verified with a production build and a dev-server route check.
- **`esbuild`/`vite` (moderate)** — this only affects the local dev server accepting cross-origin requests while `npm run dev` is running; it has no effect on the production build you ship. The fix requires jumping to `vite@8`, a breaking major-version change to the build tool, which isn't worth it for a dev-only, low-severity issue. Left as-is; revisit if/when you're doing a deliberate Vite 8 migration.



## Stack

React 18 + Vite + React Router + Tailwind CSS + Recharts (charts) + lucide-react (icons).

## Run it

```bash
npm install
npm run dev
```

Points at `http://localhost:8080` by default. To change it, create `.env.local`:

```
VITE_API_BASE=http://localhost:8080
```

## ⚠️ Backend CORS

If you hit `Access to fetch ... has been blocked by CORS policy`, add a CORS config on the backend allowing `http://localhost:5173` (see `SecurityConfig`). This bit the previous version of this frontend too — it's a backend-side fix, not something the frontend can work around.

## ⚠️ Assumed API shapes

The backend README documents the endpoints below, but not the exact JSON shapes. This frontend assumes:

- **`TaskResponse`** includes nested reporter/assignee objects:
  ```json
  {
    "id": 1,
    "title": "...",
    "description": "...",
    "dueDate": "2026-08-01T10:00:00",
    "status": "PENDING",
    "reporter": { "id": 3, "username": "amina", "email": "amina@x.com" },
    "assignee": { "id": 5, "username": "khaled", "email": "khaled@x.com" }
  }
  ```
- **`GET /api/users`** returns `[{ id, username, email, role }]`.
- **`PATCH /api/users/{id}/role`** accepts `{ "role": "MANAGER" }` and enforces the hierarchy server-side.
- **`PATCH /api/tasks/{id}/status`** accepts `{ "status": "IN_PROGRESS" }`.
- **`POST /api/tasks`** accepts an `assigneeId` field to set the assignee at creation time.

If your DTOs differ, the only places that need adjusting are `src/api/client.js` and the `task.reporter` / `task.assignee` reads in `TaskList.jsx`, `TaskForm.jsx`, `Dashboard.jsx`, and `Profile.jsx`.

## What's inside

### Role-aware navigation
The sidebar shows **All Tasks** and **Team** only to `ADMIN`/`MANAGER`. Routes are gated server-side-equivalent on the client too (`RequireRole`), so a `USER` hitting `/users` directly gets redirected, not just hidden-but-reachable.

### Dashboard
- `ADMIN`/`MANAGER` see org-wide stats: total/pending/completed/overdue across every task, a status-breakdown donut, and a workload-by-assignee bar chart.
- `USER` sees the same stat cards scoped to tasks they report or are assigned, plus a recent-tasks list instead of the team chart.

### Task boards (My Tasks / Assigned to Me / All Tasks)
One shared `TaskBoard` component powers all three views — search, status filter, create (role-gated), inline status change (for the task's reporter/assignee, matching the `PATCH .../status` permission), and edit/delete (role-gated to `ADMIN`/`MANAGER`).

### Team page
Grid of every user with an avatar, name, email, and role badge. `ADMIN`/`MANAGER` only.

### Profile
Every user gets one: avatar, email, role badge, how many tasks they report vs. are assigned, and a personal status-breakdown chart.

### Toasts
Create/update/delete/status-change actions confirm with a toast instead of a silent state update, so multi-step RBAC actions (like reassigning a task) don't feel ambiguous.

## Design notes

- **Palette**: ink `#0F1319` background, panel `#1A2029`, four status colors (amber/blue/teal/rust for pending/in-progress/completed/overdue), and three **role** colors — violet for Admin, sky-blue for Manager, neutral fog for User — kept visually distinct from the status colors so a table showing both a role badge and a status chip never reads as one system.
- **Type**: Space Grotesk (headings) / Inter (body) / JetBrains Mono (labels, timestamps, status/role chips) — carried over from the base project for a consistent console feel across both versions of this app.
- **Signature element**: the ring-and-countdown widget in the topbar (`SchedulerPulse`) mirrors the backend's real 60-second overdue sweep and re-fetches the current view on each tick, so status changes never feel unexplained.

## Structure

```
src/
├── api/client.js              fetch wrapper, JWT attach, token storage
├── context/
│   ├── AuthContext.jsx        auth state, register/login/logout, hasRole()
│   └── ToastContext.jsx       lightweight toast notifications
├── components/
│   ├── Layout.jsx, Sidebar.jsx, Topbar.jsx
│   ├── ProtectedRoute.jsx, RequireRole.jsx
│   ├── Avatar.jsx, RoleBadge.jsx, StatusChip.jsx, StatCard.jsx
│   ├── TaskForm.jsx, TaskList.jsx, SchedulerPulse.jsx
│   └── StatusBreakdownChart.jsx, AssigneeLoadChart.jsx
└── pages/
    ├── Login.jsx, Register.jsx
    ├── Dashboard.jsx, TaskBoard.jsx
    ├── MyTasks.jsx, AssignedTasks.jsx, AllTasks.jsx
    ├── UsersPage.jsx, Profile.jsx
```

## A few more suggestions, if you want to keep going

- **Refresh tokens** — the backend roadmap already lists this; once it exists, wire a silent-refresh interceptor into `api/client.js` so sessions don't hard-expire mid-use.
- **Optimistic assignee reassignment** — right now editing a task's assignee requires the full edit drawer; a quick inline "reassign" dropdown next to the assignee avatar (same pattern as the status dropdown) would make triage faster for managers.
- **Pagination** — `GET /api/tasks/all` will get slow with real data volume; add `page`/`size` params on the backend and a simple "load more" or page control here once it exists.
- **Notifications on assignment** — a bell icon with "you were assigned a task" events would close the loop nicely, especially paired with WebSocket or polling.
