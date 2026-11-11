<template>
  <div class="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
    <!-- Top Navigation Bar -->
    <TopNavBar />

    <!-- Zona de lucru principală pe 3 coloane -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Coloana 1: Sidebar Stânga (Proiecte & Conexiuni) -->
      <SidebarLeft />

      <!-- Coloana 2: Zona Centrală (TalentGrid) -->
      <main class="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
        <TalentGrid />
      </main>

      <!-- Coloana 3: Sidebar Dreapta (Panou Filtre) -->
      <FilterSidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
import TopNavBar from '../components/pro/TopNavBar.vue';
import SidebarLeft from '../components/pro/SidebarLeft.vue';
import TalentGrid from '../components/pro/TalentGrid.vue';
import FilterSidebar from '../components/pro/FilterSidebar.vue';
</script>