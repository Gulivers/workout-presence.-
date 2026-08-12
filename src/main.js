import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { db } from './db'
import './main.css'

const storedTheme = localStorage.getItem('workout-planner-theme')
if (storedTheme === 'light') {
  document.documentElement.classList.remove('dark')
} else {
  document.documentElement.classList.add('dark')
}

db.open().catch((err) => {
  console.error('Failed to open database', err)
})

createApp(App).use(router).mount('#app')
