<!-- frontend/src/components/social/SocialGroupCard.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { Users, Plus } from 'lucide-vue-next';

const props = defineProps<{
  id: number;
  name: string;
  image: string;
  membersCount: number;
  isJoined: boolean; 
  hasActivity?: boolean;
}>();

const emit = defineEmits<{
  (event: 'click', id: number): void;
  (event: 'join', id: number): void;
}>();

const imageError = ref(false);
</script>

<template>
  <div 
    @click="isJoined ? emit('click', id) : null"
    class="relative w-full flex items-center gap-3 p-2 rounded-xl border border-transparent transition-all text-left outline-none group"
    :class="isJoined ? 'cursor-pointer hover:bg-white/5 hover:border-white/10 focus-visible:ring-2 focus-visible:ring-emerald-500' : 'bg-slate-800/20'"
  >
    <div class="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border-[1.5px] border-slate-700/50 shadow-md transition-transform" :class="isJoined ? 'group-hover:scale-105' : ''">
      <img 
        v-if="!imageError && image" 
        :src="image" 
        @error="imageError = true"
        class="w-full h-full object-cover" 
        :alt="name"
      />
      <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 text-indigo-400 font-bold text-sm">
        {{ name.charAt(0).toUpperCase() }}
      </div>
      
      <span v-if="isJoined && hasActivity" class="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 border-[2px] border-slate-900 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
    </div>

    <div class="flex-1 min-w-0 flex flex-col justify-center">
      <h3 class="text-[13px] font-semibold block truncate transition-colors" :class="isJoined ? 'text-slate-200 group-hover:text-white' : 'text-slate-300'">
        {{ name }}
      </h3>
      <div class="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
        <Users :size="10" />
        <span>{{ membersCount }} members</span>
      </div>
    </div>

    <div v-if="!isJoined" class="shrink-0 pl-1">
      <button 
        @click.stop="emit('join', id)"
        class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold transition-colors border border-emerald-500/20 hover:border-emerald-500/40 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
      >
        <Plus :size="12" stroke-width="3" /> Join
      </button>
    </div>
  </div>
</template>