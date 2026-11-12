<script setup lang="ts">
const mockStudents = [
  { id: 1, name: 'Andreea', age: 21, unis: ['UBB', 'UTCN'], image: 'https://i.pravatar.cc/300?img=1' },
  { id: 2, name: 'Vlad', age: 22, unis: ['FMI', 'UTCN'], image: 'https://i.pravatar.cc/300?img=11' },
  { id: 3, name: 'Elena', age: 20, unis: ['UBB', 'UMF'], image: 'https://i.pravatar.cc/300?img=5' },
  { id: 4, name: 'Mihai', age: 23, unis: ['UTCN'], image: 'https://i.pravatar.cc/300?img=12' },
];
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Studenți / Explore</h2>
    </div>
    
    <div class="grid grid-cols-2 gap-3">
      <!-- Card Compact -->
      <div v-for="student in mockStudents" :key="student.id" class="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-2 transition hover:border-emerald-500/50 group">
        <img :src="student.image" class="w-full h-32 object-cover rounded-lg" alt="Poza profil" />
        <div class="px-1">
          <h3 class="font-bold text-sm text-white">{{ student.name }}, {{ student.age }}</h3>
          <div class="flex gap-1 mt-1">
            <span v-for="uni in student.unis" :key="uni" class="px-1.5 py-0.5 bg-slate-800 text-emerald-400 text-[9px] font-bold uppercase rounded border border-slate-700">
              {{ uni }}
            </span>
          </div>
        </div>
        <button class="mt-2 w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-[0_0_8px_rgba(16,185,129,0.2)] group-hover:shadow-[0_2px_10px_rgba(16,185,129,0.4)]">
          👋 Trimite Salut
        </button>
      </div>
    </div>
  </section>
</template>