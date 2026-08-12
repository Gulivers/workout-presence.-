<script setup>
import { onMounted, ref } from 'vue'
import { db } from '../db'

const COLORS = [
  '#0f766e',
  '#1d4ed8',
  '#b45309',
  '#be123c',
  '#7c3aed',
  '#334155',
]

const people = ref([])
const name = ref('')
const color = ref(COLORS[0])
const editingId = ref(null)
const error = ref('')
const saving = ref(false)

async function loadPeople() {
  people.value = await db.persons.orderBy('name').toArray()
}

function resetForm() {
  name.value = ''
  color.value = COLORS[0]
  editingId.value = null
  error.value = ''
}

function startEdit(person) {
  editingId.value = person.id
  name.value = person.name
  color.value = person.color || COLORS[0]
  error.value = ''
}

async function savePerson() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = 'Name is required.'
    return
  }

  saving.value = true
  error.value = ''

  try {
    if (editingId.value) {
      await db.persons.update(editingId.value, {
        name: trimmed,
        color: color.value,
      })
    } else {
      await db.persons.add({
        name: trimmed,
        color: color.value,
      })
    }

    resetForm()
    await loadPeople()
  } catch (err) {
    error.value = 'Could not save person.'
    console.error(err)
  } finally {
    saving.value = false
  }
}

async function deletePerson(person) {
  const workoutCount = await db.workouts.where('personId').equals(person.id).count()
  const message = workoutCount
    ? `Delete ${person.name} and their ${workoutCount} workout(s)?`
    : `Delete ${person.name}?`

  if (!confirm(message)) return

  try {
    await db.transaction('rw', db.persons, db.workouts, db.exercises, async () => {
      const workouts = await db.workouts.where('personId').equals(person.id).toArray()
      const workoutIds = workouts.map((w) => w.id)

      if (workoutIds.length) {
        await db.exercises.where('workoutId').anyOf(workoutIds).delete()
        await db.workouts.where('personId').equals(person.id).delete()
      }

      await db.persons.delete(person.id)
    })

    if (editingId.value === person.id) resetForm()
    await loadPeople()
  } catch (err) {
    error.value = 'Could not delete person.'
    console.error(err)
  }
}

onMounted(loadPeople)
</script>

<template>
  <section class="space-y-8">
    <div>
      <h2 class="page-title">People</h2>
      <p class="page-lede">
        Add the people who take part in workouts.
      </p>
    </div>

    <form class="space-y-4 surface-rule pt-6" @submit.prevent="savePerson">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label class="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
          <span class="field-label">Name</span>
          <input
            v-model="name"
            type="text"
            maxlength="80"
            placeholder="e.g. Alex"
            class="field-input"
          />
        </label>

        <div class="flex flex-col gap-1.5 text-sm">
          <span class="field-label">Color</span>
          <div class="flex gap-2">
            <button
              v-for="swatch in COLORS"
              :key="swatch"
              type="button"
              class="h-8 w-8 rounded-full border-2 transition"
              :class="color === swatch ? 'scale-110 border-gold' : 'border-transparent'"
              :style="{ backgroundColor: swatch }"
              :aria-label="`Select color ${swatch}`"
              @click="color = swatch"
            />
          </div>
        </div>
      </div>

      <p v-if="error" class="text-sm text-danger">{{ error }}</p>

      <div class="flex flex-wrap gap-2">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ editingId ? 'Save changes' : 'Add person' }}
        </button>
        <button
          v-if="editingId"
          type="button"
          class="btn-ghost"
          @click="resetForm"
        >
          Cancel
        </button>
      </div>
    </form>

    <div class="surface-rule pt-6">
      <p v-if="!people.length" class="muted">
        No people yet. Add someone above to get started.
      </p>

      <ul v-else class="divide-y divide-line">
        <li
          v-for="person in people"
          :key="person.id"
          class="flex items-center justify-between gap-4 py-3"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="h-3 w-3 shrink-0 rounded-full ring-1 ring-gold/40"
              :style="{ backgroundColor: person.color }"
              aria-hidden="true"
            />
            <span class="truncate font-medium">{{ person.name }}</span>
          </div>

          <div class="flex shrink-0 gap-1">
            <button type="button" class="btn-ghost" @click="startEdit(person)">
              Edit
            </button>
            <button type="button" class="btn-danger" @click="deletePerson(person)">
              Delete
            </button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
