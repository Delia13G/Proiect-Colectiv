<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

// ---------------------------------------------------------
// RECOMANDAREA 4: Sincronizarea cu Router-ul (Pregătire)
// ---------------------------------------------------------
// În mediul de testare folosim un ref local. Când mutăm în producție, 
// vom decomenta importul useRoute și watcher-ul de mai jos.
// import { useRoute } from 'vue-router';
// const route = useRoute();

const activeLens = ref('PRO');
const isDropdownOpen = ref(false);

const profileContainerRef = ref<HTMLElement | null>(null);

// Funcția care verifică unde s-a dat click
const handleClickOutside = (event: MouseEvent) => {
  if (
    isDropdownOpen.value && 
    profileContainerRef.value && 
    !profileContainerRef.value.contains(event.target as Node)
  ) {
    isDropdownOpen.value = false;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDropdownOpen.value) {
    isDropdownOpen.value = false;
  }
};

// ---------------------------------------------------------
// RECOMANDAREA 1 & 3: Notificări și Componente Iconițe
// ---------------------------------------------------------
const LENSES = [
  { 
    id: 'DATE', 
    label: 'DATE', 
    activeTextColor: 'text-[#F43F5E]', 
    pillClass: 'bg-[#F43F5E]/10 border-[#F43F5E]/40 shadow-[0_0_20px_rgba(244,63,94,0.35)] border',
    logoColor: 'to-[#F43F5E]',
    badgeClass: 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/30',
    notifications: 0, // Fără notificări
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
  },
  { 
    id: 'SOCIAL', 
    label: 'SOCIAL', 
    activeTextColor: 'text-emerald-400', 
    pillClass: 'bg-emerald-500/10 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.35)] border',
    logoColor: 'to-emerald-500',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    notifications: 3, // Exemplu: 3 notificări necitite
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
  },
  { 
    id: 'PRO', 
    label: 'PRO', 
    activeTextColor: 'text-indigo-400', 
    pillClass: 'bg-indigo-500/10 border-indigo-400/40 shadow-[0_0_20px_rgba(79,70,229,0.35)] border',
    logoColor: 'to-indigo-500',
    badgeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    notifications: 0,
    iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  }
];

const activeConfig = computed(() => LENSES.find(l => l.id === activeLens.value) || LENSES[2]);

// ---------------------------------------------------------
// RECOMANDAREA 2: Smart Scroll Logic
// ---------------------------------------------------------
const showNav = ref(true);
const lastScrollY = ref(0);

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  // Menținem bara vizibilă dacă suntem foarte aproape de sus
  if (currentScrollY < 60) {
    showNav.value = true;
  } else if (currentScrollY > lastScrollY.value) {
    // Scroll în jos -> ascundem bara
    showNav.value = false;
  } else {
    // Scroll în sus -> afișăm bara
    showNav.value = true;
  }
  lastScrollY.value = currentScrollY;
};

// ---------------------------------------------------------
// Logică Sliding Pill & State
// ---------------------------------------------------------
const buttonRefs = ref<HTMLElement[]>([]);
const pillStyle = ref({ left: '0px', width: '0px', height: '0px', top: '0px' });

const switchLens = (lensId: string) => {
  activeLens.value = lensId;
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const updatePillPosition = async () => {
  await nextTick();
  const index = LENSES.findIndex(l => l.id === activeLens.value);
  const btn = buttonRefs.value[index];
  
  if (btn) {
    pillStyle.value = {
      left: `${btn.offsetLeft}px`,
      top: `${btn.offsetTop}px`,
      width: `${btn.offsetWidth}px`,
      height: `${btn.offsetHeight}px`
    };
  }
};

watch(activeLens, updatePillPosition);

// Când trecem în producție, acest watcher va reacționa la butonul de "Back" din browser
// watch(() => route.path, (newPath) => {
//   if (newPath.includes('/social')) activeLens.value = 'SOCIAL';
//   else if (newPath.includes('/dating')) activeLens.value = 'DATE';
//   else activeLens.value = 'PRO';
// });

onMounted(() => {
  window.addEventListener('resize', updatePillPosition);
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  setTimeout(updatePillPosition, 50);
});

onUnmounted(() => {
  window.removeEventListener('resize', updatePillPosition);
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="min-h-[200vh] bg-slate-950 text-white font-sans relative">
    
    <!-- HEADER DESKTOP (Acum este sticky și se ascunde la scroll down) -->
    <<!-- HEADER DESKTOP & MOBILE TOP (Fix, nu dispare la scroll) -->
    <header class="sticky top-0 h-16 md:h-20 px-4 md:px-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between select-none z-50">
      
      <!-- Zona Logo -->
      <div class="flex items-center gap-2">
        <span :class="['text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 bg-clip-text text-transparent transition-colors duration-500', activeConfig.logoColor]">
          Cliq
        </span>
        <span :class="['text-[9px] md:text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors duration-500 mt-1', activeConfig.badgeClass]">
          {{ activeLens }}
        </span>
      </div>

      <!-- DESKTOP NAV -->
      <nav class="hidden md:flex relative items-center bg-slate-950/60 p-1.5 rounded-full ring-1 ring-white/10 shadow-2xl space-x-2">
        
        <div class="absolute rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] backdrop-blur-md"
             :style="pillStyle" :class="activeConfig.pillClass"></div>

        <button
          v-for="(lens, index) in LENSES"
          :key="lens.id"
          :ref="el => { if (el) buttonRefs[index] = el as HTMLElement }"
          type="button"
          @click="switchLens(lens.id)"
          class="relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          :class="activeLens === lens.id ? activeConfig.activeTextColor : 'text-slate-400 hover:text-white'"
        >
          {{ lens.label }}
          
          <!-- Notificare Desktop (Bulina roșie) -->
          <span 
            v-if="lens.notifications > 0" 
            class="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 border-2 border-slate-950 text-[9px] text-white"
          >
            {{ lens.notifications }}
          </span>
        </button>
      </nav>

      <!-- Profil Utilizator -->
      <div class="flex items-center gap-3 relative" ref="profileContainerRef">
        <button 
          @click="toggleDropdown"
          class="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-slate-700 hover:border-slate-400 transition-colors overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-indigo-500 shadow-lg"
          aria-haspopup="true"
          :aria-expanded="isDropdownOpen"
        >
          <img src="https://i.pravatar.cc/150?img=68" alt="Profil utilizator" class="w-full h-full object-cover" />
        </button>

        <!-- Dropdown -->
        <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-2 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0 scale-100" leave-to-class="opacity-0 translate-y-2 scale-95">
          <div v-if="isDropdownOpen" class="absolute right-0 top-12 md:top-14 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
            <div class="px-4 py-2 border-b border-slate-800 mb-1">
              <p class="text-sm font-semibold text-white">Andrei</p>
              <p class="text-xs text-slate-400 truncate">andrei@cliq.com</p>
            </div>
            <button class="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">Setări cont</button>
            <div class="border-t border-slate-800 mt-1"></div>
            <button class="w-full text-left block px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">Deconectare</button>
          </div>
        </transition>
      </div>
      
    </header>

    <!-- MOBILE BOTTOM NAVIGATION (Smart Scroll - se ascunde jos) -->
    <div 
      class="md:hidden fixed left-1/2 -translate-x-1/2 z-50 w-max transition-all duration-500 ease-in-out"
      :class="showNav ? 'bottom-4 translate-y-0 opacity-100' : '-bottom-24 translate-y-24 opacity-0 pointer-events-none'"
    >
      <div class="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-1.5 flex items-center justify-center gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        <button
          v-for="lens in LENSES"
          :key="'mobile-' + lens.id"
          @click="switchLens(lens.id)"
          class="relative flex flex-col items-center justify-center gap-0.5 w-11 outline-none group"
        >
          <!-- Notificare Mobile -->
          <span 
            v-if="lens.notifications > 0" 
            class="absolute top-0 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 border-[1.5px] border-slate-900 text-[8px] text-white z-10"
          >
            {{ lens.notifications }}
          </span>

          <svg class="w-5 h-5 transition-all duration-300 group-active:scale-90" :class="activeLens === lens.id ? lens.activeTextColor + ' drop-shadow-md' : 'text-slate-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="lens.iconPath" />
          </svg>
          
          <span class="text-[8px] font-bold tracking-wider transition-colors duration-300" :class="activeLens === lens.id ? lens.activeTextColor : 'text-slate-500'">
            {{ lens.label }}
          </span>
        </button>

      </div>
    </div>

    <!-- ZONĂ CONȚINUT FALS (Pentru a testa scroll-ul lung) -->
    <div class="p-8 md:p-16 text-center max-w-2xl mx-auto mt-10">
      <h2 class="text-2xl md:text-3xl font-bold mb-4 text-slate-100">Testează Smart Scroll</h2>
      <p class="text-slate-400 mb-20 text-lg">Fă scroll în josul paginii. Vei observa cum header-ul de sus și "pastila" de jos dispar pentru a-ți lăsa ecranul complet liber pentru conținut. Când faci scroll ușor în sus, reapar.</p>
      
      <div class="space-y-8">
        <div v-for="i in 10" :key="i" class="h-48 bg-slate-900/50 rounded-3xl border border-white/5 flex items-center justify-center text-slate-700 font-bold text-xl">
          Conținut de probă {{ i }}
        </div>
      </div>
    </div>

  </div>
</template>