<template>
  <aside class="w-72 h-full flex flex-col gap-6 p-4 bg-slate-900/40 backdrop-blur-xl border-r border-white/10 select-none overflow-y-auto">
    <!-- Profil Utilizator (Mini Card Profesional) -->
    <div class="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer">
      <div class="relative">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
          alt="Avatar Andrei"
          class="w-11 h-11 rounded-xl object-cover border border-white/20"
        />
        <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Online"></span>
      </div>
      <div class="flex flex-col min-w-0">
        <span class="text-sm font-bold text-white truncate">Andrei</span>
        <span class="text-xs text-indigo-300 font-medium truncate">Student Frontend Dev</span>
      </div>
    </div>

    <!-- Secțiunea 1: Proiectele Mele -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-[11px] font-bold tracking-wider uppercase text-slate-400">Proiectele Mele</h3>
        <button type="button" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">+ Nou</button>
      </div>

      <div class="flex flex-col gap-2">
        <!-- Card Proiect 1 -->
        <div class="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center justify-between group">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-semibold shrink-0">
              👥
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Proiect Colectiv - Echipa 5</span>
              <span class="text-[10px] text-slate-400">Anunț de echipe</span>
            </div>
          </div>
          <span class="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
        </div>

        <!-- Card Proiect 2 -->
        <div class="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center justify-between group">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-sm shrink-0">
              📁
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Licență Web App</span>
              <span class="text-[10px] text-slate-400">Anunț de colaborare</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Secțiunea 2: Conexiuni Profesionale -->
    <div class="flex-1 flex flex-col gap-3 min-h-0">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-[11px] font-bold tracking-wider uppercase text-slate-400">Conexiuni</h3>
        <span class="text-[11px] text-slate-500 font-mono">3 active</span>
      </div>

      <div class="flex flex-col gap-1.5 overflow-y-auto pr-1">
        <!-- Chat 1 -->
        <div class="p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
            alt="Ioana"
            class="w-9 h-9 rounded-xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-200 truncate">Ioana (Design)</span>
              <span class="text-[10px] text-slate-500">8:59 AM</span>
            </div>
            <p class="text-[11px] text-slate-400 truncate">Am actualizat wireframe-ul...</p>
          </div>
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
        </div>

        <!-- Chat 2 -->
        <div class="p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
            alt="Mihai"
            class="w-9 h-9 rounded-xl object-cover shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-200 truncate">Mihai (Backend)</span>
              <span class="text-[10px] text-slate-500">9:38 AM</span>
            </div>
            <p class="text-[11px] text-slate-400 truncate">Endpoint-ul de auth e gata.</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
// Componentă SidebarLeft pentru Cliq Pro
</script>