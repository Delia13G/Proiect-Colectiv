// frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DatingView from '../views/DatingView.vue'
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
      component: LoginView,
      meta: { hideLayout: true } // <-- Adăugat: Ascunde Sidebar și TopBar
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { hideLayout: true } // <-- Adăugat: Ascunde Sidebar și TopBar
    },
    {
      path: '/dating',
      name: 'dating',
      component: DatingView
    },
    // ==========================================
    // RUTA PRO (Nested Routing)
    // ==========================================
    {
      path: '/pro',
      component: () => import('../views/ProView.vue'),
      children: [
        {
          path: '', 
          name: 'pro-home',
          component: () => import('../components/pro/ProExploreView.vue')
        },
        {
          path: 'chats', 
          name: 'pro-chat-list',
          component: () => import('../components/chat/ChatListView.vue'),
          props: { activeLens: 'PRO' }
        },
        {
          path: 'chat/:id', 
          name: 'chat-detail',
          component: () => import('../components/chat/MainChatView.vue'),
          props: (route) => ({ 
            chatId: Number(route.params.id), 
            activeLens: route.query.lens || 'PRO' 
          })
        }
      ]
    },
    {
      path: '/social',
      name: 'Social',
      component: SocialView
    },
    {
      path: '/playground',
      name: 'playground',
      component: () => import('../views/PlaygroundView.vue')
    }
  ]
})

export default router