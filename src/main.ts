import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './i18n'
import router from './router'

const COLOR_MODE_KEY = 'vueuse-color-scheme'

function applyInitialColorMode() {
  const storedMode = localStorage.getItem(COLOR_MODE_KEY)
  const mode = storedMode ?? 'dark'

  if (!storedMode) {
    localStorage.setItem(COLOR_MODE_KEY, mode)
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'auto' && prefersDark)

  document.documentElement.classList.toggle('dark', isDark)
}

applyInitialColorMode()

// Prevent rendering until CSS is loaded
const appElement = document.getElementById('app')
if (appElement) {
  // Hide the app initially to prevent FOUC
  appElement.style.visibility = 'hidden'
  appElement.style.opacity = '0'
  
  // Show app once DOM is ready and stylesheets are loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showApp)
  } else {
    // If already loaded, show after a small delay to ensure styles are applied
    requestAnimationFrame(() => {
      setTimeout(showApp, 0)
    })
  }
}

function showApp() {
  const app = document.getElementById('app')
  if (app) {
    app.style.visibility = 'visible'
    app.style.opacity = '1'
    app.style.transition = 'opacity 0.2s ease-in'
  }
}

createApp(App).use(i18n).use(router).mount('#app')
