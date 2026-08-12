# AGENTS.md

## Workout Planner

This repository contains a lightweight personal workout calendar built with:

* Vue 3
* Vite
* JavaScript
* Tailwind CSS
* Vue Router
* Dexie.js / IndexedDB
* FullCalendar

## Primary rule

Keep the project simple.

Prefer the solution with fewer files, fewer dependencies, fewer abstractions, and less code when it satisfies the requirement cleanly.

Do not introduce enterprise architecture.

Do not add backend infrastructure.

Do not add Pinia, APIs, authentication, cloud databases, service layers, repositories, composables, or additional libraries unless an actual requirement clearly needs them.

## Expected structure

Keep the application close to:

```text
src/
├── views/
│   ├── Dashboard.vue
│   ├── Calendar.vue
│   ├── People.vue
│   └── Reports.vue
├── App.vue
├── db.js
├── main.js
├── main.css
└── router.js
```

Add files only when they solve a concrete maintainability problem.

## Database

Dexie tables:

```text
persons
workouts
exercises
```

Preserve existing IndexedDB data when changing the schema.

## Workflow

Before coding:

1. inspect relevant files;
2. understand existing behavior;
3. implement the smallest clean change;
4. modify only related files;
5. run the relevant checks;
6. report what changed.

Never refactor unrelated code during a feature task.

## Product modules

* Dashboard
* Calendar
* People
* Reports

Calendar is the primary workflow.

## Engineering principle

Workout Planner is a personal tool, not an enterprise SaaS product.

Keep it light.
