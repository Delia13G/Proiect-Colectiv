import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import SocialView from '../views/SocialView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/pro',
      name: 'pro',
      component: () => import('../views/ProView.vue')
    },
    {
      path: '/social',
      name: 'Social',
      component: SocialView
    },
    // NOU: Ruta pentru mediul izolat de testare
    {
      path: '/playground',
      name: 'playground',
      component: () => import('../views/PlaygroundView.vue')
    }
  ]
})

export default router