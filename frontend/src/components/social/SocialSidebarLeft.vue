<script setup lang="ts">
const squads = [
  'https://i.pravatar.cc/100?img=1',
  'https://i.pravatar.cc/100?img=2',
  'https://i.pravatar.cc/100?img=3',
];
const chats = [
  { id: 1, name: 'Ioana', message: 'Hi, vii la curs?', avatar: 'https://i.pravatar.cc/100?img=9', active: true },
  { id: 2, name: 'Mihai', message: 'Mergem la sală?', avatar: 'https://i.pravatar.cc/100?img=11', active: true },
  { id: 3, name: 'Andreea', message: 'Trimite-mi pdf-ul', avatar: 'https://i.pravatar.cc/100?img=5', active: false },
];
</script>

<template>
  <aside class="space-y-6"> <!-- Mai puțin spațiu între secțiuni -->
    <div>
      <h2 class="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-3">Conexiuni</h2>
      <div class="flex -space-x-3">
        <img v-for="(img, index) in squads" :key="index" :src="img" class="w-8 h-8 rounded-full border border-slate-950" alt="" />
        <div class="w-8 h-8 rounded-full border border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
          +3
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-3">Active Chats</h2>
      <div class="space-y-1">
        <div v-for="chat in chats" :key="chat.id" class="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-900 rounded transition">
          <div class="relative">
            <img :src="chat.avatar" class="w-8 h-8 rounded-full" alt="" />
            <div v-if="chat.active" class="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-slate-950 rounded-full"></div>
          </div>
          <div class="overflow-hidden">
            <h3 class="font-semibold text-xs truncate">{{ chat.name }}</h3>
            <p class="text-[10px] text-slate-400 truncate">{{ chat.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>