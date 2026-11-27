<!-- frontend/src/components/social/SocialSidebarContent.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import SocialChatCard from './SocialChatCard.vue';
import SocialGroupCard from './SocialGroupCard.vue';
import { Users, MessageSquareOff } from 'lucide-vue-next';
import { useSocialStore } from '../../stores/useSocialStore';

const emit = defineEmits<{
  (event: 'open-group', squadId: number): void;
  (event: 'open-all-groups'): void;
  (event: 'open-chat', chatId: number): void;
}>();

const socialStore = useSocialStore();
const { squads, sortedChats, activeFriendsCount, isLoading, connectionStatus } = storeToRefs(socialStore);

onMounted(() => {
  socialStore.fetchSocialData();
});
</script>

<template>
  <div class="flex-1 flex flex-col gap-6 min-h-0 pb-4">
    
    <!-- WEBSOCKET CONNECTION BANNER -->
    <div 
      v-if="connectionStatus && connectionStatus !== 'connected'"
      class="flex items-center justify-center gap-2 py-2 px-3 rounded-[12px] text-[11px] font-semibold transition-colors shrink-0 shadow-sm border"
      :class="connectionStatus === 'offline' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
    >
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="connectionStatus === 'offline' ? 'bg-rose-400' : 'bg-amber-400'"></span>
        <span class="relative inline-flex rounded-full h-2 w-2" :class="connectionStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'"></span>
      </span>
      {{ connectionStatus === 'offline' ? 'Connection lost.' : 'Reconnecting...' }}
    </div>

    <!-- SOCIAL GROUPS -->
    <div class="flex flex-col gap-2 p-4 rounded-[20px] bg-slate-800/30 backdrop-blur-md border border-white/[0.08] shadow-lg max-h-[38%] shrink-0 flex-none">
      <div class="flex justify-between items-center mb-1 shrink-0">
        <h3 class="text-xs font-semibold tracking-wide text-white uppercase">Groups</h3>
        <button @click="emit('open-all-groups')" class="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">See all</button>
      </div>
      
      <div v-if="isLoading" class="flex flex-col gap-3 pt-1">
        <div v-for="i in 2" :key="i" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-700/40 animate-pulse shrink-0"></div>
          <div class="flex-1 flex flex-col gap-1.5">
            <div class="w-24 h-3 bg-slate-700/40 rounded animate-pulse"></div>
            <div class="w-16 h-2 bg-slate-700/30 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <div v-else-if="squads.length > 0" class="flex flex-col gap-1 overflow-y-auto pr-1 pb-1 scrollbar-hide relative -mx-2 px-2">
        <SocialGroupCard 
          v-for="squad in squads" 
          :key="squad.id"
          :id="squad.id"
          :name="squad.name"
          :image="squad.image"
          :membersCount="squad.membersCount"
          :isJoined="squad.isJoined"
          :hasActivity="squad.hasActivity"
          @click="(id) => emit('open-group', id)"
          @join="(id) => socialStore.joinSquad(id)"
        />
      </div>
      
      <div v-else class="flex flex-col items-center justify-center gap-1.5 py-4">
        <Users :size="20" class="text-slate-600/50" />
        <p class="text-[11px] font-medium text-slate-500 text-center">No suggested groups.</p>
      </div>
    </div>

    <!-- ONLINE FRIENDS -->
    <div class="flex-1 flex flex-col gap-3 min-h-0 p-4 rounded-[20px] bg-slate-800/30 backdrop-blur-md border border-white/[0.08] shadow-lg overflow-hidden relative">
      <div class="flex justify-between items-center shrink-0">
        <h3 class="text-xs font-semibold tracking-wide text-white uppercase">Chats</h3>
        <span class="text-xs text-emerald-400 font-semibold" v-if="!isLoading && sortedChats.length > 0">{{ activeFriendsCount }} online</span>
      </div>

      <div v-if="isLoading" class="flex flex-col gap-4 overflow-hidden pt-2">
        <div v-for="i in 3" :key="i" class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-full bg-slate-700/40 animate-pulse shrink-0"></div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="w-20 h-3.5 bg-slate-700/40 rounded animate-pulse"></div>
            <div class="w-28 h-3 bg-slate-700/30 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <transition-group 
        v-else-if="sortedChats.length > 0"
        name="list" 
        tag="div" 
        class="flex flex-col gap-1.5 overflow-y-auto pt-2 scrollbar-hide relative"
      >
        <SocialChatCard 
          v-for="chat in sortedChats" 
          :key="chat.id"
          :id="chat.id"
          :name="chat.name"
          :message="chat.message"
          :avatar="chat.avatar"
          :active="chat.active"
          :unreadCount="chat.unreadCount"
          :timestamp="chat.timestamp"
          :isTyping="chat.isTyping"
          :messageType="chat.messageType"
          :hasMention="chat.hasMention"
          :isMuted="chat.isMuted"
          :isPinned="chat.isPinned"
          @click="(id) => emit('open-chat', id)"
          @mute="(id) => socialStore.toggleMute(id)"
        />
      </transition-group>
      
      <div v-else class="flex flex-col items-center justify-center gap-2 py-6 h-full">
        <MessageSquareOff :size="24" class="text-slate-600/40" />
        <p class="text-[11px] font-medium text-slate-500 text-center">No messages.<br/>Start a conversation!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.list-move, .list-enter-active, .list-leave-active { transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-30px); }
.list-leave-active { position: absolute; width: 100%; }
</style>