<!-- frontend/src/components/chat/ChatListView.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, ChevronRight, CheckCheck, MessageSquare } from 'lucide-vue-next';

const props = defineProps<{
  activeLens: 'PRO' | 'SOCIAL' | 'DATE';
}>();

const router = useRouter();

// ==========================================
// 1. THEMING
// ==========================================
const theme = computed(() => {
  switch (props.activeLens) {
    case 'DATE': return { text: 'text-rose-500', bg: 'bg-rose-500', bgLight: 'bg-rose-500/10', border: 'border-rose-500/30', hover: 'hover:bg-rose-500/20' };
    case 'SOCIAL': return { text: 'text-emerald-500', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', border: 'border-emerald-500/30', hover: 'hover:bg-emerald-500/20' };
    case 'PRO': default: return { text: 'text-indigo-500', bg: 'bg-indigo-500', bgLight: 'bg-indigo-500/10', border: 'border-indigo-500/30', hover: 'hover:bg-indigo-500/20' };
  }
});

// ==========================================
// 2. MOCK DATA (Vom înlocui cu Store-urile Pinia mai târziu)
// ==========================================
const chatList = computed(() => [
  { id: 1, name: 'Andreea Ionescu', message: 'Almost done. I just need to fix the sidebar styling.', timestamp: '10:45 AM', unread: 2, avatar: 'https://i.pravatar.cc/150?img=16' },
  { id: 2, name: 'Proiect Colectiv Team', message: 'Pavel: I pushed the backend code.', timestamp: 'Yesterday', unread: 0, avatar: 'https://i.pravatar.cc/150?img=33', isGroup: true },
  { id: 3, name: 'Mihai (Mentor)', message: 'Let me know if you need help with the API.', timestamp: 'Tuesday', unread: 0, avatar: 'https://i.pravatar.cc/150?img=11' },
]);

// ==========================================
// 3. NAVIGATION
// ==========================================
const openChat = (chatId: number) => {
  // Navigăm către fereastra de chat specifică
  router.push({ name: 'chat-detail', params: { id: chatId }, query: { lens: props.activeLens } });
};
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-slate-950/40 p-6 md:p-8">
    
    <!-- HEADER & SEARCH -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <MessageSquare :class="theme.text" :size="28" />
          Conversations
        </h1>
        <p class="text-slate-400 text-sm">Manage your {{ activeLens.toLowerCase() }} chats and messages.</p>
      </div>
      
      <div class="relative w-full md:w-72">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="text-slate-500" :size="18" />
        </div>
        <input 
          type="text" 
          placeholder="Search chats..." 
          class="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2"
          :class="`focus:ring-${theme.text.split('-')[1]}-500/50`"
        >
      </div>
    </div>

    <!-- CHAT LIST -->
    <div class="flex-1 bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
      <div class="overflow-y-auto p-2 scrollbar-hide">
        
        <div 
          v-for="chat in chatList" 
          :key="chat.id"
          @click="openChat(chat.id)"
          class="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors group"
          :class="theme.hover"
        >
          <!-- Avatar -->
          <div class="relative w-12 h-12 shrink-0">
            <img :src="chat.avatar" class="w-full h-full rounded-full object-cover border border-slate-700/50" />
            <span v-if="chat.unread > 0" class="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 text-[10px] font-bold text-white flex items-center justify-center" :class="theme.bg">
              {{ chat.unread }}
            </span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-0.5">
              <h3 class="text-sm font-bold text-white truncate" :class="chat.unread > 0 ? theme.text : ''">
                {{ chat.name }}
              </h3>
              <span class="text-[11px] font-medium text-slate-500 shrink-0">{{ chat.timestamp }}</span>
            </div>
            
            <div class="flex items-center gap-1.5">
              <CheckCheck v-if="chat.unread === 0 && !chat.isGroup" :size="14" class="text-slate-500 shrink-0" />
              <p class="text-xs truncate" :class="chat.unread > 0 ? 'text-white font-medium' : 'text-slate-400'">
                {{ chat.message }}
              </p>
            </div>
          </div>

          <!-- Arrow -->
          <div class="text-slate-600 group-hover:text-white transition-colors px-2 shrink-0">
            <ChevronRight :size="18" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>