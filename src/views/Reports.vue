<script setup>
import { computed, onMounted, ref } from 'vue'
import { db } from '../db'

const people = ref([])
const workouts = ref([])
const exercises = ref([])
const loading = ref(true)
const error = ref('')
const backupMessage = ref('')
const backupError = ref('')
const importing = ref(false)
const fileInput = ref(null)

const personMap = computed(() => {
  const map = new Map()
  for (const person of people.value) map.set(person.id, person)
  return map
})

const totalSessions = computed(() => workouts.value.length)

const workoutsByPerson = computed(() => {
  const counts = new Map()
  for (const person of people.value) counts.set(person.id, 0)
  for (const workout of workouts.value) {
    counts.set(workout.personId, (counts.get(workout.personId) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([personId, count]) => ({
      personId,
      name: personMap.value.get(personId)?.name || `Person #${personId}`,
      color: personMap.value.get(personId)?.color || '#334155',
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const maxPersonCount = computed(() =>
  Math.max(1, ...workoutsByPerson.value.map((row) => row.count), 1),
)

const workoutsPerMonth = computed(() => {
  const counts = new Map()
  for (const workout of workouts.value) {
    const key = String(workout.date || '').slice(0, 7)
    if (!key || key.length < 7) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12)
})

const maxMonthCount = computed(() =>
  Math.max(1, ...workoutsPerMonth.value.map((row) => row.count), 1),
)

const exerciseTotals = computed(() => {
  const counts = new Map()
  for (const exercise of exercises.value) {
    const name = String(exercise.exercise || '').trim() || 'Untitled'
    counts.set(name, (counts.get(name) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 15)
})

function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  return new Date(year, month - 1, 1).toLocaleString('en', {
    month: 'short',
    year: 'numeric',
  })
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
    error.value = 'Could not load reports.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function exportBackup() {
  backupMessage.value = ''
  backupError.value = ''

  try {
    const [persons, workoutRows, exerciseRows] = await Promise.all([
      db.persons.toArray(),
      db.workouts.toArray(),
      db.exercises.toArray(),
    ])

    const payload = {
      app: 'WorkoutPlanner',
      version: 1,
      exportedAt: new Date().toISOString(),
      persons,
      workouts: workoutRows,
      exercises: exerciseRows,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `workout-planner-backup-${stamp}.json`
    link.click()
    URL.revokeObjectURL(url)
    backupMessage.value = 'Backup downloaded.'
  } catch (err) {
    backupError.value = 'Could not export backup.'
    console.error(err)
  }
}

function triggerImport() {
  fileInput.value?.click()
}

async function importBackup(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  backupMessage.value = ''
  backupError.value = ''

  if (
    !confirm(
      'Import will replace all current people, workouts, and exercises. Continue?',
    )
  ) {
    return
  }

  importing.value = true

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file.')
    }

    const persons = Array.isArray(data.persons) ? data.persons : null
    const workoutRows = Array.isArray(data.workouts) ? data.workouts : null
    const exerciseRows = Array.isArray(data.exercises) ? data.exercises : null

    if (!persons || !workoutRows || !exerciseRows) {
      throw new Error('Backup must include persons, workouts, and exercises.')
    }

    await db.transaction('rw', db.persons, db.workouts, db.exercises, async () => {
      await Promise.all([
        db.persons.clear(),
        db.workouts.clear(),
        db.exercises.clear(),
      ])

      if (persons.length) await db.persons.bulkAdd(stripMeta(persons))
      if (workoutRows.length) await db.workouts.bulkAdd(stripMeta(workoutRows))
      if (exerciseRows.length) await db.exercises.bulkAdd(stripMeta(exerciseRows))
    })

    await loadData()
    backupMessage.value = 'Backup imported successfully.'
  } catch (err) {
    backupError.value = err.message || 'Could not import backup.'
    console.error(err)
  } finally {
    importing.value = false
  }
}

function stripMeta(rows) {
  return rows.map((row) => {
    const copy = { ...row }
    return copy
  })
}

onMounted(loadData)
</script>

<template>
  <section class="space-y-10" aria-labelledby="reports-heading">
    <div>
      <h2 id="reports-heading" class="page-title">Reports</h2>
      <p class="page-lede">
        Simple totals from your local workout history.
      </p>
    </div>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-else>
      <div class="surface-rule pt-4">
        <p class="metric-label">Total sessions</p>
        <p class="metric-value mt-2">{{ totalSessions }}</p>
      </div>

      <div class="space-y-4">
        <h3 class="font-display text-xl font-semibold uppercase tracking-[0.08em] text-beige">
          Workouts by person
        </h3>
        <p v-if="!workoutsByPerson.length" class="muted">No people yet.</p>
        <ul v-else class="space-y-3">
          <li v-for="row in workoutsByPerson" :key="row.personId" class="space-y-1">
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="flex items-center gap-2 font-medium text-beige">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  :style="{ backgroundColor: row.color }"
                  aria-hidden="true"
                />
                {{ row.name }}
              </span>
              <span class="text-silver-dim">{{ row.count }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-panel-raised">
              <div
                class="gold-leaf ks-leaf-face h-1.5 rounded-full bg-gold"
                :style="{ width: `${(row.count / maxPersonCount) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </div>

      <div class="space-y-4">
        <h3 class="font-display text-xl font-semibold uppercase tracking-[0.08em] text-beige">
          Workouts per month
        </h3>
        <p v-if="!workoutsPerMonth.length" class="muted">No workouts yet.</p>
        <ul v-else class="space-y-3">
          <li v-for="row in workoutsPerMonth" :key="row.month" class="space-y-1">
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="font-medium text-beige">{{ formatMonth(row.month) }}</span>
              <span class="text-silver-dim">{{ row.count }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-panel-raised">
              <div
                class="gold-leaf ks-leaf-face h-1.5 rounded-full bg-gold"
                :style="{ width: `${(row.count / maxMonthCount) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </div>

      <div class="space-y-4">
        <h3 class="font-display text-xl font-semibold uppercase tracking-[0.08em] text-beige">
          Exercises performed
        </h3>
        <p v-if="!exerciseTotals.length" class="muted">No exercises yet.</p>
        <ul v-else class="divide-y divide-line">
          <li
            v-for="row in exerciseTotals"
            :key="row.name"
            class="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span class="font-medium text-beige">{{ row.name }}</span>
            <span class="text-silver-dim">{{ row.count }}</span>
          </li>
        </ul>
      </div>

      <div class="space-y-4 surface-rule pt-8">
        <div>
          <h3 class="font-display text-xl font-semibold uppercase tracking-[0.08em] text-beige">
            Backup
          </h3>
          <p class="mt-2 muted">
            Export or import all people, workouts, and exercises as JSON.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-primary" @click="exportBackup">
            Export JSON
          </button>
          <button
            type="button"
            class="btn-secondary"
            :disabled="importing"
            @click="triggerImport"
          >
            Import JSON
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="application/json,.json"
            class="hidden"
            @change="importBackup"
          />
        </div>

        <p v-if="backupMessage" class="muted">{{ backupMessage }}</p>
        <p v-if="backupError" class="text-sm text-danger">{{ backupError }}</p>
      </div>
    </template>
  </section>
</template>
