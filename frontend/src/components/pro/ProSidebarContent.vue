<!-- frontend/src/components/pro/ProSidebarContent.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import {
  Plus,
  Briefcase,
  MessageSquareOff,
  ChevronDown,
  ChevronRight,
  Compass,
  MessageSquare,
} from 'lucide-vue-next';
import { useLocalStorage } from '@vueuse/core';
import ProProjectCard from './ProProjectCard.vue';
import ProChatCard from './ProChatCard.vue';
import { useProStore } from '../../stores/useProStore';
import { useChatStore } from '../../stores/useChatStore';

type ProCardRole = 'Backend' | 'Frontend' | 'UI/UX' | 'Team Lead';

const resolveProCardRole = (
  rawRole?: string,
  isGroup?: boolean
): ProCardRole | undefined => {
  if (isGroup || !rawRole) return undefined;
  const normalized = rawRole.toLowerCase();
  if (normalized.includes('ui') || normalized.includes('ux') || normalized.includes('design')) {
    return 'UI/UX';
  }
  if (normalized.includes('frontend')) return 'Frontend';
  if (normalized.includes('lead') || normalized.includes('mentor')) return 'Team Lead';
  if (
    normalized.includes('backend') ||
    normalized.includes('architect') ||
    normalized.includes('devops')
  ) {
    return 'Backend';
  }
  return undefined;
};

const emit = defineEmits<{
  (event: 'create-project'): void;
  (event: 'open-project', projectId: number): void;
  (event: 'project-options', projectId: number): void;
  (event: 'open-chat', chatId: number): void;
}>();

const router = useRouter();
const route = useRoute();

const proStore = useProStore();
const chatStore = useChatStore();

const { projects, isLoading } = storeToRefs(proStore);

// Conversații PRO unificate direct din useChatStore (pinned sus, restul în ordinea activității)
const sortedTeamChats = computed(() => {
  const list = [...chatStore.getChats('PRO')];
  list.sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));

  return list.map((chat) => {
    const profile = chatStore.getProfileDetails(chat.id);

    return {
      id: Number(chat.id),
      name: chat.name,
      message: chat.message,
      avatar: '',
      unreadCount: chat.unread,
      timestamp: chat.timestamp,
      role: resolveProCardRole(profile?.role, chat.isGroup),
      isPinned: Boolean(chat.isPinned),
      presence: (chat.status === 'online' ? 'online' : 'offline') as 'online' | 'offline',
    };
  });
});

const activeChatsCount = computed(() => sortedTeamChats.value.length);

const unreadMessagesCount = computed(() =>
  chatStore.getTotalUnreadMessages('PRO')
);

const formattedUnread = computed(() =>
  unreadMessagesCount.value > 99 ? '99+' : String(unreadMessagesCount.value)
);

const hasActiveProCall = computed(
  () => chatStore.activeCall?.lens === 'PRO'
);

const conversationsButtonLabel = computed(() => {
  const parts = ['All Conversations'];
  if (unreadMessagesCount.value > 0) parts.push(`${unreadMessagesCount.value} unread`);
  if (hasActiveProCall.value) parts.push('call in progress');
  return parts.join(' · ');
});

onMounted(() => {
  proStore.fetchProData();
});

const isProjectsOpen = useLocalStorage('cliq-pro-projects-open', true);
const isChatsOpen = useLocalStorage('cliq-pro-chats-open', true);

const goToExplore = () => {
  router.push('/pro');
};

const goToChatList = () => {
  router.push({ name: 'pro-chats' });
};

const openChat = (chatId: number) => {
  emit('open-chat', chatId);
};
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 min-h-0 pb-4">
    <!-- Meniu Global PRO (Navigation Actions) -->
    <div class="flex flex-col gap-2 px-2 shrink-0 mt-1">
      <button
        type="button"
        @click="goToExplore"
        class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        :class="
          route.path === '/pro'
            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20'
            : 'bg-slate-800/30 hover:bg-slate-800/80 border border-white/5'
        "
      >
        <Compass
          :size="18"
          class="transition-transform shrink-0"
          :class="
            route.path === '/pro'
              ? 'text-indigo-400 group-hover:scale-110'
              : 'text-slate-400 group-hover:text-indigo-300 group-hover:scale-110'
          "
          aria-hidden="true"
        />
        <span
          class="text-sm transition-colors truncate"
          :class="
            route.path === '/pro'
              ? 'font-bold text-white tracking-wide'
              : 'font-semibold text-slate-300 group-hover:text-white'
          "
        >
          Explore Workspace
        </span>
      </button>

      <button
        type="button"
        @click="goToChatList"
        :aria-label="conversationsButtonLabel"
        class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        :class="
          route.path.startsWith('/pro/chat')
            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20'
            : 'bg-slate-800/30 hover:bg-slate-800/80 border border-white/5'
        "
      >
        <MessageSquare
          :size="18"
          class="transition-all shrink-0"
          :class="
            route.path.startsWith('/pro/chat')
              ? 'text-indigo-400 group-hover:scale-110'
              : 'text-slate-400 group-hover:text-indigo-300'
          "
          aria-hidden="true"
        />
        <span
          class="flex-1 text-left text-sm transition-colors truncate"
          :class="
            route.path.startsWith('/pro/chat')
              ? 'font-bold text-white tracking-wide'
              : 'font-semibold text-slate-300 group-hover:text-white'
          "
        >
          All Conversations
        </span>

        <div
          v-if="hasActiveProCall || unreadMessagesCount > 0"
          class="flex items-center gap-1.5 shrink-0"
        >
          <span
            v-if="hasActiveProCall"
            title="Call in progress"
            aria-hidden="true"
            class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] motion-safe:animate-pulse"
          />

          <transition name="badge-pop">
            <span
              v-if="unreadMessagesCount > 0"
              aria-hidden="true"
              class="min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[11px] font-bold leading-none tabular-nums flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            >
              {{ formattedUnread }}
            </span>
          </transition>
        </div>
      </button>
    </div>

    <!-- MY PROJECTS (Collapsible) -->
    <div
      class="flex flex-col p-4 mx-2 rounded-[20px] bg-slate-800/30 backdrop-blur-md border border-white/[0.08] shadow-lg shrink-0 flex-none transition-all duration-300"
      :class="isProjectsOpen ? 'max-h-[45%]' : 'max-h-[60px]'"
    >
      <div
        class="flex justify-between items-center cursor-pointer group shrink-0"
        @click="isProjectsOpen = !isProjectsOpen"
      >
        <div class="flex items-center gap-1.5">
          <ChevronDown
            v-if="isProjectsOpen"
            :size="16"
            class="text-slate-400 group-hover:text-white transition-colors"
          />
          <ChevronRight
            v-else
            :size="16"
            class="text-slate-400 group-hover:text-white transition-colors"
          />
          <h3 class="text-xs font-semibold tracking-wide text-white uppercase select-none">
            My Projects
          </h3>
        </div>
        <button
          type="button"
          @click.stop="emit('create-project')"
          aria-label="Create new project"
          class="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none cursor-pointer"
        >
          <Plus :size="14" /> New
        </button>
      </div>

      <div v-show="isProjectsOpen" class="flex flex-col mt-4 overflow-hidden h-full">
        <div v-if="isLoading" class="flex flex-col gap-2">
          <div v-for="i in 2" :key="i" class="flex items-center gap-3 p-2.5">
            <div class="w-10 h-10 rounded-xl bg-slate-700/40 animate-pulse shrink-0"></div>
            <div class="flex-1 flex flex-col gap-2">
              <div class="w-3/4 h-3.5 bg-slate-700/40 rounded animate-pulse"></div>
              <div class="w-1/2 h-3 bg-slate-700/30 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <transition-group
          v-else-if="projects.length > 0"
          name="list"
          tag="div"
          class="flex flex-col gap-1.5 overflow-y-auto pr-1 pb-1 scrollbar-hide relative -mx-2 px-2 h-full"
        >
          <ProProjectCard
            v-for="project in projects"
            :key="project.id"
            :id="project.id"
            :title="project.title"
            :category="project.category"
            :icon="project.icon"
            :isNew="project.isNew"
            :progress="project.progress"
            :dueSoon="project.dueSoon"
            @click="(id) => emit('open-project', id)"
            @open-options="(id) => emit('project-options', id)"
          />
        </transition-group>

        <div v-else class="flex flex-col items-center justify-center gap-2 py-5 h-full">
          <Briefcase :size="24" class="text-slate-600/50" />
          <p class="text-[11px] font-medium text-slate-500 text-center">
            No active projects.<br />Click "New" to begin.
          </p>
        </div>
      </div>
    </div>

    <!-- TEAM DISCUSSIONS (Sincronizat live cu useChatStore) -->
    <div
      class="flex flex-col p-4 mx-2 rounded-[20px] bg-slate-800/30 backdrop-blur-md border border-white/[0.08] shadow-lg flex-1 min-h-0 overflow-hidden transition-all duration-300"
      :class="isChatsOpen ? '' : 'max-h-[60px] !flex-none'"
    >
      <div
        class="flex justify-between items-center cursor-pointer group shrink-0"
        @click="isChatsOpen = !isChatsOpen"
      >
        <div class="flex items-center gap-1.5">
          <ChevronDown
            v-if="isChatsOpen"
            :size="16"
            class="text-slate-400 group-hover:text-white transition-colors"
          />
          <ChevronRight
            v-else
            :size="16"
            class="text-slate-400 group-hover:text-white transition-colors"
          />
          <h3 class="text-xs font-semibold tracking-wide text-white uppercase select-none">
            Team Chats
          </h3>
        </div>
        <span
          v-if="isChatsOpen && activeChatsCount > 0"
          class="text-xs text-indigo-400 font-semibold"
        >
          {{ activeChatsCount }} active
        </span>
        <span
          v-else-if="!isChatsOpen && unreadMessagesCount > 0"
          class="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
        />
      </div>

      <div v-show="isChatsOpen" class="flex flex-col mt-4 overflow-hidden h-full">
        <transition-group
          v-if="sortedTeamChats.length > 0"
          name="list"
          tag="div"
          class="flex flex-col gap-1.5 overflow-y-auto pr-1 pb-1 scrollbar-hide relative h-full"
        >
          <ProChatCard
            v-for="chat in sortedTeamChats"
            :key="chat.id"
            :id="chat.id"
            :name="chat.name"
            :message="chat.message ?? ''"
            :avatar="chat.avatar"
            :unreadCount="chat.unreadCount"
            :timestamp="chat.timestamp"
            :role="chat.role"
            :isPinned="chat.isPinned"
            :presence="chat.presence"
            @click="(id) => openChat(id)"
            @action="(id) => chatStore.toggleRead('PRO', id)"
          />
        </transition-group>

        <div v-else class="flex flex-col items-center justify-center gap-2 py-6 h-full">
          <MessageSquareOff :size="24" class="text-slate-600/40" />
          <p class="text-[11px] font-medium text-slate-500 text-center">
            No active discussions.<br />Invite your team!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-active {
  position: absolute;
  width: 100%;
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