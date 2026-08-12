# Workout Planner — Developer Documentation

Technical documentation for **Workout Planner**, a lightweight personal workout calendar and exercise tracker. The app is frontend-only: all data stays in the browser via IndexedDB (Dexie.js). There is no backend, authentication, or cloud sync.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Production Build](#production-build)
- [Deploy on Cloudflare Pages](#deploy-on-cloudflare-pages)
- [Project Structure](#project-structure)
- [Application Modules](#application-modules)
- [Routing](#routing)
- [Database](#database)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## Project Overview

Workout Planner is a personal-use SPA for managing people, planning workouts on a calendar, attaching exercises to workouts, and reviewing simple local reports.

Current scope in the codebase:

- App shell with dark-first theme toggle and mobile-first navigation
- Dexie IndexedDB database with `persons`, `workouts`, and `exercises` tables
- **People** CRUD (name + color)
- **Calendar** month view (FullCalendar) with create/edit/delete workouts and exercises
- **Dashboard** presence metrics for the current month
- **Reports** attendance-style totals plus JSON backup export/import

Data never leaves the browser. Clearing site data removes local records.

## Technology Stack

Only technologies present in `package.json` / project config:

| Technology | Purpose |
| --- | --- |
| Vue 3 | UI framework |
| Vite 6 | Dev server and production bundler |
| JavaScript (ES modules) | Application language (`"type": "module"`) |
| Tailwind CSS 4 (`@tailwindcss/vite`) | Styling |
| Vue Router 4 | Client-side routing |
| Dexie.js 4 | IndexedDB wrapper |
| `@fullcalendar/core` | Calendar engine |
| `@fullcalendar/daygrid` | Month grid view |
| `@fullcalendar/interaction` | Date/event click handling |

## Requirements

- **Node.js** (current LTS recommended; no `engines` field is set in `package.json`)
- **npm** (comes with Node.js)
- **Git** (to clone the repository)

## Installation

```bash
git clone https://github.com/Gulivers/workout-presence.-.git
cd workout-presence
npm install
```

If the local folder name differs, `cd` into whatever directory contains `package.json`.

## Running the Application

Start the Vite development server from the project root:

```bash
npm run dev
```

Open the app locally at:

**http://127.0.0.1:5173/**

That is the default local URL used for this project. Vite may also print `http://localhost:5173/`; both point at the same dev server when bound to that host/port.

Useful routes while developing:

| URL | Module |
| --- | --- |
| http://127.0.0.1:5173/ | Dashboard |
| http://127.0.0.1:5173/calendar | Calendar |
| http://127.0.0.1:5173/people | People |
| http://127.0.0.1:5173/reports | Reports |

## Production Build

Build static assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Output is written to `dist/`.

## Deploy on Cloudflare Pages

Preferred public host for this static SPA: [Cloudflare Pages](https://pages.cloudflare.com/).

Connect the GitHub repo (or upload `dist/`) with:

| Setting | Value |
| --- | --- |
| Framework preset | Vite (or None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 22 (or current LTS) |

Public URL shape:

`https://<project-name>.pages.dev`

Custom domains can be attached in the Cloudflare dashboard.

`public/_redirects` contains:

```text
/*    /index.html   200
```

That SPA fallback keeps Vue Router history links (`/calendar`, `/people`, etc.) working on refresh.

Note: IndexedDB data stays in each visitor’s browser. Deploying to Cloudflare does not sync workout data between devices.

## Project Structure

Actual layout under the project root (application source):

```text
workout-presence/
├── public/
│   ├── _redirects         # Cloudflare Pages SPA fallback
│   └── assets/            # Static assets (e.g. leaf texture)
├── index.html
├── package.json
├── vite.config.js
├── AGENTS.md
├── README.md
├── PRODUCT.md
├── DESIGN.md
├── developer-docs/
│   └── README.md          ← this file
└── src/
    ├── App.vue            # Shell, theme toggle, mobile/desktop nav
    ├── main.js            # Vue bootstrap, theme boot, db.open()
    ├── main.css           # Tailwind + design tokens + component classes
    ├── router.js          # Route definitions
    ├── db.js              # Dexie database + schema
    └── views/
        ├── Dashboard.vue
        ├── Calendar.vue
        ├── People.vue
        └── Reports.vue
```

Key root files:

| File | Role |
| --- | --- |
| `index.html` | HTML entry; mounts `#app`, loads fonts, loads `/src/main.js` |
| `vite.config.js` | Enables Vue + Tailwind plugins; excludes FullCalendar packages from `optimizeDeps` |
| `package.json` | Dependencies and npm scripts (`dev`, `build`, `preview`) |
| `AGENTS.md` | Agent/contributor constraints (keep the app simple) |

## Application Modules

### Dashboard (`/`)

Implemented. Reads `persons`, `workouts`, and `exercises` and shows:

- Optional person filter
- Workout and exercise counts for the current calendar month
- Most recent workout (on or before today)
- Next planned workout (after today)
- Link through to Calendar

### Calendar (`/calendar`)

Primary workflow. Uses FullCalendar dayGrid month view:

- Person filter and color legend
- Click a date to create a workout
- Click an event to edit/delete a workout
- Workout fields: person, date, title, notes
- Exercise rows: name, sets, repetitions, weight
- Cascading delete of exercises when a workout is deleted

### People (`/people`)

Implemented. Manages the `persons` table:

- List people ordered by name
- Add a person (name + color swatch)
- Edit name/color
- Delete a person, with confirmation
- On delete, cascading removal of that person’s workouts and related exercises

Name is required (trimmed). Color is chosen from a fixed palette of six hex colors.

### Reports (`/reports`)

Implemented. Local analytics and backup:

- Total sessions
- Workouts by person
- Workouts per month (last 12 month keys present in data)
- Exercises performed (top counts by exercise name)
- Export all tables as JSON
- Import JSON backup (replaces current local data after confirmation)

### App shell

- Dark-first visual system (gold accent, charcoal panels)
- Theme toggle persisted in `localStorage` key `workout-planner-theme`
- Mobile-first navigation overlay; horizontal nav from the `md` breakpoint up

## Routing

Defined in `src/router.js` with `createWebHistory()`:

| Path | Name | Component |
| --- | --- | --- |
| `/` | `dashboard` | `Dashboard.vue` |
| `/calendar` | `calendar` | `Calendar.vue` |
| `/people` | `people` | `People.vue` |
| `/reports` | `reports` | `Reports.vue` |

Navigation links are rendered in `App.vue` and highlight the active route by exact path match.

## Database

Defined in `src/db.js`. Database name: **`WorkoutPlanner`**. Schema version: **1**.

```js
db.version(1).stores({
  persons: '++id, name, color',
  workouts: '++id, personId, date, title',
  exercises: '++id, workoutId, exercise',
})
```

| Table | Primary key | Indexed fields | Fields used in app today |
| --- | --- | --- | --- |
| `persons` | auto-increment `id` | `name`, `color` | `id`, `name`, `color` |
| `workouts` | auto-increment `id` | `personId`, `date`, `title` | also stores non-indexed `notes` |
| `exercises` | auto-increment `id` | `workoutId`, `exercise` | also stores non-indexed `sets`, `reps`, `weight` |

Dexie still persists non-indexed properties. Schema indexes define query keys, not the full object shape.

`src/main.js` opens the database at startup with `db.open()`.

When changing the schema, preserve existing IndexedDB data (bump Dexie version and migrate carefully).

## Development Workflow

Aligned with `AGENTS.md`:

1. Inspect relevant files.
2. Understand existing behavior.
3. Implement the smallest clean change.
4. Modify only related files.
5. Run the relevant checks (`npm run dev` / `npm run build` as needed).
6. Report what changed.

Keep the project light: prefer fewer files, fewer dependencies, and fewer abstractions. Do not add Pinia, APIs, authentication, cloud databases, or enterprise layers unless a concrete requirement needs them.

## Troubleshooting

| Issue | What to try |
| --- | --- |
| Dependencies missing / import errors | Run `npm install` from the project root. |
| App not loading | Confirm the dev server is running and open **http://127.0.0.1:5173/**. |
| Dev server port already in use | Stop the other process, or start Vite with another port, e.g. `npx vite --host 127.0.0.1 --port 5174`. |
| FullCalendar blank / renderer issues | `vite.config.js` excludes FullCalendar from prebundling on purpose. Restart `npm run dev` after dependency changes. |
| Stale production preview | Rebuild with `npm run build`, then `npm run preview`. |
| Lost people / workouts | Data is local IndexedDB only. Clearing browser site data, using a private window, or another browser profile starts empty. |
| Theme stuck | Clear or set `localStorage` key `workout-planner-theme` to `dark` or `light`, then refresh. |
| Cascade delete confirmation | Deleting a person who has workouts prompts with the workout count and removes related workouts/exercises. |
| Import wiped data unexpectedly | Reports import replaces all local tables after confirmation. Keep an export backup first. |
