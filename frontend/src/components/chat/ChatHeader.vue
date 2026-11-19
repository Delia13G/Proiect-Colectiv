<!-- src/components/chat/ChatHeader.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Phone, Video, MoreVertical, ChevronLeft, User } from 'lucide-vue-next';
import type { ChatUser, ChatTheme } from '../../types/chat';

const props = defineProps<{
  user: ChatUser;
  theme: ChatTheme;
}>();

// Tipizare strictă pentru evenimente (Enterprise level)
const emit = defineEmits<{
  (e: 'call'): void;
  (e: 'videoCall'): void;
  (e: 'options'): void;
  (e: 'back'): void; // Pentru întoarcerea pe mobil
  (e: 'openProfile'): void; // Pentru deschiderea profilului
}>();

const imageLoaded = ref(true);
const onImageError = () => {
  imageLoaded.value = false;
};
</script>

<template>
  <header class="h-16 px-2 md:px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-white/10 shrink-0 z-10 shadow-sm transition-all">
    
    <div class="flex items-center gap-1 md:gap-4 min-w-0"> <!-- min-w-0 permite truncarea la copii -->
      <!-- Buton Înapoi (vizibil doar pe ecrane mici) -->
      <button 
        @click="emit('back')" 
        class="md:hidden p-2 rounded-xl text-slate-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label="Back to chat list"
      >
        <ChevronLeft :size="24"/>
      </button>

      <!-- Zona de Profil (Clickabilă) -->
      <button 
        @click="emit('openProfile')" 
        class="flex items-center gap-3 text-left p-1.5 -ml-1.5 rounded-xl hover:bg-slate-800/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500 min-w-0"
        aria-label="View profile details"
      >
        <!-- Avatar cu Fallback -->
        <div class="relative w-10 h-10 rounded-full overflow-hidden border-[1.5px] border-slate-700/50 shadow-md shrink-0 bg-slate-800 flex items-center justify-center">
          <img 
            v-if="imageLoaded && user.avatar" 
            :src="user.avatar" 
            @error="onImageError"
            alt="User avatar" 
            class="w-full h-full object-cover" 
            loading="lazy"
          />
          <!-- Fallback dacă imaginea dă eroare -->
          <User v-else :size="20" class="text-slate-400" />
          
          <!-- Indicator Status -->
          <span 
            class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-[1.5px] border-slate-900 transition-colors duration-300" 
            :class="user.status.toLowerCase() === 'online' ? 'bg-emerald-500' : 'bg-slate-500'"
          ></span>
        </div>

        <!-- Info Nume & Status (cu truncare) -->
        <div class="flex flex-col min-w-0 pr-2">
          <h2 class="text-sm font-bold text-white leading-tight truncate max-w-[140px] sm:max-w-[200px]" :title="user.name">
            {{ user.name }}
          </h2>
          <span class="text-[11px] font-medium truncate transition-colors duration-300" :class="theme.text">
            {{ user.isTyping ? 'Typing...' : user.status }}
          </span>
        </div>
      </button>
    </div>

    <!-- Zona de Acțiuni -->
    <div class="flex items-center gap-0.5 md:gap-2 shrink-0">
      <button 
        @click="emit('call')" 
        class="p-2.5 md:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500 min-w-[40px] min-h-[40px] flex justify-center items-center"
        aria-label="Voice call"
        title="Voice call"
      >
        <Phone :size="18"/>
      </button>
      
      <button 
        @click="emit('videoCall')" 
        class="p-2.5 md:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500 min-w-[40px] min-h-[40px] flex justify-center items-center"
        aria-label="Video call"
        title="Video call"
      >
        <Video :size="18"/>
      </button>
      
      <div class="w-[1px] h-5 bg-slate-700/50 mx-1 hidden sm:block"></div>
      
      <button 
        @click="emit('options')" 
        class="p-2.5 md:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500 min-w-[40px] min-h-[40px] flex justify-center items-center"
        aria-label="More options"
        title="Options"
      >
        <MoreVertical :size="18"/>
      </button>
    </div>
  </header>
</template>