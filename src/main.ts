import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './i18n'

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

createApp(App).use(i18n).mount('#app')
