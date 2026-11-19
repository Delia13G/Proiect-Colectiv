<!-- frontend/src/components/pro/ProChatCard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Code, Link as LinkIcon, FileText, Pin, AtSign, AlertTriangle, CheckSquare, Calendar, Headphones, GitBranch } from 'lucide-vue-next';
import { useSwipe } from '@vueuse/core';

const props = defineProps<{
  id: number;
  name: string;
  message: string;
  avatar: string;
  unreadCount?: number;
  timestamp?: string | Date;
  role?: 'Backend' | 'Frontend' | 'UI/UX' | 'Team Lead';
  activityStatus?: 'typing' | 'uploading' | 'coding';
  messageType?: 'text' | 'file' | 'code_snippet' | 'link';
  hasMention?: boolean;
  isUrgent?: boolean;
  isPinned?: boolean;
  presence?: 'online' | 'meeting' | 'focus' | 'offline';
  repliesCount?: number; 
}>();

const emit = defineEmits<{
  (event: 'click', id: number): void;
  (event: 'action', id: number): void; 
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
    if (direction === 'left') isSwiped.value = true;
    else if (direction === 'right') isSwiped.value = false;
  }
});
</script>

<template>
  <div class="relative w-full overflow-hidden rounded-xl bg-transparent shrink-0">
    
    <!-- MOBILE SWIPE ACTION -->
    <div class="absolute inset-y-0 right-0 w-16 flex items-center justify-center rounded-r-xl transition-opacity duration-300 z-0" :class="[isSwiped ? 'opacity-100' : 'opacity-0', isUrgent ? 'bg-amber-600' : 'bg-indigo-600']">
      <button @click.stop="emit('action', id); isSwiped = false;" class="text-white hover:scale-110 transition-transform p-2 outline-none cursor-pointer" aria-label="Quick Action">
        <CheckSquare :size="20" />
      </button>
    </div>

    <!-- MAIN CARD -->
    <!-- SCHIMBARE MAJORĂ CSS: bg-transparent, hover:bg-slate-700/40, p-2, fără border -->
    <button 
      ref="cardRef"
      @click="isSwiped ? (isSwiped = false) : emit('click', id)"
      class="relative w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-300 text-left outline-none z-10 group cursor-pointer border border-transparent"
      :class="[
        isSwiped ? '-translate-x-16' : 'translate-x-0',
        isUrgent ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-transparent hover:bg-slate-700/40'
      ]"
    >
      <!-- DESKTOP QUICK ACTIONS -->
      <div class="absolute right-1 top-1/2 -translate-y-1/2 hidden md:flex items-center bg-slate-800/95 backdrop-blur-md px-2 py-1.5 rounded-lg shadow-xl z-20 opacity-0 translate-x-4 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto">
        <div @click.stop="emit('action', id)" class="p-1.5 rounded-md hover:bg-slate-600 text-slate-400 hover:text-white transition-colors outline-none cursor-pointer" aria-label="Action">
          <CheckSquare :size="15" />
        </div>
      </div>

      <!-- AVATAR WITH RICH PRESENCE (Dimensiune redusă la 36px) -->
      <div class="relative shrink-0 w-9 h-9 transition-transform group-hover:scale-105">
        <div class="w-full h-full rounded-full overflow-hidden bg-slate-800 border-[1.5px] border-slate-700/50" :class="isUrgent ? 'ring-2 ring-amber-500/50' : ''">
          <img v-if="!imageError && avatar" :src="avatar" @error="handleImageError" class="w-full h-full object-cover" :alt="name" />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-slate-300 font-bold text-[10px]">{{ initial }}</div>
        </div>
        
        <!-- Contextual Presence Badge -->
        <div v-if="presence && presence !== 'offline'"
             class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[2px] border-slate-900 rounded-full flex items-center justify-center z-10"
             :class="{
               'bg-emerald-400': presence === 'online',
               'bg-amber-400': presence === 'meeting',
               'bg-purple-400': presence === 'focus'
             }"
        >
          <Calendar v-if="presence === 'meeting'" :size="7" class="text-amber-950" />
          <Headphones v-if="presence === 'focus'" :size="7" class="text-purple-950" />
        </div>
      </div>

      <!-- CHAT INFO (Linii compacte) -->
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        
        <div class="flex justify-between items-baseline mb-0.5">
          <div class="flex items-center gap-1.5 min-w-0 pr-1">
            <span class="text-[13px] font-bold block truncate transition-colors" :class="(unreadCount && unreadCount > 0) ? 'text-white' : 'text-slate-300 group-hover:text-white'">{{ name }}</span>
            <span v-if="role" class="px-1 py-[1px] rounded text-[8px] font-bold uppercase tracking-wider shrink-0" :class="{ 'bg-blue-500/20 text-blue-400 border border-blue-500/20': role === 'Backend', 'bg-teal-500/20 text-teal-400 border border-teal-500/20': role === 'Frontend', 'bg-purple-500/20 text-purple-400 border border-purple-500/20': role === 'UI/UX', 'bg-rose-500/20 text-rose-400 border border-rose-500/20': role === 'Team Lead' }">{{ role }}</span>
            <Pin v-if="isPinned" :size="10" class="text-indigo-400 shrink-0 fill-indigo-400/20" />
            <AlertTriangle v-if="isUrgent" :size="10" class="text-amber-500 shrink-0" />
          </div>
          <span class="text-[9px] shrink-0 ml-1" :class="isUrgent ? 'text-amber-400 font-bold' : (unreadCount && unreadCount > 0 ? 'text-indigo-400 font-bold' : 'text-slate-500')">{{ formattedTime }}</span>
        </div>
        
        <div class="flex justify-between items-center gap-2">
          <!-- ACTIVITY STATUS PRO -->
          <div v-if="activityStatus" class="flex items-center gap-1 text-indigo-400 text-[11px] font-medium">
            <span v-if="activityStatus === 'typing'" class="flex gap-0.5 italic">Typing<span class="animate-pulse">...</span></span>
            <span v-else-if="activityStatus === 'coding'" class="flex items-center gap-1 italic"><Code :size="10" class="animate-pulse" /> Coding</span>
            <span v-else-if="activityStatus === 'uploading'" class="flex items-center gap-1 italic"><FileText :size="10" class="animate-bounce" /> Uploading</span>
          </div>

          <!-- MESSAGE / RICH MEDIA -->
          <template v-else>
            <div class="flex items-center gap-1 min-w-0">
              <Code v-if="messageType === 'code_snippet'" :size="11" class="text-indigo-400 shrink-0" />
              <LinkIcon v-else-if="messageType === 'link'" :size="11" class="text-indigo-400 shrink-0" />
              <FileText v-else-if="messageType === 'file'" :size="11" class="text-indigo-400 shrink-0" />
              <span v-if="hasMention" class="text-[11px] font-bold text-amber-500">@You</span>
              
              <p class="text-[11px] truncate w-full" :class="[(unreadCount && unreadCount > 0) ? 'text-slate-300 font-medium' : 'text-slate-500', hasMention ? 'pl-0.5' : '']">
                <template v-if="messageType === 'code_snippet'">Code snippet</template>
                <template v-else-if="messageType === 'link'">External link</template>
                <template v-else-if="messageType === 'file'">Document</template>
                <template v-else>{{ message }}</template>
              </p>
            </div>
          </template>
          
          <div class="flex gap-1 items-center shrink-0">
            <!-- THREADS INDICATOR -->
            <div v-if="repliesCount" class="flex items-center gap-1 px-1 py-[1px] rounded bg-slate-700/50 text-slate-300 text-[9px] font-bold border border-slate-600/50">
              <GitBranch :size="8" /> {{ repliesCount }}
            </div>
            
            <!-- NOTIFICATIONS -->
            <span v-if="hasMention && unreadCount && unreadCount > 0" class="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.5)]"><AtSign :size="10" /></span>
            <span v-else-if="unreadCount && unreadCount > 0" class="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.4)]">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </div>
        </div>
      </div>
    </button>
  </div>
</template>