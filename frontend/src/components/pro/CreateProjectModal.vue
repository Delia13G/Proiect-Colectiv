<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
    <div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl flex flex-col gap-5">
      <!-- Header Modal -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 class="text-sm font-bold text-white">Publică un Proiect / Anunț Nou</h3>
          <p class="text-[11px] text-slate-400">Găsește colegi de echipă pentru teme sau proiecte de semestru.</p>
        </div>
        <button @click="close" class="text-slate-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Formular -->
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <!-- Titlu Proiect -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300">Titlul Proiectului / Anunțului</label>
          <input
            v-model="title"
            required
            type="text"
            placeholder="Ex: Echipa Algoritmi Genetici - Tema 2"
            class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />
        </div>

        <!-- Categorie -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300">Tip Colaborare</label>
          <select
            v-model="category"
            class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 cursor-pointer transition-all"
          >
            <option value="Anunț de echipe" class="bg-slate-900 text-white">Anunț de echipe (Proiect facultate)</option>
            <option value="Anunț de colaborare" class="bg-slate-900 text-white">Colaborare Proiect Licență / Cercetare</option>
            <option value="Hackathon Team" class="bg-slate-900 text-white">Echipă Hackathon</option>
          </select>
        </div>

        <!-- Descriere scurtă -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300">Descriere & Rol Căutat</label>
          <textarea
            v-model="description"
            rows="3"
            required
            placeholder="Ce tehnologii folosiți și ce profil de coleg căutați..."
            class="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all"
          ></textarea>
        </div>

        <!-- Acțiuni -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Anulează
          </button>
          <button
            type="submit"
            class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all"
          >
            Publică Anunțul
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', project: { title: string; category: string; description: string }): void;
}>();

const title = ref('');
const category = ref('Anunț de echipe');
const description = ref('');

function close() {
  title.value = '';
  description.value = '';
  emit('close');
}

function handleSubmit() {
  if (!title.value.trim()) return;
  emit('create', {
    title: title.value,
    category: category.value,
    description: description.value
  });
  close();
}
</script>