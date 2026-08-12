<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '../db'

const people = ref([])
const workouts = ref([])
const exercises = ref([])
const selectedPersonId = ref('')
const loading = ref(true)
const error = ref('')

const today = new Date()
const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

const personMap = computed(() => {
  const map = new Map()
  for (const person of people.value) map.set(person.id, person)
  return map
})

const scopedWorkouts = computed(() => {
  if (!selectedPersonId.value) return workouts.value
  return workouts.value.filter(
    (workout) => String(workout.personId) === String(selectedPersonId.value),
  )
})

const workoutsThisMonth = computed(() =>
  scopedWorkouts.value.filter((workout) => String(workout.date || '').startsWith(monthKey)),
)

const workoutIdsThisMonth = computed(
  () => new Set(workoutsThisMonth.value.map((workout) => workout.id)),
)

const exercisesThisMonth = computed(() =>
  exercises.value.filter((exercise) => workoutIdsThisMonth.value.has(exercise.workoutId)),
)

const mostRecentWorkout = computed(() => {
  const sorted = [...scopedWorkouts.value]
    .filter((workout) => workout.date && workout.date <= formatDate(today))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  return sorted[0] || null
})

const nextWorkout = computed(() => {
  const sorted = [...scopedWorkouts.value]
    .filter((workout) => workout.date && workout.date > formatDate(today))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  return sorted[0] || null
})

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function personName(personId) {
  return personMap.value.get(personId)?.name || 'Unknown'
}

function monthLabel() {
  return today.toLocaleString('en', { month: 'long', year: 'numeric' })
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [personRows, workoutRows, exerciseRows] = await Promise.all([
      db.persons.orderBy('name').toArray(),
      db.workouts.toArray(),
      db.exercises.toArray(),
    ])
    people.value = personRows
    workouts.value = workoutRows
    exercises.value = exerciseRows
  } catch (err) {
    error.value = 'Could not load dashboard data.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <section class="space-y-10" aria-labelledby="dashboard-heading">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id="dashboard-heading" class="page-title">Dashboard</h2>
        <p class="page-lede">Presence for {{ monthLabel() }}.</p>
      </div>

      <label class="flex flex-col gap-1.5 text-sm sm:w-56">
        <span class="field-label">Person</span>
        <select
          v-model="selectedPersonId"
          class="field-input disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || !people.length"
        >
          <option value="">All people</option>
          <option
            v-for="person in people"
            :key="person.id"
            :value="String(person.id)"
          >
            {{ person.name }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-else>
      <p v-if="!people.length" class="muted">
        Add people on the
        <RouterLink to="/people" class="font-medium text-gold underline underline-offset-2">People</RouterLink>
        page to get started.
      </p>

      <div v-else class="space-y-8">
        <div
          class="flex flex-wrap items-baseline gap-x-8 gap-y-3 border-y border-line py-5 font-display"
        >
          <p>
            <span class="text-4xl font-semibold tracking-tight sm:text-5xl">{{
              workoutsThisMonth.length
            }}</span>
            <span class="ml-2 text-xs font-medium uppercase tracking-[0.18em] text-silver-dim"
              >workouts</span
            >
          </p>
          <p>
            <span class="text-4xl font-semibold tracking-tight sm:text-5xl">{{
              exercisesThisMonth.length
            }}</span>
            <span class="ml-2 text-xs font-medium uppercase tracking-[0.18em] text-silver-dim"
              >exercises</span
            >
          </p>
        </div>

        <dl class="grid gap-6 sm:grid-cols-2">
          <div>
            <dt class="metric-label">Most recent</dt>
            <dd v-if="mostRecentWorkout" class="mt-2">
              <p class="font-medium">{{ mostRecentWorkout.title }}</p>
              <p class="mt-1 muted">
                {{ mostRecentWorkout.date }} · {{ personName(mostRecentWorkout.personId) }}
              </p>
            </dd>
            <dd v-else class="mt-2 muted">None yet</dd>
          </div>
          <div>
            <dt class="metric-label">Next planned</dt>
            <dd v-if="nextWorkout" class="mt-2">
              <p class="font-medium">{{ nextWorkout.title }}</p>
              <p class="mt-1 muted">
                {{ nextWorkout.date }} · {{ personName(nextWorkout.personId) }}
              </p>
            </dd>
            <dd v-else class="mt-2 muted">None planned</dd>
          </div>
        </dl>

        <p class="muted">
          Manage sessions on the
          <RouterLink to="/calendar" class="font-medium text-gold underline underline-offset-2"
            >Calendar</RouterLink
          >.
        </p>
      </div>
    </template>
  </section>
</template>
