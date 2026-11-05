import { createApp } from 'vue'
<<<<<<< HEAD
import { createPinia } from 'pinia'

// import PrimeVue from 'primevue/config'
// import Aura from '@primevue/themes/aura'

import './style.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())

app.use(router)

// app.use(PrimeVue, {
//     theme: {
//         preset: Aura,
//         options: {
//             darkModeSelector: 'system',
//             cssLayer: {
//                 name: 'primevue',
//                 order: 'tailwind-base, primevue, tailwind-utilities'
//             }
//         }
//     }
// })

app.mount('#app')
=======
import './style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config';

import Aura from '@primevue/themes/aura';

const app = createApp(App);

app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

app.mount('#app');
>>>>>>> origin/main
