<!-- frontend/src/components/layout/NavigationSidebar.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Compass,
  MessageSquare,
  PanelLeftOpen,
  PanelLeftClose,
  Flame,
  Users,
} from 'lucide-vue-next';
import UserMiniProfile from './UserMiniProfile.vue';
import ProSidebarContent from '../pro/ProSidebarContent.vue';
import SocialSidebarContent from '../social/SocialSidebarContent.vue';
import DateSidebarContent from '../dating/DateSidebarContent.vue';
import { useChatStore } from '../../stores/useChatStore';
import { getLensTheme, getChatRouteNameForLens } from '../../utils/lensTheme';
import type { ChatLens } from '../chat/ChatListView.vue';

const props = defineProps<{
  activeLens: ChatLens;
}>();

const emit = defineEmits<{
  (event: 'create-project'): void;
  (event: 'open-project', id: number): void;
  (event: 'project-options', id: number): void;
  (event: 'open-group', id: number): void;
  (event: 'open-all-groups'): void;
  (event: 'open-likes'): void;
  (event: 'open-chat', id: number, lens: string): void;
}>();

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();

const isCompactRoute = computed(() => route.meta.compactSidebar === true);
const isManuallyExpanded = ref(false);

watch(isCompactRoute, () => {
  isManuallyExpanded.value = false;
});

const isCollapsed = computed(() => isCompactRoute.value && !isManuallyExpanded.value);

const railTheme = computed(() => getLensTheme(props.activeLens));

const unreadCount = computed(() =>
  chatStore.getTotalUnreadMessages(props.activeLens)
);

const formattedUnread = computed(() =>
  unreadCount.value > 99 ? '99+' : String(unreadCount.value)
);

const hasActiveCall = computed(
  () => chatStore.activeCall?.lens === props.activeLens
);

const chatsButtonLabel = computed(() => {
  const parts = ['All Conversations'];
  if (unreadCount.value > 0) parts.push(`${unreadCount.value} unread`);
  if (hasActiveCall.value) parts.push('call in progress');
  return parts.join(' · ');
});

const isChatsActive = computed(
  () => route.name === getChatRouteNameForLens(props.activeLens)
);

const isExploreActive = computed(() => {
  if (isChatsActive.value) return false;
  if (props.activeLens === 'PRO') return route.path === '/pro';
  if (props.activeLens === 'SOCIAL') return route.path === '/social';
  return route.path === '/dating';
});

const goToExplore = () => {
  if (props.activeLens === 'PRO') router.push('/pro');
  else if (props.activeLens === 'SOCIAL') router.push('/social');
  else router.push('/dating');
};

const goToChats = () => {
  router.push({ name: getChatRouteNameForLens(props.activeLens) });
};
</script>

<template>
  <aside
    class="h-full flex flex-col bg-slate-900/40 backdrop-blur-xl border-r border-white/10 select-none overflow-hidden relative z-20 transition-[width,padding] duration-200 ease-out"
    :class="isCollapsed ? 'w-[76px] px-2.5 py-4 items-center gap-4' : 'w-72 p-4 gap-5'"
  >
    <!-- 1. USER PROFILE (Compact în Rail, complet pe sidebar expandat) -->
    <UserMiniProfile :active-lens="activeLens" :collapsed="isCollapsed" />

    <!-- 2A. MOD RAIL (Când ești în Split-View Conversations) -->
    <div v-if="isCollapsed" class="flex-1 flex flex-col items-center justify-between w-full min-h-0">
      <nav aria-label="Workspace navigation" class="flex flex-col items-center gap-2.5 w-full">
        <button
          type="button"
          @click="goToExplore"
          title="Explore Workspace"
          aria-label="Explore Workspace"
          class="w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer outline-none focus-visible:ring-2"
          :class="[
            railTheme.focusVisibleRing,
            isExploreActive
              ? railTheme.active
              : 'border-white/5 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800',
          ]"
        >
          <Flame v-if="activeLens === 'DATE'" :size="20" aria-hidden="true" />
          <Users v-else-if="activeLens === 'SOCIAL'" :size="20" aria-hidden="true" />
          <Compass v-else :size="20" aria-hidden="true" />
        </button>

        <button
          type="button"
          @click="goToChats"
          :title="chatsButtonLabel"
          :aria-label="chatsButtonLabel"
          class="relative w-11 h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer outline-none focus-visible:ring-2"
          :class="[
            railTheme.focusVisibleRing,
            isChatsActive
              ? railTheme.active
              : 'border-white/5 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800',
          ]"
        >
          <MessageSquare :size="20" aria-hidden="true" />

          <!-- Badge live mesaje necitite -->
          <transition name="badge-pop">
            <span
              v-if="unreadCount > 0"
              aria-hidden="true"
              class="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-bold leading-none tabular-nums text-white border-2 border-slate-950 flex items-center justify-center pointer-events-none"
              :class="railTheme.badge"
            >
              {{ formattedUnread }}
            </span>
          </transition>

          <!-- Indicator apel activ pe lentila curentă -->
          <span
            v-if="hasActiveCall"
            aria-hidden="true"
            class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 motion-safe:animate-pulse pointer-events-none"
          />
        </button>
      </nav>

      <!-- Buton expandare manuală sidebar -->
      <button
        type="button"
        @click="isManuallyExpanded = true"
        title="Expand sidebar"
        aria-label="Expand sidebar"
        class="w-11 h-11 rounded-xl border border-white/5 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        <PanelLeftOpen :size="18" aria-hidden="true" />
      </button>
    </div>

    <!-- 2B. MOD EXPANDAT (Conținutul dinamic pe Lens) -->
    <template v-else>
      <button
        v-if="isCompactRoute"
        type="button"
        @click="isManuallyExpanded = false"
        class="flex items-center justify-between px-3 py-1.5 -mt-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400 shrink-0"
      >
        <span>Collapse sidebar</span>
        <PanelLeftClose :size="15" aria-hidden="true" />
      </button>

      <transition name="lens-fade" mode="out-in">
        <ProSidebarContent
          v-if="activeLens === 'PRO'"
          key="pro"
          @create-project="emit('create-project')"
          @open-project="(id: number) => emit('open-project', id)"
          @project-options="(id: number) => emit('project-options', id)"
          @open-chat="(id: number) => emit('open-chat', id, 'PRO')"
        />

        <SocialSidebarContent
          v-else-if="activeLens === 'SOCIAL'"
          key="social"
          @open-group="(id: number) => emit('open-group', id)"
          @open-all-groups="emit('open-all-groups')"
          @open-chat="(id: number) => emit('open-chat', id, 'SOCIAL')"
        />

        <DateSidebarContent
          v-else-if="activeLens === 'DATE'"
          key="date"
          @open-likes="emit('open-likes')"
          @open-chat="(id: number) => emit('open-chat', id, 'DATE')"
        />
      </transition>
    </template>
  </aside>
</template>

<style scoped>
.lens-fade-enter-active,
.lens-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}
.lens-fade-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}
.lens-fade-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

.badge-pop-enter-active,
.badge-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.badge-pop-enter-from,
.badge-pop-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
</style>