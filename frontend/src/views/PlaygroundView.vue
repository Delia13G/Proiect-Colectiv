<!-- frontend/src/views/PlaygroundView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import UserMiniProfile from '../components/layout/UserMiniProfile.vue';
import DateSidebarContent from '../components/dating/DateSidebarContent.vue';
import SocialSidebarContent from '../components/social/SocialSidebarContent.vue';
import { Plus } from 'lucide-vue-next';
import ProSidebarContent from '../components/pro/ProSidebarContent.vue';

const myProjects = ref([
  { id: 1, title: 'Proiect Colectiv', category: 'Aplicație Web', icon: '💻', isNew: true, progress: 85 }, // Bară verde/indigo (85%)
  { id: 2, title: 'Licență AI', category: 'Research', progress: 100 }, // Bară verde plină
  { id: 3, title: 'Design Cliq', category: 'UI/UX', icon: '🎨', dueSoon: true, progress: 40 } // Iconiță ceas + ring amber!
]);

const proChats = ref([
  { 
    id: 1, name: 'Pavel', message: 'Am urcat scripturile', avatar: 'https://i.pravatar.cc/100?img=13', unreadCount: 1, 
    role: 'Backend' as const, activityStatus: 'coding' as const, isPinned: true 
  }, // Pavel scrie cod! Badge "Backend", Pinned.
  { 
    id: 2, name: 'Echipa DevOps', message: 'A picat serverul!', avatar: 'https://i.pravatar.cc/100?img=33', unreadCount: 5, 
    isUrgent: true, hasMention: true 
  }, // Roșu/Chihlimbar, @Tu, urgent!
  { 
    id: 3, name: 'Ioana', message: '', avatar: 'https://i.pravatar.cc/100?img=5', 
    role: 'UI/UX' as const, messageType: 'file' as const
  } // Document încărcat.
]);

const squads = ref([
  { id: 1, name: 'Facultate Info MIE', image: 'https://i.pravatar.cc/100?img=1', membersCount: 124, isJoined: true, hasActivity: true },
  { id: 2, name: 'Echipa Proiect 5', image: 'https://i.pravatar.cc/100?img=2', membersCount: 8, isJoined: true },
  { id: 3, name: 'Hackathon Cluj', image: 'https://i.pravatar.cc/100?img=3', membersCount: 45, isJoined: false }, // Va avea butonul JOIN
  { id: 4, name: 'Grup Ieșiri', image: 'https://i.pravatar.cc/100?img=15', membersCount: 12, isJoined: false } // Va avea butonul JOIN
]);

const socialChats = ref([
  { 
    id: 1, name: 'Ioana', message: '', avatar: 'https://i.pravatar.cc/100?img=9', active: true, 
    isTyping: true, isPinned: true 
  }, // Ioana va avea Pin și "scrie..." cu puncte verzi săltărețe.
  { 
    id: 2, name: 'Grup Ieșiri', message: 'Cine vine la un boardgame?', avatar: 'https://i.pravatar.cc/100?img=11', active: false, unreadCount: 3, 
    hasMention: true 
  }, // Vei vedea "@Tu" roșu și un badge roșu cu `@` care ignoră tot și sare în ochi.
  { 
    id: 3, name: 'Mihai', message: '', avatar: 'https://i.pravatar.cc/100?img=12', active: true, 
    messageType: 'image' as const
  }, // Mihai trimite o poză, va apărea o iconiță de Cameră verde.
  { 
    id: 4, name: 'Spam Bot', message: 'Promoție!', avatar: 'https://i.pravatar.cc/100?img=15', active: false, unreadCount: 15, 
    isMuted: true 
  } // Tot cardul va fi estompat vizual, poza ușor alb-negru (grayscale), și badge-ul de mesaje va fi gri, nu verde neon.
]);

const dateChats = ref([
  { 
    id: 1, 
    name: 'Elena', 
    message: 'Abia aștept!', 
    image: 'https://i.pravatar.cc/100?img=4', 
    unread: false, 
    online: true, 
    isMine: true,          // Spunem că ultimul mesaj a fost trimis de mine ("Tu: Abia aștept!")
    status: 'read' as const, // Randează double-check de culoare roz
    timestamp: new Date() 
  },
  { 
    id: 2, 
    name: 'Diana', 
    message: 'Te sun mai târziu.', 
    image: 'https://i.pravatar.cc/100?img=5', 
    unread: false, 
    online: false,
    isMine: true,
    status: 'delivered' as const, // Randează double-check de culoare gri
    timestamp: new Date(Date.now() - 3600000)
  }
]);

// 1. STATE SIMPLU LOCAL
const activeTab = ref('DATE'); 

// DATE PENTRU LENTILA 'DATE' (Aici e magia cu 'online')
const dateMatches = [
  { id: 1, name: 'Elena', image: 'https://i.pravatar.cc/100?img=4', online: true }, // Elena va avea cerc roșu
  { id: 2, name: 'Alex', image: 'https://i.pravatar.cc/100?img=7', online: false },
  { id: 3, name: 'Diana', image: 'https://i.pravatar.cc/100?img=5', online: true }  // Diana va avea cerc roșu
];

// FUNCȚIA CARE DECLANȘEAZĂ ANIMAȚIA
const handleOpenChat = (id: number) => {
  console.log('Open Chat:', id);
  // Găsim chat-ul și îl marcăm ca citit.
  // Deoarece e "unread: false", computed-ul `sortedChats` îl va muta automat mai jos în listă!
  const chat = dateChats.value.find(c => c.id === id);
  if (chat && chat.unread) {
    chat.unread = false;
  }
};


</script>

<template>
  <div class="h-screen w-full bg-slate-950 text-slate-100 flex font-sans overflow-hidden">
    
    <!-- SIDEBAR -->
    <aside class="w-72 h-full flex flex-col gap-6 p-4 bg-slate-900/40 backdrop-blur-xl border-r border-white/10 select-none overflow-y-auto">
      
      <!-- PROFIL -->
      <UserMiniProfile :activeLens="activeTab" />

      <transition name="fade" mode="out-in">
        
        <!-- LENTILA PRO -->
        <ProSidebarContent 
          v-if="activeTab === 'PRO'"
          key="pro"
          :projects="myProjects"
          :chats="proChats"
          :isLoading="false"
          @create-project="console.log('Deschide modalul de Create Project!')"
          @open-project="(id) => console.log('Proiect selectat:', id)"
          @open-chat="(id) => console.log('Chat echipă deschis:', id)"
        />

        <!-- LENTILA SOCIAL -->
        <SocialSidebarContent 
          v-else-if="activeTab === 'SOCIAL'"
          key="social"
          :squads="squads"
          :chats="socialChats"
          :isLoading="false"
          @open-group="(idx) => console.log('Grup deschis:', idx)"
          @open-chat="(id) => console.log('Chat social:', id)"
        />

        <!-- LENTILA DATE (Aici am oprit Skeletonul!) -->
        <DateSidebarContent 
          v-else-if="activeTab === 'DATE'"
          key="date"
          :likesCount="5"
          :matches="dateMatches"
          :chats="dateChats"
          :isLoading="false" 
          @open-likes="console.log('Open Likes clicked')"
          @open-chat="handleOpenChat"
        />
        
      </transition>
    </aside>

    <!-- ZONA DE BUTOANE -->
    <main class="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900">
      <h1 class="text-2xl font-bold text-white mb-8">Testează Meniul Lateral</h1>
      <div class="flex gap-4 p-2 bg-slate-800 rounded-lg">
        <button @click="activeTab = 'PRO'" :class="activeTab === 'PRO' ? 'bg-indigo-600' : 'bg-slate-700'" class="px-6 py-2 rounded font-bold text-white transition-colors">PRO</button>
        <button @click="activeTab = 'SOCIAL'" :class="activeTab === 'SOCIAL' ? 'bg-emerald-600' : 'bg-slate-700'" class="px-6 py-2 rounded font-bold text-white transition-colors">SOCIAL</button>
        <button @click="activeTab = 'DATE'" :class="activeTab === 'DATE' ? 'bg-rose-600' : 'bg-slate-700'" class="px-6 py-2 rounded font-bold text-white transition-colors">DATE</button>
      </div>
      <!--<p class="text-slate-400 mt-4 text-sm">Schimbă `<DateSidebarContent :isLoading="true" />` ca să vezi iar skeletonul.</p>-->
    </main>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateX(-10px); }
</style>