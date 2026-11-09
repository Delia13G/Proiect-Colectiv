<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useLensStore } from '../../stores/lensStore';

const router = useRouter();
const lensStore = useLensStore();

const switchLens = (lensName: string) => {
  lensStore.setLens(lensName);
  if (lensName === 'PRO') router.push('/pro');
  if (lensName === 'SOCIAL') router.push('/social');
};
</script>

<template>
  <header class="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-extrabold text-white">Cliq</h1>
      <span class="px-1.5 py-0.5 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold rounded bg-emerald-500/10">SOCIAL</span>
    </div>
    
    <div class="bg-slate-900 rounded-full p-1 border border-slate-700 flex space-x-1">
      <button class="px-5 py-1.5 rounded-full text-slate-400 hover:text-white transition text-xs font-medium">DATE</button>
      <button class="px-5 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)] text-xs">SOCIAL</button>
      <button @click="switchLens('PRO')" class="px-5 py-1.5 rounded-full text-slate-400 hover:text-white transition text-xs font-medium">PRO</button>
    </div>
    
    <div class="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700 text-slate-400">
      <i class="pi pi-cog text-sm"></i>
    </div>
  </header>
</template>