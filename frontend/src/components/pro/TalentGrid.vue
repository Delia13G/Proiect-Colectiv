<template>
  <div class="flex-1 flex flex-col gap-5 p-6 overflow-y-auto">
    <!-- Tab Switcher (Oportunități vs Talente) -->
    <div class="flex items-center gap-6 border-b border-white/10 pb-3 select-none">
      <button
        type="button"
        @click="activeTab = 'jobs'"
        :class="activeTab === 'jobs' ? 'text-white font-bold border-b-2 border-indigo-500 -mb-3 pb-3' : 'text-slate-400 hover:text-slate-200 font-medium'"
        class="text-sm transition-all"
      >
        Oportunități / Joburi
      </button>

      <button
        type="button"
        @click="activeTab = 'talents'"
        :class="activeTab === 'talents' ? 'text-white font-bold border-b-2 border-indigo-500 -mb-3 pb-3' : 'text-slate-400 hover:text-slate-200 font-medium'"
        class="text-sm transition-all flex items-center gap-2"
      >
        <span>Talente / Studenți</span>
        <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold">12</span>
      </button>
    </div>

    <!-- Grilă Carduri (2x2) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Card 1: Andreea -->
      <div class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group">
        <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          PRO
        </span>

        <div class="flex items-start gap-3">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80"
            alt="Andreea"
            class="w-14 h-14 rounded-2xl object-cover border border-white/10"
          />
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <h4 class="text-sm font-bold text-white">Andreea, 21</h4>
              <span class="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md font-medium">
                <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Verified Student
              </span>
            </div>
            <span class="text-xs text-slate-300 font-medium">Junior UX Designer</span>
          </div>
        </div>

        <!-- Tags / Skills -->
        <div class="flex flex-wrap gap-1.5">
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">Figma</span>
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">UI/UX</span>
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">Research</span>
        </div>

        <!-- Action Button -->
        <button
          type="button"
          class="w-full py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_14px_rgba(79,70,229,0.35)] transition-all"
        >
          Conectează-te
        </button>
      </div>

      <!-- Card 2: Vlad -->
      <div class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group">
        <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          PRO
        </span>

        <div class="flex items-start gap-3">
          <img
            src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80"
            alt="Vlad"
            class="w-14 h-14 rounded-2xl object-cover border border-white/10"
          />
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <h4 class="text-sm font-bold text-white">Vlad, 22</h4>
              <span class="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md font-medium">
                <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Verified Student
              </span>
            </div>
            <span class="text-xs text-slate-300 font-medium">Junior Java Dev</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-emerald-300 border border-emerald-500/20">Spring</span>
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-amber-300 border border-amber-500/20">Java</span>
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">SQL</span>
        </div>

        <button
          type="button"
          class="w-full py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_14px_rgba(79,70,229,0.35)] transition-all"
        >
          Conectează-te
        </button>
      </div>

      <!-- Card 3: Anunț Echipă Backend -->
      <div class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group">
        <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          PRO
        </span>

        <div class="flex items-start gap-3">
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80"
            alt="Lead Echipă"
            class="w-14 h-14 rounded-2xl object-cover border border-white/10"
          />
          <div class="flex flex-col">
            <h4 class="text-sm font-bold text-white">Echipă Backend Dev - Proiect Colectiv</h4>
            <span class="text-xs text-indigo-300 font-medium">Anunț de colaborare</span>
          </div>
        </div>

        <p class="text-xs text-slate-400 line-clamp-2">
          Căutăm un coleg pasionat de Quarkus / PostgreSQL pentru a finaliza integrarea API-urilor.
        </p>

        <button
          type="button"
          class="w-full py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_14px_rgba(79,70,229,0.35)] transition-all"
        >
          Aplică
        </button>
      </div>

      <!-- Card 4: Elena -->
      <div class="p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 relative group">
        <span class="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          PRO
        </span>

        <div class="flex items-start gap-3">
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80"
            alt="Elena"
            class="w-14 h-14 rounded-2xl object-cover border border-white/10"
          />
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <h4 class="text-sm font-bold text-white">Elena, 20</h4>
              <span class="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md font-medium">
                <svg class="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Verified Student
              </span>
            </div>
            <span class="text-xs text-slate-300 font-medium">Data Analyst Intern</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-sky-300 border border-sky-500/20">Python</span>
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-white/5">SQL</span>
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-indigo-300 border border-indigo-500/20">Analytics</span>
        </div>

        <button
          type="button"
          class="w-full py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_14px_rgba(79,70,229,0.35)] transition-all"
        >
          Conectează-te
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref<'talents' | 'jobs'>('talents');
</script>