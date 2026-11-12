<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
    <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl flex flex-col gap-5">
      <!-- Header Modal -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img :src="target?.avatar" :alt="target?.name" class="w-10 h-10 rounded-xl object-cover border border-white/10" />
          <div>
            <h3 class="text-sm font-bold text-white">Conectare cu {{ target?.name }}</h3>
            <p class="text-[11px] text-slate-400">{{ target?.role }}</p>
          </div>
        </div>
        <button @click="close" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Textarea Pitch Message -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-slate-300">Mesaj de prezentare / Pitch (opțional):</label>
        <textarea
          v-model="pitchMessage"
          rows="3"
          placeholder="Salut! Aș vrea să discutăm despre o colaborare pe proiect..."
          class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all"
        ></textarea>
      </div>

      <!-- Acțiuni -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          Anulează
        </button>
        <button
          type="button"
          @click="handleSend"
          :disabled="isSubmitting"
          class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)] disabled:opacity-60 transition-all flex items-center gap-2"
        >
          <span v-if="isSubmitting" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ isSubmitting ? 'Se trimite...' : 'Trimite solicitarea' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Talent } from '../../services/proService';

const props = defineProps<{
  isOpen: boolean;
  target: Talent | null;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', message: string): void;
}>();

const pitchMessage = ref('');

function close() {
  pitchMessage.value = '';
  emit('close');
}

function handleSend() {
  emit('submit', pitchMessage.value);
  pitchMessage.value = '';
}
</script>