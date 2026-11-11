<script setup lang="ts">
import { ref } from 'vue';
import Slider from 'primevue/slider';
import ToggleSwitch from 'primevue/toggleswitch';

const ageRange = ref([18, 26]);
const distance = ref(15);
const verifiedOnly = ref(true);
const studentStatus = ref(false);
</script>

<template>
  <aside class="bg-slate-900/50 border border-slate-800 rounded-xl p-4 h-fit space-y-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-[10px] font-bold text-slate-500 uppercase">Filtrare Socială</h2>
      <button class="text-[10px] text-emerald-400 hover:text-emerald-300">Resetează</button>
    </div>
    
    <div>
      <div class="flex justify-between text-xs mb-2 text-slate-300">
        <span>Vârstă</span>
        <span class="font-bold text-white">{{ ageRange[0] }} - {{ ageRange[1] }} ani</span>
      </div>
      <Slider v-model="ageRange" range :min="18" :max="35" class="custom-slider" />
    </div>

    <div>
      <div class="flex justify-between text-xs mb-2 text-slate-300">
        <span>Distanță</span>
        <span class="font-bold text-white">{{ distance }} km</span>
      </div>
      <Slider v-model="distance" :min="1" :max="50" class="custom-slider" />
    </div>

    <div class="space-y-4 pt-4 border-t border-slate-800/50">
      
      <!-- Toggle: Doar studenți verificați -->
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-300">Doar studenți verificați</span>
        <!-- Container fix de 40px lățime pt aliniere perfectă -->
        <div class="w-10 flex justify-end">
          <ToggleSwitch v-model="verifiedOnly" class="custom-toggle" />
        </div>
      </div>
      
      <!-- Toggle: Stare student -->
      <div class="flex items-center justify-between opacity-50">
        <span class="text-xs text-slate-300">Stare student</span>
        <!-- Container fix de 40px lățime pt aliniere perfectă -->
        <div class="w-10 flex justify-end">
          <ToggleSwitch v-model="studentStatus" class="custom-toggle" />
        </div>
      </div>
      
    </div>
  </aside>
</template>
<style scoped>
/* ==========================================
   1. STYLING PERFECT PENTRU TOGGLE SWITCH
   ========================================== */
:deep(.p-toggleswitch) {
  width: 36px !important;
  height: 20px !important;
  border: none !important;
  background: transparent !important;
  display: inline-block !important;
  position: relative !important;
}

/* ELIMINĂM BULINA NATIVĂ DEFECTĂ A PRIMEVUE */
:deep(.p-toggleswitch-handle) {
  display: none !important;
}

/* Fundalul butonului (inactiv) */
:deep(.p-toggleswitch-slider) {
  background-color: #334155 !important;
  border-radius: 999px !important;
  position: absolute !important;
  cursor: pointer !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  transition: background-color 0.2s !important;
  box-shadow: none !important;
}

/* Fundalul butonului (activ - smarald) */
:deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider) {
  background-color: #10b981 !important; 
}

/* Bulina albă perfect centrată (creată de noi) */
:deep(.p-toggleswitch-slider::before) {
  content: "" !important;
  position: absolute !important;
  width: 14px !important;
  height: 14px !important;
  left: 3px !important;
  bottom: 3px !important;
  background-color: white !important;
  border-radius: 50% !important;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
}

/* Mișcarea bulinei spre dreapta când e activ */
:deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider::before) {
  transform: translateX(16px) !important;
}

/* ==========================================
   2. STYLING PENTRU SLIDER
   ========================================== */
:deep(.p-slider) {
  height: 4px !important;
  background-color: #1e293b !important;
  border-radius: 999px !important;
  border: none !important;
  position: relative !important;
}

:deep(.p-slider-range) {
  background-color: #10b981 !important;
  border-radius: 999px !important;
}

:deep(.p-slider-handle) {
  width: 14px !important;
  height: 14px !important;
  background-color: #10b981 !important;
  border: 2px solid white !important; 
  border-radius: 50% !important;
  margin-top: -5px !important;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6) !important;
  transition: transform 0.1s !important;
  cursor: pointer !important;
}

:deep(.p-slider-handle:hover) {
  transform: scale(1.2) !important;
}
</style>