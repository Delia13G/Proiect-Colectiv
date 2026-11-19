<!-- frontend/src/components/dating/DateChatCard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Camera, Mic, Check, CheckCheck, Pin, Trash2 } from 'lucide-vue-next';
import { useSwipe } from '@vueuse/core';

const props = defineProps<{
  id: number;
  name: string;
  message: string;
  image: string;
  unread: boolean;
  online?: boolean;
  timestamp?: string | Date;
  isTyping?: boolean;
  messageType?: 'text' | 'image' | 'audio';
  isMine?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isPinned?: boolean;
}>();

const emit = defineEmits<{
  (event: 'click', id: number): void;
  (event: 'delete', id: number): void;
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
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  if (isYesterday) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
});

// NATIVE SWIPE IMPLEMENTATION
const cardRef = ref<HTMLElement | null>(null);
const isSwiped = ref(false);

useSwipe(cardRef, {
  onSwipeEnd(e, direction) {
    if (direction === 'left') {
      isSwiped.value = true;
    } else if (direction === 'right') {
      isSwiped.value = false;
    }
  }
});

// ACCESSIBILITY (Screen Readers)
const ariaLabelText = computed(() => {
  let onlineStatus = props.online ? 'Online' : 'Offline';
  let unreadText = props.unread ? 'You have an unread message.' : '';
  let sentByText = props.isMine 
    ? `You sent the last message. Status: ${props.status}.` 
    : `Last message from ${props.name}.`;
    
  return `Chat with ${props.name}, ${onlineStatus}. ${unreadText} ${sentByText}`;
});
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-xl">
    
    <!-- HIDDEN DELETE BUTTON (Swipe Action) -->
    <div 
      class="absolute inset-y-0 right-0 w-16 bg-rose-600 flex items-center justify-center rounded-r-xl transition-opacity duration-300 z-0"
      :class="isSwiped ? 'opacity-100' : 'opacity-0'"
    >
      <button 
        @click.stop="emit('delete', id)" 
        class="text-white hover:scale-110 transition-transform p-2 outline-none cursor-pointer"
        aria-label="Delete chat"
      >
        <Trash2 :size="20" />
      </button>
    </div>

    <!-- MAIN CARD -->
    <button 
      ref="cardRef"
      :aria-label="ariaLabelText"
      @click="isSwiped ? (isSwiped = false) : emit('click', id)"
      class="relative w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent bg-slate-900 hover:bg-slate-800 transition-transform duration-300 text-left outline-none z-10 group cursor-pointer"
      :class="isSwiped ? '-translate-x-16' : 'translate-x-0'"
    >
      <div 
        class="shrink-0 rounded-full p-[2px] transition-transform group-hover:scale-105 shadow-md"
        :class="online ? 'bg-gradient-to-br from-rose-500 to-rose-400/50 shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'bg-transparent'"
      >
        <div class="relative w-11 h-11 rounded-full overflow-hidden border-[2px] border-slate-900 bg-slate-800 flex items-center justify-center">
          <img v-if="!imageError && image" :src="image" :alt="name" @error="handleImageError" class="w-full h-full object-cover" />
          <span v-else class="text-slate-300 font-bold text-lg">{{ initial }}</span>
        </div>
      </div>
      
      <div class="flex-1 min-w-0 flex flex-col justify-center pl-1">
        <div class="flex justify-between items-baseline mb-0.5">
          <div class="flex items-center gap-1.5 min-w-0 pr-2">
            <h3 class="text-[13px] font-semibold text-slate-100 group-hover:text-white transition-colors truncate">{{ name }}</h3>
            <!-- PINNED ICON -->
            <Pin v-if="isPinned" :size="10" class="text-rose-400 shrink-0 fill-rose-400/20" />
          </div>
          
          <div class="flex items-center gap-1 shrink-0">
            <span class="text-[10px]" :class="unread ? 'text-rose-400 font-bold' : 'text-slate-500'">{{ formattedTime }}</span>
            <div v-if="isMine && !isTyping" class="flex items-center">
              <Check v-if="status === 'sent'" :size="12" class="text-slate-500" />
              <CheckCheck v-else-if="status === 'delivered'" :size="12" class="text-slate-500" />
              <CheckCheck v-else-if="status === 'read'" :size="12" class="text-rose-400" />
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-1.5 min-h-[18px]">
          <div v-if="isTyping" class="flex items-center gap-1 text-rose-400 text-[12px] font-medium animate-pulse">
            <span>typing</span>
            <span class="flex gap-0.5 pt-1">
              <span class="w-1 h-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span class="w-1 h-1 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span class="w-1 h-1 bg-rose-400 rounded-full animate-bounce"></span>
            </span>
          </div>

          <template v-else>
            <span v-if="isMine && messageType === 'text'" class="text-[12px] text-slate-500 font-medium pr-1">You:</span>
            
            <span v-if="messageType === 'image'" class="flex items-center gap-1 text-[12px] text-rose-300 font-medium truncate">
              <Camera :size="13" /> {{ isMine ? 'You sent a photo' : 'Photo' }}
            </span>
            
            <span v-else-if="messageType === 'audio'" class="flex items-center gap-1 text-[12px] text-rose-300 font-medium truncate">
              <Mic :size="13" /> {{ isMine ? 'You sent a voice message' : 'Voice message' }}
            </span>
            
            <p v-else class="text-[12px] truncate pr-4" :class="unread ? 'text-slate-300 font-medium' : 'text-slate-400/80'">
              {{ message }}
            </p>
          </template>
        </div>
      </div>
      
      <div class="w-3 flex justify-end shrink-0 self-center">
        <span v-if="unread && !isMine" class="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]"></span>
      </div>
    </button>
  </div>
</template>