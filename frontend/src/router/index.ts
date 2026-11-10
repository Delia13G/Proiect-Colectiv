import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DatingView from '../views/DatingView.vue'
import DatingOnboarding from '../views/DatingOnboardingView.vue'

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
      path: '/dating',
      name: 'dating',
      component: DatingView
    },
    {
      path: '/dating/onboarding',
      name: 'DatingOnboarding',
      component: DatingOnboarding
    }
  ]
})

export default router