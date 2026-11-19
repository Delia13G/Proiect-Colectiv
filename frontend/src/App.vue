<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TopNavBar from './components/layout/TopNavBar.vue';
import NavigationSidebar from './components/layout/NavigationSidebar.vue';

const route = useRoute();
const router = useRouter();

const hideLayout = computed(() => route.meta.hideLayout === true);

const activeLens = computed<'PRO' | 'SOCIAL' | 'DATE'>(() => {
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

// Deschide chat-ul selectat din sidebar în funcție de lentila activă
const handleOpenChat = (chatId: number, lens: string) => {
  if (lens === 'DATE') {
    router.push({
      path: '/dating',
      query: { view: 'chat', chatId: String(chatId) }
    });
  } else if (lens === 'PRO') {
    router.push({
      name: 'chat-detail',
      params: { id: chatId },
      query: { lens: 'PRO' }
    });
  } else if (lens === 'SOCIAL') {
    router.push({
      path: '/social',
      query: { view: 'chat', chatId: String(chatId) }
    });
  }
};
</script>

<template>
  <div class="flex h-screen w-full bg-slate-950 text-white overflow-hidden selection:bg-indigo-500/30">
    
    <NavigationSidebar 
      v-if="!hideLayout"
      class="hidden md:flex shrink-0" 
      :activeLens="activeLens"
      @open-likes="handleOpenLikes"
      @open-chat="handleOpenChat"
    />

    <div class="flex-1 flex flex-col h-full min-w-0 relative">
      <TopNavBar v-if="!hideLayout" class="shrink-0" />

      <main class="flex-1 overflow-y-auto relative bg-slate-950">
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