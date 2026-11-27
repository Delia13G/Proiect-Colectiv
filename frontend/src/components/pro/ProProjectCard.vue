<!-- frontend/src/components/pro/ProProjectCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { MoreHorizontal, Clock } from 'lucide-vue-next';

const props = defineProps<{
  id: number;
  title: string;
  category: string;
  icon?: string;
  isNew?: boolean;
  progress?: number; 
  dueSoon?: boolean; 
}>();

const emit = defineEmits<{
  (event: 'click', id: number): void;
  (event: 'open-options', id: number): void;
}>();

const initials = computed(() => {
  if (props.icon) return null;
  const words = props.title.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return props.title.substring(0, 2).toUpperCase();
});
</script>

<template>
  <button 
    @click="emit('click', id)"
    class="p-2.5 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 transition-all flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group relative"
  >
    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105 shrink-0 overflow-hidden" :class="dueSoon ? 'ring-2 ring-amber-500/50' : ''">
      <span v-if="icon" class="text-lg">{{ icon }}</span>
      <span v-else class="text-[13px] tracking-wide">{{ initials }}</span>
    </div>
    
    <div class="flex-1 min-w-0 flex flex-col justify-center pr-6">
      <div class="flex items-center gap-2 mb-0.5">
        <span class="text-[13px] font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
          {{ title }}
        </span>
        <span v-if="isNew" class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/20 text-indigo-300 uppercase tracking-wider shrink-0 border border-indigo-500/20">New</span>
        <Clock v-if="dueSoon" :size="12" class="text-amber-500 shrink-0 animate-pulse" title="Deadline approaching" />
      </div>
      
      <div class="flex items-center justify-between gap-2 mt-0.5">
        <span class="text-[11px] text-slate-400/90 truncate">{{ category }}</span>
        <span v-if="progress !== undefined" class="text-[10px] font-medium" :class="progress === 100 ? 'text-emerald-400' : 'text-indigo-400'">{{ progress }}%</span>
      </div>

      <!-- PROGRESS BAR -->
      <div v-if="progress !== undefined" class="w-full bg-slate-700/50 rounded-full h-1 mt-1.5 overflow-hidden">
        <div class="h-1 rounded-full transition-all duration-500" :class="progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>

    <!-- QUICK ACTIONS (Hover) -->
    <div class="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <div 
        role="button"
        tabindex="0"
        aria-label="Project options"
        @click.stop="emit('open-options', id)"
        class="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
      >
        <MoreHorizontal :size="16" />
      </div>
    </div>
  </button>
</template>