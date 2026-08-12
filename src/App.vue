<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const STORAGE_KEY = 'workout-planner-theme'
const route = useRoute()
const theme = ref('dark')
const menuOpen = ref(false)

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/people', label: 'People' },
  { to: '/reports', label: 'Reports' },
]

const nextThemeLabel = computed(() => (theme.value === 'dark' ? 'light' : 'dark'))

function isActive(path) {
  return route.path === path
}

function applyTheme(next) {
  theme.value = next
  document.documentElement.classList.toggle('dark', next === 'dark')
  localStorage.setItem(STORAGE_KEY, next)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function onKeydown(event) {
  if (event.key === 'Escape' && menuOpen.value) {
    closeMenu()
  }
}

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  },
)

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  applyTheme(stored === 'light' ? 'light' : 'dark')
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="app-shell min-h-screen">
    <header class="app-header relative z-40 border-b border-line bg-ink/95">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <RouterLink
          to="/"
          class="flex min-w-0 items-center gap-3 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-gold/40"
          aria-label="Workout Presence home"
        >
          <span
            class="ks-leaf-face gold-leaf flex h-8 shrink-0 items-center gap-0.5 rounded-md bg-gold px-1.5 font-display text-[15px] font-bold tracking-wide text-ink"
            aria-hidden="true"
          >
            <span class="relative z-0">WP</span>
            <span class="relative z-0 text-[13px] leading-none">+</span>
          </span>
          <h1 class="truncate font-display text-lg font-semibold uppercase tracking-[0.08em] text-beige sm:text-xl">
            Workout Presence
          </h1>
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-1 md:flex" aria-label="Primary">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-md px-3 py-1.5 font-display text-sm font-medium uppercase tracking-[0.12em] transition-colors"
            :class="
              isActive(link.to)
                ? 'app-nav-link app-nav-link--active ks-leaf-face gold-leaf bg-gold text-ink'
                : 'app-nav-link text-silver hover:bg-panel-raised hover:text-beige'
            "
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="theme-toggle-btn hidden size-9 items-center justify-center rounded-full border border-silver/40 text-silver transition-colors hover:border-gold hover:text-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 md:inline-flex"
            :aria-label="`Theme: ${theme}. Click to switch to ${nextThemeLabel} mode`"
            :title="`Click to switch to ${nextThemeLabel} mode`"
            @click="toggleTheme"
          >
            <svg
              v-if="theme === 'light'"
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <svg
              v-else
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              />
            </svg>
          </button>

          <button
            type="button"
            class="menu-trigger inline-flex size-9 items-center justify-center rounded-md border border-gold text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 md:hidden"
            :aria-expanded="menuOpen"
            aria-controls="mobile-nav"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            @click="toggleMenu"
          >
            <svg
              v-if="!menuOpen"
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg
              v-else
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile menu overlay -->
    <div
      v-if="menuOpen"
      class="mobile-nav-root fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-ink/70"
        aria-label="Close menu"
        @click="closeMenu"
      />

      <div class="relative flex h-full flex-col px-4 pb-6 pt-3">
        <div class="mb-4 flex items-center justify-between gap-3">
          <RouterLink
            to="/"
            class="flex min-w-0 items-center gap-3 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-gold/40"
            aria-label="Workout Presence home"
            @click="closeMenu"
          >
            <span
              class="ks-leaf-face gold-leaf flex h-8 shrink-0 items-center gap-0.5 rounded-md bg-gold px-1.5 font-display text-[15px] font-bold tracking-wide text-ink"
              aria-hidden="true"
            >
              <span class="relative z-0">WP</span>
              <span class="relative z-0 text-[13px] leading-none">+</span>
            </span>
            <p class="mobile-nav-title truncate font-display text-lg font-semibold uppercase tracking-[0.08em] text-beige">
              Workout Presence
            </p>
          </RouterLink>

          <button
            type="button"
            class="mobile-nav-close inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-gold text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            aria-label="Close menu"
            @click="closeMenu"
          >
            <svg
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav
          id="mobile-nav"
          class="mobile-nav-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-panel"
          aria-label="Primary"
        >
          <ul class="flex-1 overflow-y-auto px-5 py-2">
            <li v-for="link in links" :key="link.to" class="border-b border-line last:border-b-0">
              <RouterLink
                :to="link.to"
                class="mobile-nav-link block py-4 font-display text-2xl font-semibold uppercase tracking-[0.08em] transition-colors"
                :class="
                  isActive(link.to)
                    ? 'mobile-nav-link--active border-b border-gold text-gold'
                    : 'text-beige hover:text-gold'
                "
                @click="closeMenu"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>

          <div class="flex shrink-0 items-center gap-3 border-t border-line px-5 py-4">
            <button
              type="button"
              class="theme-toggle-btn inline-flex size-10 items-center justify-center rounded-full border border-silver/50 text-beige transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              :aria-label="`Theme: ${theme}. Click to switch to ${nextThemeLabel} mode`"
              :title="`Click to switch to ${nextThemeLabel} mode`"
              @click="toggleTheme"
            >
              <svg
                v-if="theme === 'light'"
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <svg
                v-else
                class="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                />
              </svg>
            </button>
            <p class="font-display text-xs font-medium uppercase tracking-[0.16em] text-silver-dim">
              Theme: {{ theme }}
            </p>
          </div>
        </nav>
      </div>
    </div>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <RouterView />
    </main>
  </div>
</template>
