# Workout Presence

Personal workout calendar and exercise tracker. Data stays in your browser via IndexedDB (Dexie).

> Product UI name: **Workout Presence**. Architecture / codebase naming may still use **Workout Planner** (package, Dexie DB id, agent docs).

## Stack

- Vue 3
- Vite
- Tailwind CSS
- Vue Router
- Dexie.js / IndexedDB
- FullCalendar

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open locally: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deploy (Cloudflare Pages)

This app is a static SPA. On [Cloudflare Pages](https://pages.cloudflare.com/):

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (repo root) |

After deploy, the public URL looks like:

`https://<project-name>.pages.dev`

`public/_redirects` sends all routes to `index.html` so Vue Router deep links work.

## Local data

All people, workouts, and exercises are stored locally in IndexedDB. There is no backend and no account system. Clearing browser site data will remove your records.

Developer docs: [`developer-docs/README.md`](developer-docs/README.md)
