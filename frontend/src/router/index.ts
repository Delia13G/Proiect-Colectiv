// frontend/src/router/index.ts
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DatingView from '../views/DatingView.vue';
import SocialView from '../views/SocialView.vue';
import type { ChatLens } from '../components/chat/ChatListView.vue';

const parseChatRouteProps = (lens: ChatLens) => (route: RouteLocationNormalized) => {
  const rawId = route.params.id;
  const parsed = typeof rawId === 'string' && rawId.length > 0 ? Number(rawId) : null;
  return {
    activeLens: lens,
    chatId: parsed !== null && !Number.isNaN(parsed) ? parsed : null,
  };
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { hideLayout: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { hideLayout: true },
    },
    // ==========================================
    // LENTILA DATE + SPLIT-VIEW CHAT
    // ==========================================
    {
      path: '/dating',
      name: 'dating',
      component: DatingView,
    },
    {
      path: '/dating/chats/:id?',
      name: 'dating-chats',
      component: () => import('../views/ChatWorkspaceView.vue'),
      meta: { compactSidebar: true },
      props: parseChatRouteProps('DATE'),
    },
    // ==========================================
    // LENTILA PRO (Nested Routing + Split-View Chat)
    // ==========================================
    {
      path: '/pro',
      component: () => import('../views/ProView.vue'),
      children: [
        {
          path: '',
          name: 'pro-home',
          component: () => import('../components/pro/ProExploreView.vue'),
        },
        {
          path: 'chats/:id?',
          name: 'pro-chats',
          component: () => import('../views/ChatWorkspaceView.vue'),
          meta: { compactSidebar: true },
          props: parseChatRouteProps('PRO'),
        },
        // Compatibilitate pentru link-urile vechi /pro/chat/:id
        {
          path: 'chat/:id',
          name: 'chat-detail',
          redirect: (to) => ({
            name: 'pro-chats',
            params: { id: to.params.id },
            query: to.query,
          }),
        },
      ],
    },
    // ==========================================
    // LENTILA SOCIAL + SPLIT-VIEW CHAT
    // ==========================================
    {
      path: '/social',
      name: 'Social',
      component: SocialView,
    },
    {
      path: '/social/chats/:id?',
      name: 'social-chats',
      component: () => import('../views/ChatWorkspaceView.vue'),
      meta: { compactSidebar: true },
      props: parseChatRouteProps('SOCIAL'),
    },
  ],
});

export default router;