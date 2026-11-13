<template>
  <div class="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
    <!-- Tab Switcher -->
    <div class="flex items-center gap-6 border-b border-white/10 pb-3 select-none">
      <button
        type="button"
        @click="activeTab = 'talents'"
        :class="activeTab === 'talents' ? 'text-white font-bold border-b-2 border-indigo-500 -mb-3 pb-3' : 'text-slate-400 hover:text-slate-200 font-medium'"
        class="text-sm transition-all flex items-center gap-2"
      >
        <span>Talente / Studenți</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">
          {{ filteredTalents.length }}
        </span>
      </button>

      <button
        type="button"
        @click="activeTab = 'jobs'"
        :class="activeTab === 'jobs' ? 'text-white font-bold border-b-2 border-indigo-500 -mb-3 pb-3' : 'text-slate-400 hover:text-slate-200 font-medium'"
        class="text-sm transition-all flex items-center gap-2"
      >
        <span>Oportunități / Joburi</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">
          {{ opportunities.length }}
        </span>
      </button>
    </div>

    <!-- Alertă discretă toast -->
    <div v-if="toastMessage" class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between transition-all">
      <span>{{ toastMessage }}</span>
      <button @click="toastMessage = ''" class="text-emerald-400 hover:text-emerald-200 text-sm">✕</button>
    </div>

    <!-- Vizualizare 1: Tab-ul Talente / Studenți -->
    <div v-if="activeTab === 'talents'">
      <!-- Grilă Profiluri -->
      <div v-if="filteredTalents.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="talent in filteredTalents"
          :key="talent.id"
          class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group"
        >
          <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            PRO
          </span>

          <div class="flex items-start gap-3">
            <img :src="talent.avatar" :alt="talent.name" class="w-14 h-14 rounded-2xl object-cover border border-white/10" />
            <div class="flex flex-col">
              <div class="flex items-center gap-1.5">
                <h4 class="text-sm font-bold text-white">{{ talent.name }}, {{ talent.age }}</h4>
                <span v-if="talent.verified" class="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md font-medium">
                  Verified Student
                </span>
              </div>
              <span class="text-xs text-slate-300 font-medium">{{ talent.role }}</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="skill in talent.skills"
              :key="skill"
              class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5"
            >
              {{ skill }}
            </span>
          </div>

          <button
            type="button"
            @click="openModal(talent)"
            :disabled="talent.connected"
            :class="talent.connected ? 'bg-white/10 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_14px_rgba(79,70,229,0.35)]'"
            class="w-full py-2 rounded-xl text-xs font-bold transition-all"
          >
            {{ talent.connected ? '✓ Solicitare trimisă' : 'Conectează-te' }}
          </button>
        </div>
      </div>

      <!-- Mesaj Empty State când filtrele nu returnează rezultate -->
      <div v-else class="p-12 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-2">
        <span class="text-2xl">🔍</span>
        <h4 class="text-sm font-bold text-white">Niciun profil găsit</h4>
        <p class="text-xs text-slate-400 max-w-sm">
          Nu există studenți care să corespundă criteriilor selectate. Încearcă să resetezi filtrele sau să cauți alte competențe.
        </p>
      </div>
    </div>

    <!-- Vizualizare 2: Tab-ul Oportunități / Joburi -->
    <div v-else-if="activeTab === 'jobs'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="job in opportunities"
        :key="job.id"
        class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group"
      >
        <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          PRO
        </span>

        <div class="flex items-start gap-3">
          <img :src="job.avatar" :alt="job.title" class="w-14 h-14 rounded-2xl object-cover border border-white/10" />
          <div class="flex flex-col">
            <h4 class="text-sm font-bold text-white">{{ job.title }}</h4>
            <span class="text-xs text-indigo-300 font-medium">{{ job.category }}</span>
          </div>
        </div>

        <p class="text-xs text-slate-400 line-clamp-2">
          {{ job.description }}
        </p>

        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in job.tags"
            :key="tag"
            class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5"
          >
            {{ tag }}
          </span>
        </div>

        <button
          type="button"
          @click="applyToJob(job.id)"
          :disabled="job.applied"
          :class="job.applied ? 'bg-white/10 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_14px_rgba(79,70,229,0.35)]'"
          class="w-full py-2 rounded-xl text-xs font-bold transition-all"
        >
          {{ job.applied ? '✓ Aplicație înregistrată' : 'Aplică' }}
        </button>
      </div>
    </div>

    <!-- Modal Pitch -->
    <ConnectModal
      :isOpen="isModalOpen"
      :target="selectedTalent"
      :isSubmitting="isSubmitting"
      @close="isModalOpen = false"
      @submit="submitConnection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { proService, type Talent } from '../../services/proService';
import { useProFilters } from '../../composables/useProFilters';
import ConnectModal from './ConnectModal.vue';

const activeTab = ref<'talents' | 'jobs'>('talents');
const talents = ref<Talent[]>([]);
const isModalOpen = ref(false);
const selectedTalent = ref<Talent | null>(null);
const isSubmitting = ref(false);
const toastMessage = ref('');

const { filters } = useProFilters();

// Lista de oportunități pentru tab-ul Joburi
const opportunities = ref([
  {
    id: 1,
    title: 'Echipă Backend Dev - Proiect Colectiv',
    category: 'Anunț de colaborare',
    description: 'Căutăm un coleg pasionat de Quarkus / PostgreSQL pentru a finaliza integrarea API-urilor.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    tags: ['Quarkus', 'PostgreSQL', 'REST'],
    applied: false
  },
  {
    id: 2,
    title: 'Frontend Vue 3 Intern - Startup UBB',
    category: 'Internship Semestrial',
    description: 'Oportunitate plătită part-time pentru dezvoltarea unui panou administrativ bazat pe Vite și Tailwind.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    tags: ['Vue 3', 'TypeScript', 'Tailwind'],
    applied: false
  }
]);

onMounted(async () => {
  talents.value = await proService.getTalents();
});

// Filtrare reactivă instantanee bazată pe composable
const filteredTalents = computed(() => {
  return talents.value.filter((talent) => {
    // 1. Filtru text (nume, rol sau skills)
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchName = talent.name.toLowerCase().includes(q);
      const matchRole = talent.role.toLowerCase().includes(q);
      const matchSkills = talent.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchRole && !matchSkills) return false;
    }

    // 2. Filtru etichete de competențe selectate
    if (filters.selectedSkills.length > 0) {
      const hasSkill = filters.selectedSkills.some((selected) =>
        talent.skills.includes(selected)
      );
      if (!hasSkill) return false;
    }

    // 3. Filtru vârstă maximă
    if (talent.age > filters.maxAge) {
      return false;
    }

    // 4. Filtru studenți verificați
    if (filters.onlyVerifiedStudents && !talent.verified) {
      return false;
    }

    return true;
  });
});

function openModal(talent: Talent) {
  if (talent.connected) return;
  selectedTalent.value = talent;
  isModalOpen.value = true;
}

async function submitConnection(pitchMessage: string) {
  if (!selectedTalent.value) return;
  isSubmitting.value = true;

  const result = await proService.sendConnection({
    targetProfileId: selectedTalent.value.id,
    targetName: selectedTalent.value.name,
    pitchMessage
  });

  isSubmitting.value = false;
  isModalOpen.value = false;

  const target = talents.value.find((t) => t.id === selectedTalent.value?.id);
  if (target) {
    target.connected = true;
  }

  toastMessage.value = result.message;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

function applyToJob(jobId: number) {
  const targetJob = opportunities.value.find((j) => j.id === jobId);
  if (targetJob) {
    targetJob.applied = true;
    toastMessage.value = `Aplicația pentru "${targetJob.title}" a fost înregistrată.`;
    setTimeout(() => {
      toastMessage.value = '';
    }, 4000);
  }
}
</script>