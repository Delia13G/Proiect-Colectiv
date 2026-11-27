<!-- frontend/src/components/pro/ProExploreView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useProStore } from '../../stores/useProStore';
import { Briefcase, Code, ChevronRight } from 'lucide-vue-next';
import ConnectModal from './ConnectModal.vue'; // Asigură-te că acest fișier există în același folder

// 1. Conectăm magazinul Pinia
const proStore = useProStore();
const { projects, filteredTalents, isLoading, isTalentsLoading } = storeToRefs(proStore);

// 2. Starea locală preluată din TalentGrid.vue
const activeTab = ref<'talents' | 'jobs'>('talents');
const isModalOpen = ref(false);
const selectedTalent = ref<any | null>(null);
const isSubmitting = ref(false);
const toastMessage = ref('');

// MOCK DATA pentru Joburi (Oportunități) - le putem muta în store mai târziu
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

onMounted(() => {
  if (projects.value.length === 0) proStore.fetchProData();
  if (filteredTalents.value.length === 0) proStore.fetchTalents();
});

// 3. Funcții de interacțiune
function openModal(talent: any) {
  if (talent.connected) return;
  selectedTalent.value = talent;
  isModalOpen.value = true;
}

async function submitConnection(pitchMessage: string) {
  if (!selectedTalent.value) return;
  isSubmitting.value = true;

  // Folosim acțiunea din store
  const result = await proStore.sendConnection({
    targetProfileId: selectedTalent.value.id,
    targetName: selectedTalent.value.name,
    pitchMessage
  });

  isSubmitting.value = false;
  isModalOpen.value = false;

  toastMessage.value = result.message;
  setTimeout(() => { toastMessage.value = ''; }, 4000);
}

function applyToJob(jobId: number) {
  const targetJob = opportunities.value.find((j) => j.id === jobId);
  if (targetJob) {
    targetJob.applied = true;
    toastMessage.value = `Aplicația pentru "${targetJob.title}" a fost înregistrată.`;
    setTimeout(() => { toastMessage.value = ''; }, 4000);
  }
}
</script>

<template>
  <div class="flex-1 h-full overflow-y-auto bg-slate-950 p-6 md:p-8 scrollbar-hide scroll-smooth flex flex-col gap-6">
    
    <!-- HEADER GENERAL -->
    <header>
      <h1 class="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mb-2">
        <Briefcase class="text-indigo-500" :size="32" />
        Professional Workspace
      </h1>
      <p class="text-slate-400 text-sm max-w-xl">
        Discover active projects, find verified student talents, and manage your team collaborations.
      </p>
    </header>

    <!-- SECȚIUNEA 1: ACTIVE PROJECTS -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <Code class="text-indigo-400" :size="20" /> Your Projects
        </h2>
        <button class="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center outline-none cursor-pointer">
          View All <ChevronRight :size="14" />
        </button>
      </div>

      <div v-if="isLoading" class="text-slate-500 text-sm">Loading projects...</div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Card Proiect (Păstrat din designul tău) -->
        <div v-for="project in projects" :key="project.id" class="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/50 transition-all group cursor-pointer">
          <div class="flex justify-between items-start mb-4">
            <span class="text-2xl">{{ project.icon || '📁' }}</span>
            <span v-if="project.isNew" class="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase rounded-md border border-indigo-500/20">New</span>
            <span v-if="project.dueSoon" class="px-2 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase rounded-md border border-amber-500/20">Due Soon</span>
          </div>
          <h3 class="font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{{ project.title }}</h3>
          <p class="text-xs text-slate-500 mb-4">{{ project.category }}</p>
          <div class="w-full bg-slate-800 rounded-full h-1.5 mb-1 relative overflow-hidden">
            <div class="bg-indigo-500 h-1.5 rounded-full" :style="{ width: `${project.progress || 0}%` }"></div>
          </div>
          <div class="text-right text-[10px] text-slate-400 font-medium">{{ project.progress || 0 }}% done</div>
        </div>
      </div>
    </section>

    <!-- SECȚIUNEA 2: EXPLORE (Talente & Joburi) - INTEGRATĂ DIN TalentGrid.vue -->
    <section class="flex flex-col gap-4 mt-4">
      
      <!-- Alertă discretă toast -->
      <transition name="fade">
        <div v-if="toastMessage" class="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between transition-all">
          <span>{{ toastMessage }}</span>
          <button @click="toastMessage = ''" class="text-emerald-400 hover:text-emerald-200 text-sm">✕</button>
        </div>
      </transition>

      <!-- Tab Switcher -->
      <div class="flex items-center gap-6 border-b border-white/10 pb-3 select-none">
        <button type="button" @click="activeTab = 'talents'" :class="activeTab === 'talents' ? 'text-white font-bold border-b-2 border-indigo-500 -mb-3 pb-3' : 'text-slate-400 hover:text-slate-200 font-medium'" class="text-sm transition-all flex items-center gap-2">
          <span>Talente / Studenți</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">{{ filteredTalents.length }}</span>
        </button>
        <button type="button" @click="activeTab = 'jobs'" :class="activeTab === 'jobs' ? 'text-white font-bold border-b-2 border-indigo-500 -mb-3 pb-3' : 'text-slate-400 hover:text-slate-200 font-medium'" class="text-sm transition-all flex items-center gap-2">
          <span>Oportunități / Joburi</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">{{ opportunities.length }}</span>
        </button>
      </div>

      <!-- Vizualizare 1: Tab-ul Talente / Studenți -->
      <div v-if="activeTab === 'talents'">
        <div v-if="isTalentsLoading" class="text-slate-500 text-sm py-4">Loading talents...</div>
        
        <div v-else-if="filteredTalents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Card Profil -->
          <div v-for="talent in filteredTalents" :key="talent.id" class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group">
            <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO</span>
            
            <div class="flex items-start gap-3">
              <img :src="talent.avatar" :alt="talent.name" class="w-14 h-14 rounded-2xl object-cover border border-white/10" />
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <h4 class="text-sm font-bold text-white">{{ talent.name }}, {{ talent.age }}</h4>
                  <span v-if="talent.verified" class="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md font-medium">Verified</span>
                </div>
                <span class="text-xs text-slate-300 font-medium">{{ talent.role }}</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-1.5">
              <span v-for="skill in talent.skills.slice(0, 4)" :key="skill" class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">{{ skill }}</span>
            </div>

            <button type="button" @click="openModal(talent)" :disabled="talent.connected" :class="talent.connected ? 'bg-white/10 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_14px_rgba(79,70,229,0.35)] cursor-pointer'" class="w-full py-2 rounded-xl text-xs font-bold transition-all outline-none">
              {{ talent.connected ? '✓ Solicitare trimisă' : 'Conectează-te' }}
            </button>
          </div>
        </div>

        <div v-else class="p-12 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-2">
          <span class="text-2xl">🔍</span>
          <h4 class="text-sm font-bold text-white">Niciun profil găsit</h4>
          <p class="text-xs text-slate-400 max-w-sm">Nu există studenți care să corespundă criteriilor selectate. Încearcă să resetezi filtrele.</p>
        </div>
      </div>

      <!-- Vizualizare 2: Tab-ul Oportunități / Joburi -->
      <div v-else-if="activeTab === 'jobs'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="job in opportunities" :key="job.id" class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group">
          <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO</span>
          
          <div class="flex items-start gap-3">
            <img :src="job.avatar" :alt="job.title" class="w-14 h-14 rounded-2xl object-cover border border-white/10" />
            <div class="flex flex-col">
              <h4 class="text-sm font-bold text-white line-clamp-1 pr-8">{{ job.title }}</h4>
              <span class="text-xs text-indigo-300 font-medium">{{ job.category }}</span>
            </div>
          </div>

          <p class="text-xs text-slate-400 line-clamp-2">{{ job.description }}</p>

          <div class="flex flex-wrap gap-1.5">
            <span v-for="tag in job.tags" :key="tag" class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">{{ tag }}</span>
          </div>

          <button type="button" @click="applyToJob(job.id)" :disabled="job.applied" :class="job.applied ? 'bg-white/10 text-emerald-400 border border-emerald-500/30 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_14px_rgba(79,70,229,0.35)] cursor-pointer'" class="w-full py-2 rounded-xl text-xs font-bold transition-all outline-none">
            {{ job.applied ? '✓ Aplicație înregistrată' : 'Aplică' }}
          </button>
        </div>
      </div>
    </section>

    <!-- MODAL -->
    <ConnectModal
      v-if="isModalOpen"
      :isOpen="isModalOpen"
      :target="selectedTalent"
      :isSubmitting="isSubmitting"
      @close="isModalOpen = false"
      @submit="submitConnection"
    />

  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>