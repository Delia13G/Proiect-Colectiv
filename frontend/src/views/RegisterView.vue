<script setup lang="ts">
import { ref } from 'vue'
import RegisterForm from '../components/RegisterForm.vue'

// Variabile reactive pentru a urmări poziția cursorului
const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = (e.clientX - window.innerWidth / 2) * 0.04
  mouseY.value = (e.clientY - window.innerHeight / 2) * 0.04
}
</script>

<template>
  <main 
    @mousemove="handleMouseMove"
    class="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans selection:bg-emerald-500/30 py-10"
  >
    
    <!-- Grila de fundal cu efect de paralaxă inversă -->
    <div 
      class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIi8+Cjwvc3ZnPg==')] bg-repeat opacity-60 transition-transform duration-1000 ease-out"
      :style="{ transform: `translate(${-mouseX * 0.5}px, ${-mouseY * 0.5}px)` }"
    ></div>

    <!-- Containerul orburilor interactive -->
    <div 
      class="absolute inset-0 w-full h-full transition-transform duration-700 ease-out"
      :style="{ transform: `translate(${mouseX}px, ${mouseY}px)` }"
    >
      <!-- Social Lens (Emerald) - Dominant pe pagina de Register -->
      <div class="absolute top-[0%] right-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] bg-emerald-600/30 rounded-full mix-blend-screen filter blur-[90px] md:blur-[130px] opacity-70 animate-blob"></div>
      
      <!-- Date Lens (Rose) -->
      <div class="absolute bottom-[10%] left-[5%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] bg-rose-600/40 rounded-full mix-blend-screen filter blur-[90px] md:blur-[130px] opacity-70 animate-blob animation-delay-2000"></div>
      
      <!-- Pro Lens (Indigo) -->
      <div class="absolute top-[30%] left-[30%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-indigo-600/40 rounded-full mix-blend-screen filter blur-[90px] md:blur-[130px] opacity-70 animate-blob animation-delay-4000"></div>
    </div>

    <!-- Componenta de formular înregistrare -->
    <RegisterForm />
    
  </main>
</template>

<style scoped>
@keyframes blob {
  0% { 
    transform: translate(0px, 0px) scale(1) rotate(0deg);
    opacity: 0.6;
  }
  25% { 
    transform: translate(80px, -80px) scale(1.15) rotate(45deg);
    opacity: 0.9;
  }
  50% {
    transform: translate(-40px, 60px) scale(0.9) rotate(90deg);
    opacity: 0.5;
  }
  75% {
    transform: translate(-100px, -40px) scale(1.05) rotate(135deg);
    opacity: 0.8;
  }
  100% { 
    transform: translate(0px, 0px) scale(1) rotate(180deg);
    opacity: 0.6;
  }
}

.animate-blob {
  animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>