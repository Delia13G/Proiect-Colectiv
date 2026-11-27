// frontend/src/stores/useDatingStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 1. Export interfaces for application-wide usage
export interface Match {
  id: number;
  name: string;
  image: string;
  online?: boolean;
}

export interface Chat {
  id: number;
  name: string;
  message: string;
  image: string;
  unread: boolean;
  online?: boolean;
  timestamp?: string | Date;
  isTyping?: boolean;
  messageType?: 'text' | 'image' | 'audio';
  isMine?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isPinned?: boolean;
}

export const useDatingStore = defineStore('dating', () => {
  // ==========================================
  // STATE
  // ==========================================
  const likesCount = ref<number>(0);
  const matches = ref<Match[]>([]);
  const chats = ref<Chat[]>([]);
  const isLoading = ref<boolean>(false);

  // ==========================================
  // GETTERS
  // ==========================================
  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      // Rule 1: Pinned chats first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Rule 2: Unread messages
      if (a.unread && !b.unread) return -1;
      if (!a.unread && b.unread) return 1;
      
      // Rule 3: Most recent
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  });

  const unreadChatsCount = computed(() => chats.value.filter(c => c.unread).length);

  // ==========================================
  // ACTIONS
  // ==========================================
  const fetchSidebarData = async () => {
    isLoading.value = true;
    try {
      // TODO: Replace with actual Quarkus API call
      // const response = await axios.get('/api/dating/sidebar');
      // likesCount.value = response.data.likes; ...
      
      // MOCK DATA (Simulating network delay)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      likesCount.value = 14;
      matches.value = [
        { id: 1, name: 'Elena', image: 'https://i.pravatar.cc/150?img=1', online: true },
        { id: 2, name: 'Ioana', image: 'https://i.pravatar.cc/150?img=5', online: false },
        { id: 3, name: 'Maria', image: 'https://i.pravatar.cc/150?img=9', online: true }
      ];
      chats.value = [
        { id: 1, name: 'Diana', message: 'I will call you later.', image: 'https://i.pravatar.cc/150?img=12', unread: true, timestamp: new Date(), isPinned: true },
        { id: 2, name: 'Andreea', message: 'Can\'t wait!', image: 'https://i.pravatar.cc/150?img=16', unread: false, timestamp: new Date(Date.now() - 3600000), isMine: true, status: 'read' },
      ];
    } catch (error) {
      console.error("Error fetching dating data:", error);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteChat = async (chatId: number) => {
    // 1. Optimistic UI Update
    chats.value = chats.value.filter(c => c.id !== chatId);
    
    // 2. TODO: Send delete request to server
    // await axios.delete(`/api/dating/chats/${chatId}`);
  };

  const receiveNewMatch = (newMatch: Match) => {
    matches.value.unshift(newMatch);
  };

  return {
    // State
    likesCount,
    matches,
    chats,
    isLoading,
    // Getters
    sortedChats,
    unreadChatsCount,
    // Actions
    fetchSidebarData,
    deleteChat,
    receiveNewMatch
  };
});