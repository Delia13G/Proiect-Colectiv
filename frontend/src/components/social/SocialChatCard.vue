<!-- frontend/src/components/social/SocialChatCard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Camera, Mic, File, BellOff, Bell, Pin, AtSign } from 'lucide-vue-next';
import { useSwipe } from '@vueuse/core';

const props = defineProps<{
  id: number;
  name: string;
  message: string;
  avatar: string;
  active: boolean;
  unreadCount?: number;
  timestamp?: string | Date;
  isTyping?: boolean;
  messageType?: 'text' | 'image' | 'audio' | 'file';
  hasMention?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
}>();

const emit = defineEmits<{
  (event: 'click', id: number): void;
  (event: 'mute', id: number): void;
}>();

const imageError = ref(false);
const handleImageError = () => { imageError.value = true; };
const initial = computed(() => props.name ? props.name.charAt(0).toUpperCase() : '?');

const formattedTime = computed(() => {
  if (!props.timestamp) return '';
  const date = new Date(props.timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'Now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
});

const cardRef = ref<HTMLElement | null>(null);
const isSwiped = ref(false);

useSwipe(cardRef, {
  onSwipeEnd(e, direction) {
    if (direction === 'left') isSwiped.value = true;
    else if (direction === 'right') isSwiped.value = false;
  }
});
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-xl bg-transparent">
    
    <!-- MOBILE SWIPE ACTION -->
    <div 
      class="absolute inset-y-0 right-0 w-16 bg-slate-700 flex items-center justify-center rounded-r-xl transition-opacity duration-300 z-0"
      :class="isSwiped ? 'opacity-100' : 'opacity-0'"
    >
      <button 
        @click.stop="emit('mute', id); isSwiped = false;" 
        class="text-white hover:scale-110 transition-transform p-2 outline-none cursor-pointer"
        :title="isMuted ? 'Unmute notifications' : 'Mute notifications'"
      >
        <BellOff v-if="!isMuted" :size="20" />
        <Bell v-else :size="20" />
      </button>
    </div>

    <!-- MAIN CARD -->
    <button 
      ref="cardRef"
      @click="isSwiped ? (isSwiped = false) : emit('click', id)"
      class="relative w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent bg-slate-900 hover:bg-slate-800 transition-transform duration-300 text-left outline-none z-10 group cursor-pointer"
      :class="isSwiped ? '-translate-x-16' : 'translate-x-0'"
    >
      <!-- DESKTOP QUICK ACTIONS -->
      <div class="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center bg-slate-900/95 backdrop-blur-md pl-3 pr-2 py-1.5 rounded-l-xl shadow-[-12px_0_15px_rgba(15,23,42,1)] z-20 opacity-0 translate-x-4 pointer-events-none transition-all duration-300 ease-out delay-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto group-hover:delay-500">
        <div 
          @click.stop="emit('mute', id)" 
          class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors outline-none cursor-pointer"
          :title="isMuted ? 'Unmute' : 'Mute'"
        >
          <BellOff v-if="!isMuted" :size="15" />
          <Bell v-else :size="15" />
        </div>
      </div>

      <div class="relative shrink-0 w-11 h-11 rounded-full overflow-hidden transition-transform group-hover:scale-105 bg-slate-800 border-[1.5px] border-slate-700/50 shadow-md">
        <img 
          v-if="!imageError && avatar" 
          :src="avatar" 
          @error="handleImageError"
          class="w-full h-full object-cover" 
          :class="isMuted ? 'opacity-60 grayscale-[30%]' : ''"
          :alt="name"
        />
        <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-slate-300 font-bold text-lg">
          {{ initial }}
        </div>
        <span v-if="active" class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-[2px] border-slate-900 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
      </div>

      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <div class="flex justify-between items-baseline mb-0.5">
          <div class="flex items-center gap-1.5 min-w-0 pr-2">
            <span class="text-[13px] font-semibold block truncate transition-colors" :class="[active ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-slate-200 group-hover:text-white', isMuted ? 'opacity-60' : '']">
              {{ name }}
            </span>
            <BellOff v-if="isMuted" :size="11" class="text-slate-500 shrink-0" />
            <Pin v-if="isPinned" :size="10" class="text-emerald-400 shrink-0 fill-emerald-400/20" />
          </div>
          <span class="text-[10px] shrink-0 ml-2" :class="(unreadCount && unreadCount > 0 && !isMuted) ? 'text-emerald-400 font-bold' : 'text-slate-500'">{{ formattedTime }}</span>
        </div>
        
        <div class="flex justify-between items-center gap-2 min-h-[18px]">
          <div v-if="isTyping" class="flex items-center gap-1 text-emerald-400 text-[12px] font-medium animate-pulse">
            <span>typing</span>
            <span class="flex gap-0.5 pt-1">
              <span class="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span class="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span class="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
            </span>
          </div>
          <template v-else>
            <div class="flex items-center gap-1 min-w-0" :class="isMuted ? 'opacity-60' : ''">
              <Camera v-if="messageType === 'image'" :size="13" class="text-emerald-400 shrink-0" />
              <Mic v-else-if="messageType === 'audio'" :size="13" class="text-emerald-400 shrink-0" />
              <File v-else-if="messageType === 'file'" :size="13" class="text-emerald-400 shrink-0" />
              <span v-if="hasMention" class="text-[12px] font-bold text-rose-400">@You</span>
              <p class="text-[12px] truncate" :class="[(unreadCount && unreadCount > 0 && !isMuted) ? 'text-slate-300 font-medium' : 'text-slate-400/90', hasMention ? 'pl-0.5' : '']">
                <template v-if="messageType === 'image'">Photo</template>
                <template v-else-if="messageType === 'audio'">Voice message</template>
                <template v-else-if="messageType === 'file'">File</template>
                <template v-else>{{ message }}</template>
              </p>
            </div>
          </template>
          
          <div class="flex gap-1 shrink-0">
            <span v-if="hasMention && unreadCount && unreadCount > 0" class="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]"><AtSign :size="12" /></span>
            <span v-else-if="unreadCount && unreadCount > 0" class="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :class="isMuted ? 'bg-slate-600 text-slate-300 shadow-none' : 'bg-emerald-500'">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </div>
        </div>
      </div>
    </button>
  </div>
</template>