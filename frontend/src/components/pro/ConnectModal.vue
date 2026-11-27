<!-- frontend/src/components/pro/ConnectModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Send, UserPlus } from 'lucide-vue-next';

// Definim proprietățile pe care le primim de la ProExploreView
const props = defineProps<{
  isOpen: boolean;
  target: any | null; // Studentul selectat
  isSubmitting: boolean;
}>();

// Definim evenimentele pe care le trimitem înapoi către părinte
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', pitchMessage: string): void;
}>();

// Mesajul scris de utilizator
const pitchMessage = ref('');

// Când modalul se închide sau deschide, resetăm câmpul de text
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    pitchMessage.value = '';
  }
});

// Trimitem mesajul către componenta părinte
const handleSubmit = () => {
  if (pitchMessage.value.trim().length === 0) return;
  emit('submit', pitchMessage.value);
};
</script>

<template>
  <transition name="modal">
    <!-- Overlay întunecat care acoperă tot ecranul -->
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <!-- Cutia Modalului -->
      <div 
        class="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        role="dialog" 
        aria-modal="true"
      >
        <!-- HEADER MODAL -->
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
          <div class="flex items-center gap-2">
            <UserPlus class="text-indigo-400" :size="20" />
            <h2 class="text-lg font-bold text-white">Trimite Solicitare</h2>
          </div>
          <button 
            @click="emit('close')" 
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors outline-none cursor-pointer"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- CONȚINUT MODAL -->
        <div class="p-6">
          <p class="text-sm text-slate-300 mb-4">
            Trimite un scurt mesaj de prezentare (pitch) către 
            <strong class="text-white">{{ target?.name }}</strong> 
            pentru a iniția o colaborare.
          </p>
          
          <div class="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 mb-5">
            <img :src="target?.avatar" class="w-10 h-10 rounded-full object-cover" />
            <div>
              <p class="text-sm font-bold text-white">{{ target?.name }}</p>
              <p class="text-xs text-indigo-400 font-medium">{{ target?.role }}</p>
            </div>
          </div>

          <textarea 
            v-model="pitchMessage"
            rows="4"
            placeholder="Salut! Lucrez la un proiect în Quarkus și am observat că ai experiență. Ți-ar plăcea să colaborăm?"
            class="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
          ></textarea>
        </div>

        <!-- FOOTER MODAL (Butoane) -->
        <div class="px-6 py-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-800/20">
          <button 
            @click="emit('close')"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors outline-none cursor-pointer disabled:opacity-50"
          >
            Anulează
          </button>
          
          <button 
            @click="handleSubmit"
            :disabled="isSubmitting || pitchMessage.trim().length === 0"
            class="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <!-- Spinner dacă e în curs de trimitere -->
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <Send v-else :size="16" />
            
            {{ isSubmitting ? 'Se trimite...' : 'Trimite Pitch' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Animație pentru apariția Modalului */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95) translateY(10px);
}
</style>