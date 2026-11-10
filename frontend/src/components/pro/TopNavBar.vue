<template>
  <header class="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-xl select-none sticky top-0 z-40">
    <!-- Brand & Badge Lentilă -->
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-extrabold text-white tracking-tight">Cliq</h1>
      <span class="px-2 py-0.5 border border-indigo-500/40 text-indigo-400 text-[10px] font-bold rounded-md bg-indigo-500/10 tracking-wide">
        PRO
      </span>
    </div>

    <!-- Lens Switcher (Pill Nav) -->
    <div class="bg-slate-900/90 rounded-full p-1 border border-white/10 flex items-center space-x-1 shadow-inner">
      <!-- Buton DATE -->
      <button
        type="button"
        @click="switchLens('DATE')"
        class="px-5 py-1.5 rounded-full text-slate-400 hover:text-white transition text-xs font-medium"
      >
        DATE
      </button>

      <!-- Buton SOCIAL (duce la ecranul colegului) -->
      <button
        type="button"
        @click="switchLens('SOCIAL')"
        class="px-5 py-1.5 rounded-full text-slate-400 hover:text-white transition text-xs font-medium"
      >
        SOCIAL
      </button>

      <!-- Buton PRO (Activ în ecranul curent) -->
      <button
        type="button"
        class="px-5 py-1.5 rounded-full bg-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(79,70,229,0.45)] text-xs cursor-default"
      >
        PRO
      </button>
    </div>

    <!-- Acțiuni Dreapta -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
        title="Setări"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useLensStore } from '../../stores/lensStore';

const router = useRouter();
const lensStore = useLensStore();

const switchLens = (lensName: string) => {
  lensStore.setLens(lensName);
  if (lensName === 'PRO') router.push('/pro');
  if (lensName === 'SOCIAL') router.push('/social');
  if (lensName === 'DATE') router.push('/date');
};
</script>