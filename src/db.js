import Dexie from 'dexie'

export const db = new Dexie('WorkoutPlanner')

db.version(1).stores({
  persons: '++id, name, color',
  workouts: '++id, personId, date, title',
  exercises: '++id, workoutId, exercise',
})
