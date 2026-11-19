<!-- frontend/src/components/dating/DateSidebarContent.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import DateChatCard from './DateChatCard.vue';
import { HeartCrack, MessageSquareOff } from 'lucide-vue-next';
import { useDatingStore } from '../../stores/useDatingStore';

const emit = defineEmits<{
  (event: 'open-likes'): void;
  (event: 'open-chat', chatId: number): void;
}>();

// 1. Initialize Store
const datingStore = useDatingStore();

// 2. Extract reactive state
const { likesCount, matches, sortedChats, isLoading } = storeToRefs(datingStore);

// 3. Fetch data on mount
onMounted(() => {
  datingStore.fetchSidebarData();
});

const brokenMatchImages = ref<Record<number, boolean>>({});
const markMatchImageBroken = (id: number) => { brokenMatchImages.value[id] = true; };

// Haptic & Audio feedback for new matches
watch(() => matches.value.length, (newLength, oldLength) => {
  if (newLength > (oldLength || 0)) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); 
    }
    try {
      const matchSound = new Audio('/sounds/match-notification.mp3'); 
      matchSound.play().catch(() => {});
    } catch (e) {
      console.warn("Audio playback failed.", e);
    }
  }
});
</script>

<template>
  <div class="flex-1 flex flex-col gap-5 min-h-0 pb-4">
    
    <!-- LIKES SECTION -->
    <button aria-label="View who liked you" @click="emit('open-likes')" class="flex items-center gap-3 p-4 rounded-[20px] bg-slate-800/30 backdrop-blur-md border border-white/[0.08] text-left transition-all duration-300 hover:bg-slate-800/50 hover:border-rose-500/30 group shadow-lg">
      <div class="flex items-center justify-center w-10 h-10 bg-rose-500/20 text-rose-500 rounded-xl shrink-0 transition-transform group-hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-bold text-white mb-0.5">Likes You</h3>
        <p class="text-[11px] text-slate-400 truncate">
          <span v-if="isLoading" class="inline-block w-16 h-3 bg-slate-700/50 rounded animate-pulse"></span>
          <span v-else>{{ likesCount }} people like you</span>
        </p>
      </div>
      <span v-if="!isLoading" class="bg-rose-500 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg">{{ likesCount }}</span>
      <span v-else class="w-6 h-6 rounded-full bg-slate-700/50 animate-pulse"></span>
    </button>

    <!-- NEW MATCHES SECTION -->
    <div class="flex flex-col gap-3 p-4 rounded-[20px] bg-slate-800/30 backdrop-blur-md border border-white/[0.08] shadow-lg">
      <div class="flex justify-between items-center">
        <h2 class="text-xs font-semibold tracking-wide text-white">NEW MATCHES</h2>
        <span class="text-xs text-rose-500 font-semibold" v-if="!isLoading && matches.length > 0">{{ matches.length }}</span>
      </div>
      
      <div v-if="isLoading" class="flex gap-4 overflow-x-hidden pb-1 pt-2">
        <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-2 shrink-0">
          <div class="w-[56px] h-[56px] rounded-full bg-slate-700/40 animate-pulse border-[3px] border-slate-900/50"></div>
          <div class="w-10 h-3 rounded bg-slate-700/40 animate-pulse"></div>
        </div>
      </div>

      <div v-else-if="matches.length > 0" class="flex gap-4 overflow-x-auto pb-1 pt-2 scrollbar-hide">
        <button v-for="match in matches" :key="match.id" @click="emit('open-chat', match.id)" class="flex flex-col items-center gap-2 shrink-0 outline-none group">
          <div 
            class="p-[2px] rounded-full transition-transform group-hover:scale-105"
            :class="match.online ? 'bg-gradient-to-br from-rose-500 to-rose-400/50 shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'bg-transparent'"
          >
            <div class="w-[52px] h-[52px] rounded-full border-[3px] border-slate-900 overflow-hidden bg-slate-800 flex items-center justify-center">
              <img v-if="!brokenMatchImages[match.id]" :src="match.image" :alt="match.name" @error="markMatchImageBroken(match.id)" class="w-full h-full object-cover" />
              <span v-else class="text-slate-300 font-bold text-lg">{{ match.name.charAt(0).toUpperCase() }}</span>
            </div>
          </div>
          <span class="text-[11px] font-medium text-slate-300 group-hover:text-white">{{ match.name }}</span>
        </button>
      </div>

      <div v-else class="flex flex-col items-center justify-center gap-1.5 py-3">
        <HeartCrack :size="22" class="text-slate-600/50" />
        <p class="text-[11px] font-medium text-slate-500 text-center">No new matches yet.</p>
      </div>
    </div>

    <!-- ACTIVE CHATS SECTION -->
    <div class="flex-1 flex flex-col gap-3 min-h-0 p-4 rounded-[20px] bg-slate-800/30 backdrop-blur-md border border-white/[0.08] shadow-lg overflow-hidden relative">
      <div class="flex justify-between items-center shrink-0">
        <h2 class="text-xs font-semibold tracking-wide text-white">ACTIVE CHATS</h2>
        <span class="text-xs text-rose-500 font-semibold" v-if="!isLoading && sortedChats.length > 0">{{ sortedChats.length }}</span>
      </div>
      
      <div v-if="isLoading" class="flex flex-col gap-4 overflow-hidden pt-2">
        <div v-for="i in 4" :key="i" class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-slate-700/40 animate-pulse shrink-0"></div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="w-24 h-3.5 bg-slate-700/40 rounded animate-pulse"></div>
            <div class="w-32 h-3 bg-slate-700/30 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <transition-group 
        v-else-if="sortedChats.length > 0" 
        name="list" 
        tag="div" 
        class="flex flex-col gap-2 overflow-y-auto pt-2 scrollbar-hide relative"
      >
        <DateChatCard 
          v-for="chat in sortedChats" 
          :key="chat.id"
          :id="chat.id"
          :name="chat.name"
          :message="chat.message"
          :image="chat.image"
          :unread="chat.unread"
          :online="chat.online"
          :timestamp="chat.timestamp"
          :isTyping="chat.isTyping"
          :messageType="chat.messageType"
          :isMine="chat.isMine"
          :status="chat.status"
          :isPinned="chat.isPinned"
          @click="(id) => emit('open-chat', id)"
          @delete="(id) => datingStore.deleteChat(id)" 
        />
      </transition-group>
      
      <div v-else class="flex flex-col items-center justify-center gap-2 py-6 h-full">
        <MessageSquareOff :size="24" class="text-slate-600/40" />
        <p class="text-[11px] font-medium text-slate-500 text-center">No active conversations.<br/>Send a message!</p>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.list-move,
.list-enter-active,
.list-leave-active { transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
.list-enter-from,
.list-leave-to { opacity: 0; transform: translateX(-30px); }
.list-leave-active { position: absolute; width: 100%; }
</style>