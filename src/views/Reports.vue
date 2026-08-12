<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Chart,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { db } from '../db'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
)

const people = ref([])
const workouts = ref([])
const exercises = ref([])
const loading = ref(true)
const error = ref('')
const backupMessage = ref('')
const backupError = ref('')
const importing = ref(false)
const fileInput = ref(null)
const chartCanvas = ref(null)
const selectedPersonId = ref('')

let attendanceChart = null
let themeObserver = null

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

/** Last 12 weeks with session + exercise counts (zeros included). */
const weeklyAttendance = computed(() => {
  const weeks = lastTwelveWeekStarts()
  const sessions = new Map(weeks.map((week) => [week, 0]))
  const exerciseCounts = new Map(weeks.map((week) => [week, 0]))
  const workoutDateById = new Map()
  const personFilter = selectedPersonId.value

  for (const workout of workouts.value) {
    if (
      personFilter &&
      String(workout.personId) !== String(personFilter)
    ) {
      continue
    }

    const key = weekStartKey(workout.date)
    workoutDateById.set(workout.id, workout.date)
    if (key && sessions.has(key)) {
      sessions.set(key, (sessions.get(key) || 0) + 1)
    }
  }

  for (const exercise of exercises.value) {
    const date = workoutDateById.get(exercise.workoutId)
    if (!date) continue
    const key = weekStartKey(date)
    if (!key || !exerciseCounts.has(key)) continue
    exerciseCounts.set(key, (exerciseCounts.get(key) || 0) + 1)
  }

  return weeks.map((week) => ({
    week,
    label: formatWeekAxis(week),
    sessions: sessions.get(week) || 0,
    exercises: exerciseCounts.get(week) || 0,
  }))
})

const attendanceTotals = computed(() => ({
  sessions: weeklyAttendance.value.reduce((sum, row) => sum + row.sessions, 0),
  exercises: weeklyAttendance.value.reduce((sum, row) => sum + row.exercises, 0),
}))

function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  return new Date(year, month - 1, 1).toLocaleString('en', {
    month: 'short',
    year: 'numeric',
  })
}

/** Sunday start of the week containing `dateStr` (YYYY-MM-DD). Weeks run Sun–Sat. */
function weekStartKey(dateStr) {
  const raw = String(dateStr || '')
  const [year, month, day] = raw.split('-').map(Number)
  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null

  date.setDate(date.getDate() - date.getDay())

  return toDateKey(date)
}

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function lastTwelveWeekStarts() {
  const today = new Date()
  const thisWeekKey = weekStartKey(toDateKey(today))
  const [year, month, day] = thisWeekKey.split('-').map(Number)
  const thisWeek = new Date(year, month - 1, day)
  const weeks = []

  for (let i = 11; i >= 0; i -= 1) {
    const week = new Date(thisWeek)
    week.setDate(thisWeek.getDate() - i * 7)
    weeks.push(toDateKey(week))
  }

  return weeks
}

function formatWeekAxis(weekStart) {
  const [year, month, day] = weekStart.split('-').map(Number)
  if (!year || !month || !day) return weekStart
  const date = new Date(year, month - 1, day)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}-${dd}-${date.getFullYear()}`
}

function getChartTheme() {
  const root = getComputedStyle(document.documentElement)
  const isDark = document.documentElement.classList.contains('dark')
  const gold = root.getPropertyValue('--color-gold').trim() || 'oklch(84% 0.19 80.46)'
  const silver = root.getPropertyValue('--color-silver').trim() || '#c0c0c0'
  const line = root.getPropertyValue('--color-line').trim() || '#2a2a2a'
  const beige = root.getPropertyValue('--color-beige').trim() || '#e8e3d8'
  const silverDim = root.getPropertyValue('--color-silver-dim').trim() || '#a3a3a3'

  return {
    gold,
    silver,
    goldFill: isDark ? 'rgba(224, 180, 74, 0.28)' : 'rgba(196, 148, 42, 0.22)',
    silverFill: isDark ? 'rgba(192, 192, 192, 0.18)' : 'rgba(120, 110, 95, 0.16)',
    text: isDark ? silverDim : '#5c564c',
    grid: isDark ? line : 'rgba(42, 42, 42, 0.12)',
    legend: isDark ? beige : '#1a1814',
  }
}

function destroyAttendanceChart() {
  if (attendanceChart) {
    attendanceChart.destroy()
    attendanceChart = null
  }
}

function renderAttendanceChart() {
  if (!chartCanvas.value || loading.value) return

  const rows = weeklyAttendance.value
  const theme = getChartTheme()

  destroyAttendanceChart()

  attendanceChart = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Sessions',
          data: rows.map((row) => row.sessions),
          borderColor: theme.silver,
          backgroundColor: theme.silverFill,
          pointBackgroundColor: theme.silver,
          pointBorderColor: theme.silver,
          pointRadius: 4,
          pointHoverRadius: 5,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Exercises',
          data: rows.map((row) => row.exercises),
          borderColor: theme.gold,
          backgroundColor: theme.goldFill,
          pointBackgroundColor: theme.gold,
          pointBorderColor: theme.gold,
          pointRadius: 4,
          pointHoverRadius: 5,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: theme.legend,
            boxWidth: 14,
            boxHeight: 14,
            usePointStyle: false,
            font: {
              family: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif",
              size: 13,
            },
          },
        },
        tooltip: {
          backgroundColor: '#171717',
          titleColor: '#e8e3d8',
          bodyColor: '#c0c0c0',
          borderColor: '#2a2a2a',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: {
            color: theme.text,
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12,
            font: {
              size: 11,
            },
          },
          grid: {
            color: theme.grid,
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: theme.text,
            precision: 0,
            font: {
              size: 11,
            },
          },
          grid: {
            color: theme.grid,
          },
          border: {
            display: false,
          },
        },
      },
    },
  })
}

async function refreshAttendanceChart() {
  await nextTick()
  renderAttendanceChart()
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

    if (
      selectedPersonId.value &&
      !personRows.some((person) => String(person.id) === String(selectedPersonId.value))
    ) {
      selectedPersonId.value = ''
    }
  } catch (err) {
    error.value = 'Could not load reports.'
    console.error(err)
  } finally {
    loading.value = false
    await refreshAttendanceChart()
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

onMounted(() => {
  loadData()
  themeObserver = new MutationObserver(() => {
    if (!loading.value) renderAttendanceChart()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
  destroyAttendanceChart()
})

watch(weeklyAttendance, () => {
  if (!loading.value) refreshAttendanceChart()
})
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
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 class="font-display text-xl font-semibold uppercase tracking-[0.08em] text-beige">
              Weekly attendance
            </h3>
            <p class="mt-2 muted">
              Last 12 weeks — sessions and exercises as attendance and follow-through.
            </p>
          </div>

          <label class="flex w-full flex-col gap-1.5 sm:w-56">
            <span class="field-label">Person</span>
            <select
              v-model="selectedPersonId"
              class="field-input disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!people.length"
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

        <div class="rounded-md border border-line bg-panel px-3 py-4 sm:px-4">
          <div class="mb-4 flex flex-wrap gap-6">
            <div>
              <p class="metric-label">Sessions</p>
              <p class="metric-value mt-1">{{ attendanceTotals.sessions }}</p>
            </div>
            <div>
              <p class="metric-label">Exercises</p>
              <p class="metric-value mt-1">{{ attendanceTotals.exercises }}</p>
            </div>
          </div>

          <div class="relative h-72 w-full sm:h-80">
            <canvas
              ref="chartCanvas"
              aria-label="Area chart of sessions and exercises over the last 12 weeks"
            />
          </div>
        </div>
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
