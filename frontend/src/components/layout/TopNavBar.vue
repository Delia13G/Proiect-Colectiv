<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLensStore } from '../../stores/lensStore';

const router = useRouter();
const route = useRoute();
const lensStore = useLensStore();

// ==========================================
// 1. CONFIGURAȚIA LENTILELOR
// ==========================================
const LENSES = [
  { 
    id: 'DATE', 
    label: 'DATE', 
    activeTextColor: 'text-[#F43F5E]', 
    pillClass: 'bg-[#F43F5E]/10 border-[#F43F5E]/40 shadow-[0_0_20px_rgba(244,63,94,0.35)] border',
    logoColor: 'to-[#F43F5E]',
    badgeClass: 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/30',
    notifications: 0,
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
  },
  { 
    id: 'SOCIAL', 
    label: 'SOCIAL', 
    activeTextColor: 'text-emerald-400', 
    pillClass: 'bg-emerald-500/10 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.35)] border',
    logoColor: 'to-emerald-500',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    notifications: 3, 
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

// ==========================================
// 2. STATE & RUTE
// ==========================================
// Calculăm lentila activă direct din URL pentru stabilitate perfectă (Sursa de Adevăr)
const activeLens = computed(() => {
  if (route.path.includes('/social')) return 'SOCIAL';
  if (route.path.includes('/dating')) return 'DATE';
  return 'PRO';
});

const activeConfig = computed(() => LENSES.find(l => l.id === activeLens.value) || LENSES[2]);

// Schimbarea rutei și actualizarea Pinia Store
const switchLens = (lensId: string) => {
  if (activeLens.value === lensId) return;
  lensStore.setLens(lensId);
  
  if (lensId === 'PRO') router.push('/pro');
  if (lensId === 'SOCIAL') router.push('/social');
  if (lensId === 'DATE') router.push('/dating');
};

// ==========================================
// 3. LOGICĂ DROPDOWN & ACCESIBILITATE
// ==========================================
const isDropdownOpen = ref(false);
const profileContainerRef = ref<HTMLElement | null>(null);
const isReady = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Închidere la click în exterior
const handleClickOutside = (event: MouseEvent) => {
  if (isDropdownOpen.value && profileContainerRef.value && !profileContainerRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

// Închidere la tasta Escape
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDropdownOpen.value) {
    isDropdownOpen.value = false;
  }
};

// ==========================================
// 4. ANIMAȚIA SLIDING PILL (Desktop)
// ==========================================
const buttonRefs = ref<HTMLElement[]>([]);
const pillStyle = ref({ left: '0px', width: '0px', height: '0px', top: '0px' });

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

// Când URL-ul se schimbă, declanșăm recalcularea pastilei vizuale
watch(activeLens, updatePillPosition);

// ==========================================
// 5. LOGICĂ SMART SCROLL (Mobil)
// ==========================================
const showNav = ref(true);
const lastScrollY = ref(0);

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY < 60) {
    showNav.value = true;
  } else if (currentScrollY > lastScrollY.value) {
    showNav.value = false; // Ascunde la scroll jos
  } else {
    showNav.value = true;  // Arată la scroll sus
  }
  lastScrollY.value = currentScrollY;
};

// ==========================================
// LIFECYCLE HOOKS
// ==========================================
onMounted(() => {
  // 1. Adăugăm toți ascultătorii de evenimente
  window.addEventListener('resize', updatePillPosition);
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  
  // 2. Calculăm și așezăm pastila la locul ei INSTANTANEU (înainte de a permite animația)
  updatePillPosition();
  
  // 3. Activăm tranzițiile CSS abia după ce elementul este deja fixat pe poziție
  setTimeout(() => { 
    isReady.value = true; 
  }, 50); 
});

onUnmounted(() => {
  // Curățăm memoria ștergând toți ascultătorii (ai scris asta perfect)
  window.removeEventListener('resize', updatePillPosition);
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  
    <!-- HEADER DESKTOP & MOBILE TOP (Fix, nu dispare la scroll) -->
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
        <!-- Fundalul vizual care se mișcă -->
        <!-- Am adăugat isReady ? 'transition-all duration-500' : 'transition-none' -->
        <div 
          class="absolute rounded-full ease-[cubic-bezier(0.25,1,0.5,1)] backdrop-blur-md"
          :style="pillStyle" 
          :class="[activeConfig.pillClass, isReady ? 'transition-all duration-500' : 'transition-none']"
        ></div>

        <button
          v-for="(lens, index) in LENSES"
          :key="lens.id"
          :ref="el => { if (el) buttonRefs[index] = el as HTMLElement }"
          type="button"
          @click="switchLens(lens.id)"
          class="relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          :class="activeLens === lens.id ? activeConfig.activeTextColor : 'text-slate-400 hover:text-white'"
          :aria-current="activeLens === lens.id ? 'page' : undefined"
        >
          {{ lens.label }}
          
          <!-- Notificare Desktop -->
          <span 
            v-if="lens.notifications > 0" 
            class="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 border-2 border-slate-950 text-[9px] text-white"
          >
            {{ lens.notifications }}
          </span>
        </button>
      </nav>

      <!-- Zona Profil Utilizator -->
      <div class="flex items-center gap-3 relative" ref="profileContainerRef">
        <button 
          @click="toggleDropdown"
          class="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-slate-700 hover:border-slate-400 transition-colors overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-indigo-500 shadow-lg"
          aria-haspopup="true"
          :aria-expanded="isDropdownOpen"
        >
          <!-- Placeholder avatar. Pe viitor, legi src-ul de profilul real al utilizatorului -->
          <img src="https://i.pravatar.cc/150?img=68" alt="Profil utilizator" class="w-full h-full object-cover" />
        </button>

        <!-- Dropdown Meniu -->
        <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-2 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0 scale-100" leave-to-class="opacity-0 translate-y-2 scale-95">
          <div v-if="isDropdownOpen" class="absolute right-0 top-12 md:top-14 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
            <div class="px-4 py-2 border-b border-slate-800 mb-1">
              <p class="text-sm font-semibold text-white">Andrei</p>
              <p class="text-xs text-slate-400 truncate">andrei@cliq.com</p>
            </div>
            <button class="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">Profilul meu</button>
            <button class="w-full text-left block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">Setări cont</button>
            <div class="border-t border-slate-800 mt-1"></div>
            <button class="w-full text-left block px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">Deconectare</button>
          </div>
        </transition>
      </div>
      
    </header>

    <!-- MOBILE BOTTOM NAVIGATION (Smart Scroll) -->
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
</template>