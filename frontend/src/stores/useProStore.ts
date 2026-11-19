// frontend/src/stores/useProStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// --- INTERFACES: SIDEBAR ---
export interface Project {
  id: number;
  title: string;
  category: string;
  icon?: string;
  isNew?: boolean;
  progress?: number;
  dueSoon?: boolean;
}

export interface TeamChat {
  id: number;
  name: string;
  message: string;
  avatar: string;
  unreadCount?: number;
  timestamp?: string | Date;
  role?: 'Backend' | 'Frontend' | 'UI/UX' | 'Team Lead';
  activityStatus?: 'typing' | 'uploading' | 'coding';
  messageType?: 'text' | 'file' | 'code_snippet' | 'link';
  hasMention?: boolean;
  isUrgent?: boolean;
  isPinned?: boolean;
  presence?: 'online' | 'meeting' | 'focus' | 'offline';
  repliesCount?: number;
}

// --- INTERFACES: MAIN VIEW (TALENTS) ---
export interface BackendProfile {
  id: number;
  userId: number;
  profileType: string;
  bio: string;
}

export interface Talent {
  id: number;
  name: string;
  age: number;
  role: string;
  verified: boolean;
  avatar: string;
  skills: string[];
  bio?: string;
  connected?: boolean;
}

export interface ConnectionPayload {
  targetProfileId: number;
  targetName: string;
  pitchMessage: string;
}

// --- INTERFACES: FILTERS (Preluat din fișierul șters) ---
export interface ProFilterState {
  searchQuery: string;
  selectedDomain: string;
  selectedSkills: string[];
  maxAge: number;
  maxDistance: number;
  availableForInternship: boolean;
  onlyVerifiedStudents: boolean;
}

export const useProStore = defineStore('pro', () => {
  // ==========================================
  // STATE
  // ==========================================
  const projects = ref<Project[]>([]);
  const chats = ref<TeamChat[]>([]);
  const talents = ref<Talent[]>([]);
  const isLoading = ref<boolean>(false);
  const isTalentsLoading = ref<boolean>(false);

  // Starea filtrelor (Preluată din fișierul șters)
  const filters = ref<ProFilterState>({
    searchQuery: '',
    selectedDomain: 'it',
    selectedSkills: [],
    maxAge: 30,
    maxDistance: 50,
    availableForInternship: false,
    onlyVerifiedStudents: false
  });

  // ==========================================
  // GETTERS
  // ==========================================
  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      if (a.hasMention && !b.hasMention) return -1;
      if (!a.hasMention && b.hasMention) return 1;
      
      const aHasUnread = (a.unreadCount || 0) > 0;
      const bHasUnread = (b.unreadCount || 0) > 0;
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  });

  const activeChatsCount = computed(() => chats.value.length);

  // Computed suprem care aplică filtrele direct pe date!
  const filteredTalents = computed(() => {
    return talents.value.filter(talent => {
      // Filtrare după căutare text
      const matchesSearch = filters.value.searchQuery === '' || 
        talent.name.toLowerCase().includes(filters.value.searchQuery.toLowerCase()) ||
        talent.role.toLowerCase().includes(filters.value.searchQuery.toLowerCase());
      
      // Filtrare după vârstă maximă
      const matchesAge = talent.age <= filters.value.maxAge;
      
      // Filtrare studenți verificați
      const matchesVerified = !filters.value.onlyVerifiedStudents || talent.verified;

      // Filtrare după skill-uri (trebuie să aibă măcar unul din cele selectate, dacă există)
      const matchesSkills = filters.value.selectedSkills.length === 0 || 
        filters.value.selectedSkills.some(skill => talent.skills.includes(skill));

      return matchesSearch && matchesAge && matchesVerified && matchesSkills;
    });
  });

  // ==========================================
  // ACTIONS
  // ==========================================
  const fetchProData = async () => {
    isLoading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      projects.value = [
        { id: 1, title: 'Collective Project', category: 'Web App', icon: '💻', isNew: true, progress: 85 },
        { id: 2, title: 'AI Thesis', category: 'Research', progress: 100 },
        { id: 3, title: 'Cliq Design', category: 'UI/UX', icon: '🎨', dueSoon: true, progress: 40 }
      ];
      chats.value = [
        { id: 1, name: 'Pavel', message: 'I uploaded the scripts.', avatar: 'https://i.pravatar.cc/150?img=13', unreadCount: 1, role: 'Backend', activityStatus: 'coding', isPinned: true },
        { id: 2, name: 'DevOps Team', message: 'Server is down!', avatar: 'https://i.pravatar.cc/150?img=33', unreadCount: 5, isUrgent: true, hasMention: true },
        { id: 3, name: 'Ioana', message: 'Design files updated.', avatar: 'https://i.pravatar.cc/150?img=5', role: 'UI/UX', messageType: 'file', presence: 'focus' },
        { id: 4, name: 'Andrei', message: 'Weekly sync notes.', avatar: 'https://i.pravatar.cc/150?img=11', presence: 'meeting', repliesCount: 3 }
      ];
    } finally {
      isLoading.value = false;
    }
  };

  const markChatAction = (chatId: number) => {
    const chat = chats.value.find(c => c.id === chatId);
    if (chat) {
      chat.unreadCount = 0;
      chat.isUrgent = false;
    }
  };

  const fetchTalents = async () => {
    isTalentsLoading.value = true;
    try {
      const response = await fetch('http://localhost:8080/api/profiles/talents');
      if (!response.ok) throw new Error('Endpoint not available yet');
      talents.value = await response.json();
    } catch {
      talents.value = [
        { id: 1, name: 'Andreea', age: 21, role: 'Junior UX Designer', verified: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80', skills: ['Figma', 'UI/UX', 'Research'], bio: 'Passionate about wireframing and interactive prototyping.' },
        { id: 2, name: 'Vlad', age: 22, role: 'Junior Java Dev', verified: true, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80', skills: ['Spring', 'Java', 'SQL'], bio: 'Working with relational databases and REST architectures.' },
        { id: 3, name: 'Elena', age: 20, role: 'Data Analyst Intern', verified: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80', skills: ['Python', 'SQL', 'Analytics'], bio: 'Passionate about data analysis and visualization.' }
      ];
    } finally {
      isTalentsLoading.value = false;
    }
  };

  const sendConnection = async (payload: ConnectionPayload): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('http://localhost:8080/api/pro/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const talent = talents.value.find(t => t.id === payload.targetProfileId);
      if (talent) talent.connected = true;
      return { success: true, message: `Connection request for ${payload.targetName} sent successfully.` };
    }
  };

  // Acțiunile filtrelor preluate din fișierul șters
  const toggleSkill = (skill: string) => {
    const idx = filters.value.selectedSkills.indexOf(skill);
    if (idx > -1) {
      filters.value.selectedSkills.splice(idx, 1);
    } else {
      filters.value.selectedSkills.push(skill);
    }
  };

  const resetFilters = () => {
    filters.value = {
      searchQuery: '',
      selectedDomain: 'it',
      selectedSkills: [],
      maxAge: 30,
      maxDistance: 50,
      availableForInternship: false,
      onlyVerifiedStudents: false
    };
  };

  return {
    // State
    projects,
    chats,
    talents,
    isLoading,
    isTalentsLoading,
    filters,
    
    // Getters
    sortedChats,
    activeChatsCount,
    filteredTalents, // <- Noul getter care face toată magia UI-ului
    
    // Actions
    fetchProData,
    markChatAction,
    fetchTalents,
    sendConnection,
    toggleSkill,
    resetFilters
  };
});