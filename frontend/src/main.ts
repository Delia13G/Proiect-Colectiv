import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Importuri PrimeVue v4
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())

app.use(router)

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: 'system',
            cssLayer: {
                name: 'primevue',
                order: 'tailwind-base, primevue, tailwind-utilities'
            }
        }
    }
})

app.mount('#app')