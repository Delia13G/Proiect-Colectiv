<template>
  <aside class="w-80 h-full p-5 bg-slate-900/40 backdrop-blur-xl border-l border-white/10 flex flex-col gap-6 select-none overflow-y-auto">
    <!-- Header Panou -->
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300">Filtrare Profesională</h3>
      <button
        type="button"
        @click="resetFilters"
        class="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        Resetează
      </button>
    </div>

    <!-- 1. Search Bar Skills / Tehnologii -->
    <div class="relative">
      <svg
        class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Căutare Skills / Tehnologii"
        class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
      />
    </div>

    <!-- 2. Dropdown Domeniu -->
    <div class="flex flex-col gap-2">
      <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Domeniu</label>
      <div class="relative">
        <select
          v-model="selectedDomain"
          class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 appearance-none cursor-pointer transition-all"
        >
          <option value="it" class="bg-slate-900 text-white">IT & Dezvoltare Software</option>
          <option value="design" class="bg-slate-900 text-white">UI/UX & Design Digital</option>
          <option value="data" class="bg-slate-900 text-white">Data Science & AI</option>
          <option value="econ" class="bg-slate-900 text-white">Economie & Business</option>
        </select>
        <svg
          class="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- 3. Accordion Filtre Competențe -->
    <div class="flex flex-col gap-2">
      <button
        type="button"
        @click="showSkills = !showSkills"
        class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/[0.08] transition-all"
      >
        <span class="font-medium">Filtre Competențe (Skills)</span>
        <svg
          class="w-4 h-4 text-slate-400 transition-transform duration-200"
          :class="showSkills ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div v-if="showSkills" class="flex flex-wrap gap-1.5 p-2 bg-slate-950/40 rounded-xl border border-white/5">
        <button
          v-for="skill in availableSkills"
          :key="skill"
          type="button"
          @click="toggleSkill(skill)"
          :class="selectedSkills.includes(skill)
            ? 'bg-indigo-600 text-white border-indigo-400/50'
            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'"
          class="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all"
        >
          {{ skill }}
        </button>
      </div>
    </div>

    <!-- 4. Slidere: Vârstă și Distanță -->
    <div class="flex flex-col gap-5 pt-2 border-t border-white/10">
      <!-- Vârstă -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-medium">Vârstă</span>
          <span class="text-white font-mono font-bold">{{ ageRange }} ani</span>
        </div>
        <input
          v-model="ageRange"
          type="range"
          min="18"
          max="30"
          class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      <!-- Distanță -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400 font-medium">Distanță</span>
          <span class="text-white font-mono font-bold">{{ distance }} km</span>
        </div>
        <input
          v-model="distance"
          type="range"
          min="1"
          max="50"
          class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
    </div>

    <!-- 5. Toggles Disponibilitate & Trust -->
    <div class="flex flex-col gap-4 pt-2 border-t border-white/10">
      <!-- Toggle Internship -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-xs text-slate-300 font-medium">Disponibil pentru internship</span>
        <div class="relative">
          <input v-model="availableForInternship" type="checkbox" class="sr-only" />
          <div
            :class="availableForInternship ? 'bg-indigo-600' : 'bg-slate-800'"
            class="w-10 h-5.5 rounded-full transition-colors border border-white/10 shadow-inner"
          ></div>
          <div
            :class="availableForInternship ? 'translate-x-4.5 bg-white' : 'translate-x-0.5 bg-slate-400'"
            class="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full transition-transform duration-200"
          ></div>
        </div>
      </label>

      <!-- Toggle Studenți Verificați -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-xs text-slate-300 font-medium">Doar studenți verificați</span>
        <div class="relative">
          <input v-model="onlyVerifiedStudents" type="checkbox" class="sr-only" />
          <div
            :class="onlyVerifiedStudents ? 'bg-indigo-600' : 'bg-slate-800'"
            class="w-10 h-5.5 rounded-full transition-colors border border-white/10 shadow-inner"
          ></div>
          <div
            :class="onlyVerifiedStudents ? 'translate-x-4.5 bg-white' : 'translate-x-0.5 bg-slate-400'"
            class="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full transition-transform duration-200"
          ></div>
        </div>
      </label>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const searchQuery = ref('');
const selectedDomain = ref('it');
const showSkills = ref(true);
const selectedSkills = ref<string[]>(['Java', 'Vue 3', 'Python']);
const availableSkills = ['Java', 'Vue 3', 'Python', 'React', 'C++', 'SQL', 'Figma', 'Quarkus', 'Docker'];

const ageRange = ref(24);
const distance = ref(15);
const availableForInternship = ref(true);
const onlyVerifiedStudents = ref(false);

function toggleSkill(skill: string) {
  if (selectedSkills.value.includes(skill)) {
    selectedSkills.value = selectedSkills.value.filter((s) => s !== skill);
  } else {
    selectedSkills.value.push(skill);
  }
}

function resetFilters() {
  searchQuery.value = '';
  selectedDomain.value = 'it';
  selectedSkills.value = ['Java', 'Vue 3'];
  ageRange.value = 24;
  distance.value = 15;
  availableForInternship.value = true;
  onlyVerifiedStudents.value = false;
}
</script>