<template>
  <header class="h-16 px-6 border-b border-white/10 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between select-none">
    <!-- Logo Cliq -->
    <div class="flex items-center gap-2">
      <span class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
        Cliq
      </span>
      <span class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
        Pro
      </span>
    </div>

    <!-- Lens Switcher Central -->
    <nav class="flex items-center bg-slate-950/80 p-1 rounded-full border border-white/10 shadow-inner">
      <button
        type="button"
        @click="$router.push('/dating')"
        class="px-5 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-all"
      >
        DATE
      </button>

      <button
        type="button"
        class="px-5 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-not-allowed opacity-60"
        title="Lentila Social în curând"
      >
        SOCIAL
      </button>

      <!-- Butonul PRO activ cu Glow Indigo -->
      <button
        type="button"
        class="px-5 py-1.5 rounded-full text-xs font-bold text-white bg-indigo-600 shadow-[0_0_16px_rgba(79,70,229,0.55)] border border-indigo-400/40 transition-all"
      >
        PRO
      </button>
    </nav>

    <!-- Setări / Acțiuni Dreapta -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
        title="Setări"
      >
        <!-- Iconiță rotiță dințată (Settings) SVG -->
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
// Top Navigation Bar conform mockup Cliq Pro
</script>