import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Calendar from './views/Calendar.vue'
import People from './views/People.vue'
import Reports from './views/Reports.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/calendar', name: 'calendar', component: Calendar },
  { path: '/people', name: 'people', component: People },
  { path: '/reports', name: 'reports', component: Reports },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
