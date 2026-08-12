<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { db } from '../db'

const people = ref([])
const workouts = ref([])
const selectedPersonId = ref('')
const loading = ref(true)
const error = ref('')
const formError = ref('')
const saving = ref(false)
const calendarEl = ref(null)
const formOpen = ref(false)
const editingId = ref(null)

const form = ref(emptyForm())
const exerciseRows = ref([])

let calendar = null

const inputClass = 'field-input'

const filteredWorkouts = computed(() => {
  const personFilter = selectedPersonId.value
  if (!personFilter) return workouts.value
  return workouts.value.filter(
    (workout) => String(workout.personId) === String(personFilter),
  )
})

const selectedPerson = computed(() =>
  people.value.find((person) => String(person.id) === String(selectedPersonId.value)),
)

const formTitle = computed(() => (editingId.value ? 'Edit workout' : 'New workout'))

function emptyForm() {
  return {
    personId: '',
    date: '',
    title: '',
    notes: '',
  }
}

function emptyExerciseRow() {
  return {
    exercise: '',
    sets: '',
    reps: '',
    weight: '',
  }
}

function buildEvents() {
  const personMap = new Map(people.value.map((person) => [person.id, person]))

  return filteredWorkouts.value.map((workout) => {
    const person = personMap.get(workout.personId)
    const color = person?.color || '#334155'

    return {
      id: String(workout.id),
      title: workout.title || 'Workout',
      start: workout.date,
      allDay: true,
      backgroundColor: '#33302c',
      borderColor: color,
      textColor: '#f0ece3',
      classNames: ['wp-event'],
    }
  })
}

function syncEvents() {
  if (!calendar) return
  calendar.removeAllEvents()
  for (const event of buildEvents()) {
    calendar.addEvent(event)
  }
}

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    people.value = await db.persons.orderBy('name').toArray()
    workouts.value = await db.workouts.toArray()

    if (
      selectedPersonId.value &&
      !people.value.some((person) => String(person.id) === String(selectedPersonId.value))
    ) {
      selectedPersonId.value = ''
    }
  } catch (err) {
    error.value = 'Could not load calendar data. Refresh the page and try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
  form.value = emptyForm()
  exerciseRows.value = []
  formError.value = ''
}

function onOverlayClick(event) {
  if (event.target === event.currentTarget && !saving.value) {
    closeForm()
  }
}

function onModalKeydown(event) {
  if (event.key === 'Escape' && formOpen.value && !saving.value) {
    closeForm()
  }
}

watch(formOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

function openCreate(dateStr) {
  if (!people.value.length) return

  const defaultPerson =
    selectedPersonId.value ||
    (people.value[0] ? String(people.value[0].id) : '')

  editingId.value = null
  form.value = {
    personId: defaultPerson,
    date: dateStr,
    title: '',
    notes: '',
  }
  exerciseRows.value = [emptyExerciseRow()]
  formError.value = ''
  formOpen.value = true
}

async function openEdit(workoutId) {
  const workout = workouts.value.find((item) => String(item.id) === String(workoutId))
  if (!workout) return

  const exercises = await db.exercises.where('workoutId').equals(workout.id).toArray()

  editingId.value = workout.id
  form.value = {
    personId: String(workout.personId),
    date: workout.date,
    title: workout.title || '',
    notes: workout.notes || '',
  }
  exerciseRows.value = exercises.length
    ? exercises.map((item) => ({
        exercise: item.exercise || '',
        sets: item.sets ?? '',
        reps: item.reps ?? '',
        weight: item.weight ?? '',
      }))
    : [emptyExerciseRow()]
  formError.value = ''
  formOpen.value = true
}

function addExerciseRow() {
  exerciseRows.value.push(emptyExerciseRow())
}

function removeExerciseRow(index) {
  exerciseRows.value.splice(index, 1)
  if (!exerciseRows.value.length) {
    exerciseRows.value.push(emptyExerciseRow())
  }
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

async function saveWorkout() {
  const personId = Number(form.value.personId)
  const date = form.value.date
  const title = form.value.title.trim()
  const notes = form.value.notes.trim()

  if (!personId) {
    formError.value = 'Select a person.'
    return
  }
  if (!date) {
    formError.value = 'Date is required.'
    return
  }
  if (!title) {
    formError.value = 'Title is required.'
    return
  }

  const cleanedExercises = exerciseRows.value
    .map((row) => ({
      exercise: String(row.exercise || '').trim(),
      sets: parseOptionalNumber(row.sets),
      reps: parseOptionalNumber(row.reps),
      weight: parseOptionalNumber(row.weight),
    }))
    .filter((row) => row.exercise)

  saving.value = true
  formError.value = ''

  try {
    await db.transaction('rw', db.workouts, db.exercises, async () => {
      let workoutId = editingId.value

      if (workoutId) {
        await db.workouts.update(workoutId, {
          personId,
          date,
          title,
          notes,
        })
        await db.exercises.where('workoutId').equals(workoutId).delete()
      } else {
        workoutId = await db.workouts.add({
          personId,
          date,
          title,
          notes,
        })
      }

      if (cleanedExercises.length) {
        await db.exercises.bulkAdd(
          cleanedExercises.map((row) => ({
            workoutId,
            exercise: row.exercise,
            sets: row.sets,
            reps: row.reps,
            weight: row.weight,
          })),
        )
      }
    })

    closeForm()
    await loadData()
    syncEvents()
  } catch (err) {
    formError.value = 'Could not save workout.'
    console.error(err)
  } finally {
    saving.value = false
  }
}

async function deleteWorkout() {
  if (!editingId.value) return
  if (!confirm('Delete this workout and its exercises?')) return

  saving.value = true
  formError.value = ''

  try {
    const workoutId = editingId.value
    await db.transaction('rw', db.workouts, db.exercises, async () => {
      await db.exercises.where('workoutId').equals(workoutId).delete()
      await db.workouts.delete(workoutId)
    })

    closeForm()
    await loadData()
    syncEvents()
  } catch (err) {
    formError.value = 'Could not delete workout.'
    console.error(err)
  } finally {
    saving.value = false
  }
}

function initCalendar() {
  if (!calendarEl.value || calendar) return

  calendar = new Calendar(calendarEl.value, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    buttonText: {
      today: 'Today',
    },
    fixedWeekCount: false,
    dayMaxEvents: 3,
    dateClick(info) {
      openCreate(info.dateStr)
    },
    eventClick(info) {
      openEdit(info.event.id)
    },
  })

  calendar.render()
  syncEvents()
  calendar.updateSize()
}

watch([selectedPersonId, people, workouts], syncEvents)

onMounted(async () => {
  window.addEventListener('keydown', onModalKeydown)
  await loadData()
  await nextTick()
  initCalendar()
  await nextTick()
  calendar?.updateSize()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onModalKeydown)
  document.body.style.overflow = ''
  calendar?.destroy()
  calendar = null
})
</script>

<template>
  <section class="space-y-6" aria-labelledby="calendar-heading">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id="calendar-heading" class="page-title">Calendar</h2>
      </div>

      <label class="flex flex-col gap-1.5 text-sm sm:w-56">
        <span class="field-label">Person</span>
        <div class="relative">
          <svg
            class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-silver-dim"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <select
            v-model="selectedPersonId"
            class="field-input w-full pl-9 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading || !people.length"
            :aria-busy="loading"
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
        </div>
      </label>
    </div>

    <div
      v-if="!loading && people.length"
      class="flex flex-wrap gap-x-4 gap-y-2"
      aria-label="Person colors"
    >
      <div
        v-for="person in people"
        :key="person.id"
        class="flex items-center gap-2 text-sm text-silver-dim"
        :class="
          selectedPersonId && String(person.id) !== String(selectedPersonId)
            ? 'opacity-40'
            : ''
        "
      >
        <span
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: person.color }"
          aria-hidden="true"
        />
        <span>{{ person.name }}</span>
      </div>
    </div>

    <p v-if="loading" class="muted" role="status" aria-live="polite">
      Loading calendar…
    </p>

    <p v-else-if="error" class="text-sm text-danger" role="alert">
      {{ error }}
    </p>

    <p v-else-if="!people.length" class="muted">
      Add people on the
      <RouterLink to="/people" class="font-medium text-gold underline underline-offset-2 hover:text-gold-deep">
        People
      </RouterLink>
      page before creating workouts.
    </p>

    <p v-else-if="!workouts.length && !formOpen" class="muted">
      No workouts yet. Click a date on the calendar to add one.
    </p>

    <p
      v-else-if="selectedPerson && !filteredWorkouts.length && !formOpen"
      class="muted"
    >
      No workouts for {{ selectedPerson.name }} yet. Choose another person or show all people.
    </p>

    <div
      class="workout-calendar overflow-x-auto rounded-md border border-line bg-panel p-2 sm:p-4"
      :class="{ 'opacity-60': loading }"
      :aria-busy="loading"
    >
      <div ref="calendarEl" v-once></div>
    </div>

    <Teleport to="body">
      <div
        v-if="formOpen"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 p-4 sm:items-center sm:p-6"
        role="presentation"
        @click="onOverlayClick"
      >
        <form
          class="my-4 flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-[0_16px_48px_rgba(0,0,0,0.45)] sm:my-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workout-modal-title"
          @submit.prevent="saveWorkout"
          @click.stop
        >
          <div class="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-5">
            <h3
              id="workout-modal-title"
              class="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-beige"
            >
              {{ formTitle }}
            </h3>
            <button type="button" class="btn-ghost" :disabled="saving" @click="closeForm">
              Close
            </button>
          </div>

          <div class="space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="flex flex-col gap-1.5 text-sm">
                <span class="field-label">Person</span>
                <select v-model="form.personId" :class="inputClass" required>
                  <option disabled value="">Select person</option>
                  <option
                    v-for="person in people"
                    :key="person.id"
                    :value="String(person.id)"
                  >
                    {{ person.name }}
                  </option>
                </select>
              </label>

              <label class="flex flex-col gap-1.5 text-sm">
                <span class="field-label">Date</span>
                <input v-model="form.date" type="date" :class="inputClass" required />
              </label>

              <label class="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span class="field-label">Title</span>
                <input
                  v-model="form.title"
                  type="text"
                  maxlength="120"
                  placeholder="e.g. Upper body"
                  :class="inputClass"
                  required
                />
              </label>

              <label class="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span class="field-label">Notes</span>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  maxlength="1000"
                  placeholder="Optional notes"
                  :class="inputClass"
                />
              </label>
            </div>

            <div class="space-y-3 border-t border-line pt-4">
              <div class="flex items-center justify-between gap-3">
                <h4 class="font-display text-sm font-semibold uppercase tracking-[0.14em] text-beige">
                  Exercises
                </h4>
                <button type="button" class="btn-ghost" @click="addExerciseRow">
                  Add exercise
                </button>
              </div>

              <div
                v-for="(row, index) in exerciseRows"
                :key="index"
                class="grid gap-2 sm:grid-cols-[1fr_4.5rem_4.5rem_5rem_auto]"
              >
                <input
                  v-model="row.exercise"
                  type="text"
                  placeholder="Exercise"
                  :class="inputClass"
                />
                <input
                  v-model="row.sets"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Sets"
                  :class="inputClass"
                />
                <input
                  v-model="row.reps"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Reps"
                  :class="inputClass"
                />
                <input
                  v-model="row.weight"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Weight"
                  :class="inputClass"
                />
                <button type="button" class="btn-danger" @click="removeExerciseRow(index)">
                  Remove
                </button>
              </div>
            </div>

            <p v-if="formError" class="text-sm text-danger" role="alert">
              {{ formError }}
            </p>
          </div>

          <div class="flex shrink-0 flex-wrap gap-2 border-t border-line px-4 py-4 sm:px-5">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ editingId ? 'Save changes' : 'Add workout' }}
            </button>
            <button type="button" class="btn-secondary" :disabled="saving" @click="closeForm">
              Cancel
            </button>
            <button
              v-if="editingId"
              type="button"
              class="btn-danger sm:ml-auto"
              :disabled="saving"
              @click="deleteWorkout"
            >
              Delete workout
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </section>
</template>

<style>
.workout-calendar .fc {
  --fc-border-color: #2a2a2a;
  --fc-button-bg-color: transparent;
  --fc-button-border-color: #c0c0c0;
  --fc-button-hover-bg-color: #1c1c1c;
  --fc-button-hover-border-color: #d4af37;
  --fc-button-active-bg-color: #d4af37;
  --fc-button-active-border-color: #d4af37;
  --fc-button-text-color: #e8e3d8;
  --fc-today-bg-color: transparent;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: #141414;
  --fc-event-border-color: transparent;
  font-family: inherit;
}

.workout-calendar .fc .fc-toolbar {
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.workout-calendar .fc .fc-toolbar-title {
  font-family: 'Barlow Condensed', ui-sans-serif, system-ui, sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #e8e3d8;
}

.workout-calendar .fc .fc-button {
  border-radius: 0.375rem;
  font-family: 'Barlow Condensed', ui-sans-serif, system-ui, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.375rem 0.75rem;
  box-shadow: none;
}

.workout-calendar .fc .fc-button-primary:not(:disabled).fc-button-active,
.workout-calendar .fc .fc-button-primary:not(:disabled):active {
  color: #0f0f0f;
}

.workout-calendar .fc .fc-button:focus {
  box-shadow: 0 0 0 2px #0f0f0f, 0 0 0 4px rgb(212 175 55 / 0.45);
}

.workout-calendar .fc .fc-button-primary:disabled {
  opacity: 0.4;
}

.workout-calendar .fc .fc-col-header-cell-cushion {
  color: #a3a3a3;
  font-family: 'Barlow Condensed', ui-sans-serif, system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  padding: 0.5rem 0.375rem;
}

.workout-calendar .fc .fc-daygrid-day-number {
  color: #c9c3b6;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  padding: 0.375rem 0.5rem;
}

.workout-calendar .fc .fc-daygrid-day-number:hover {
  color: #e8e3d8;
}

.workout-calendar .fc .fc-day-today .fc-daygrid-day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  min-height: 1.75rem;
  margin: 0.25rem 0.35rem 0 0;
  border: 1px solid oklch(84% 0.19 80.46);
  border-radius: 9999px;
  color: oklch(84% 0.19 80.46);
  font-weight: 600;
  animation: wp-today-ring 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes wp-today-ring {
  from {
    transform: scale(0.82);
    opacity: 0.35;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workout-calendar .fc .fc-day-today .fc-daygrid-day-number {
    animation: none;
  }
}

.workout-calendar .fc .fc-daygrid-event,
.workout-calendar .fc .fc-h-event,
.workout-calendar .fc .wp-event {
  border-radius: 0.25rem;
  border-width: 0;
  border-left-width: 5px;
  border-left-style: solid;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.15rem 0.35rem 0.15rem 0.4rem;
  margin-top: 0.125rem;
  cursor: pointer;
  background-color: #33302c !important;
  color: #f0ece3 !important;
}

.workout-calendar .fc .fc-daygrid-day {
  cursor: pointer;
}

.workout-calendar .fc .fc-daygrid-more-link {
  color: oklch(84% 0.19 80.46);
  font-weight: 600;
}

html:not(.dark) .workout-calendar {
  border-color: #d6d0c4;
  background-color: #fff;
}

html:not(.dark) .workout-calendar .fc {
  --fc-border-color: #d6d0c4;
  --fc-button-border-color: #8a847a;
  --fc-button-hover-bg-color: #ebe6db;
  --fc-button-text-color: #1a1814;
  --fc-today-bg-color: transparent;
  --fc-neutral-bg-color: #f3efe6;
}

html:not(.dark) .workout-calendar .fc .fc-toolbar-title,
html:not(.dark) .workout-calendar .fc .fc-daygrid-day-number {
  color: #1a1814;
}

html:not(.dark) .workout-calendar .fc .fc-col-header-cell-cushion {
  color: #6b6560;
}

html:not(.dark) .workout-calendar .fc .fc-daygrid-event,
html:not(.dark) .workout-calendar .fc .wp-event {
  background-color: #2a2620 !important;
  color: #f0ece3 !important;
}

@media (max-width: 639px) {
  .workout-calendar .fc .fc-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .workout-calendar .fc .fc-toolbar-chunk {
    display: flex;
    justify-content: space-between;
  }

  .workout-calendar .fc .fc-toolbar-title {
    font-size: 1.125rem;
    text-align: left;
  }

  .workout-calendar .fc .fc-col-header-cell-cushion,
  .workout-calendar .fc .fc-daygrid-day-number {
    font-size: 0.75rem;
    padding: 0.25rem;
  }

  .workout-calendar .fc .fc-daygrid-event {
    font-size: 0.6875rem;
  }

  .workout-calendar .fc .fc-scrollgrid {
    min-width: 100%;
  }
}
</style>
