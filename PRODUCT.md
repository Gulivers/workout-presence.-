# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are the owner, people who train with them, and family members. The app supports more than one person in a shared household or training circle. Each person is tracked distinctly so workouts stay attributable.

## Product Purpose

Workout Presence is a personal workout calendar and exercise tracker. Users register people, plan workouts by date, and attach exercises to those workouts. Success means seeing who trained when, and what they did, without leaving the browser or managing accounts.

## Positioning

Person-colored tracking, simple local planning, and attendance-oriented reports. Data stays on-device in IndexedDB; there is no cloud sync, login, or multi-tenant SaaS layer.

## Operating Context

Used as a lightweight personal tool at home or wherever the browser already is. Calendar is the primary workflow. People setup feeds the calendar; reports summarize attendance. No backend or enterprise process.

## Capabilities and Constraints

Confirmed capabilities:

- Manage people with a display name and color.
- Plan workouts on a calendar, filtered by person.
- Each exercise belongs to a workout.
- Minimum exercise fields: exercise name, sets, repetitions, weight.
- Local-only persistence via Dexie / IndexedDB (`persons`, `workouts`, `exercises`).
- Modules: Dashboard, Calendar (primary), People, Reports.

Confirmed constraints:

- Keep the architecture lightweight: few files, few dependencies, no Pinia/API/auth/cloud DB unless a concrete need appears.
- Styling stays Tailwind-based; do not introduce additional CSS frameworks. FullCalendar theming may use the small scoped overrides required by the library.
- Preserve existing IndexedDB data when changing schema.
- No authentication and no account system.

Open / not yet fully implemented in UI:

- Exercise create/edit UI and the richer exercise field set (name, sets, repetitions, weight) beyond the current schema placeholder.
- Dashboard and Reports beyond placeholders.
- Attendance reports as a first-class Reports experience.

## Brand Commitments

Product name (UI): **Workout Presence**. Architecture / repo naming may still say **Workout Planner**. Voice stays plain and practical. No separate marketing brand system was committed.

## Evidence on Hand

Runnable Vue 3 + Vite app with shell navigation, working People CRUD, Calendar month view (FullCalendar dayGrid) with person filter and color-coded events, Dexie schema v1. No testimonials, marketing copy, or external brand assets. Future work must not invent fake customers or claims.

## Product Principles

1. Calendar-first: planning and presence by date is the main job.
2. Person clarity: color and name make ownership obvious at a glance.
3. Local and private: data never requires a server.
4. Light by default: smallest clean change; avoid enterprise shape.
5. Honest incompleteness: placeholders stay clearly unfinished until built.

## Accessibility & Inclusion

No product-specific accessibility standard was set beyond ordinary usable web UI (readable text, keyboard-reachable controls, clear errors). Raise the bar only when a concrete user need is confirmed.
