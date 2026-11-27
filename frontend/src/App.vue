<!-- frontend/src/App.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TopNavBar from './components/layout/TopNavBar.vue';
import NavigationSidebar from './components/layout/NavigationSidebar.vue';
import { getChatRouteNameForLens } from './utils/lensTheme';
import type { ChatLens } from './components/chat/ChatListView.vue';

const route = useRoute();
const router = useRouter();

const hideLayout = computed(() => route.meta.hideLayout === true);
const isCompactLayout = computed(() => route.meta.compactSidebar === true);

const activeLens = computed<ChatLens>(() => {
  if (route.path.includes('/social')) return 'SOCIAL';
  if (route.path.includes('/dating')) return 'DATE';
  return 'PRO';
});

// Deschide secțiunea Likes You sau revine la Discovery la al doilea click
const handleOpenLikes = () => {
  if (route.path === '/dating' && route.query.view === 'likes') {
    router.push({ path: '/dating' });
  } else {
    router.push({ path: '/dating', query: { view: 'likes' } });
  }
};

// Deschide chat-ul selectat din sidebar în Split-View pe lentila activă
const handleOpenChat = (chatId: number, lens: string) => {
  const normalizedLens: ChatLens =
    lens === 'SOCIAL' || lens === 'DATE' ? lens : 'PRO';

  router.push({
    name: getChatRouteNameForLens(normalizedLens),
    params: { id: String(chatId) },
  });
};
</script>

<template>
  <div class="flex flex-col h-screen w-full bg-slate-950 text-white overflow-hidden selection:bg-indigo-500/30">
    <!-- TOPBAR PE TOATĂ LĂȚIMEA ECRANULUI -->
    <TopNavBar v-if="!hideLayout" class="w-full shrink-0 z-30" />

    <!-- CORPUL APLICAȚIEI (SUB TOPBAR): SIDEBAR + CONȚINUT PRINCIPAL -->
    <div class="flex-1 flex min-h-0 w-full overflow-hidden">
      <NavigationSidebar
        v-if="!hideLayout"
        class="hidden md:flex shrink-0"
        :activeLens="activeLens"
        @open-likes="handleOpenLikes"
        @open-chat="handleOpenChat"
      />

      <main
        class="flex-1 min-w-0 h-full relative bg-slate-950"
        :class="isCompactLayout ? 'overflow-hidden' : 'overflow-y-auto'"
      >
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :activeLens="activeLens" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>