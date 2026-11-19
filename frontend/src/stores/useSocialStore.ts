// frontend/src/stores/useSocialStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Squad {
  id: number;
  name: string;
  image: string;
  membersCount: number;
  isJoined: boolean;
  hasActivity?: boolean;
}

export interface SocialChat {
  id: number;
  name: string;
  message: string;
  avatar: string;
  active: boolean;
  timestamp?: string | Date;
  unreadCount?: number;
  isTyping?: boolean;
  messageType?: 'text' | 'image' | 'audio' | 'file';
  hasMention?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
}

export const useSocialStore = defineStore('social', () => {
  // ==========================================
  // STATE
  // ==========================================
  const squads = ref<Squad[]>([]);
  const chats = ref<SocialChat[]>([]);
  const isLoading = ref<boolean>(false);
  const connectionStatus = ref<'connected' | 'connecting' | 'offline'>('connected');

  // ==========================================
  // GETTERS
  // ==========================================
  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      // 1. Pinned chats always on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // 2. Mentions (ignores mute)
      if (a.hasMention && !b.hasMention) return -1;
      if (!a.hasMention && b.hasMention) return 1;

      // 3. Unread (excluding muted)
      const aHasUnread = (a.unreadCount || 0) > 0 && !a.isMuted;
      const bHasUnread = (b.unreadCount || 0) > 0 && !b.isMuted;
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      // 4. Online Status (Active)
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      
      // 5. Time descending
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  });

  const activeFriendsCount = computed(() => chats.value.filter(c => c.active).length);

  // ==========================================
  // ACTIONS
  // ==========================================
  const fetchSocialData = async () => {
    isLoading.value = true;
    try {
      // TODO: Replace with Quarkus API call
      // const response = await axios.get('/api/social/sidebar');
      // squads.value = response.data.squads; ...

      // MOCK DATA (Simulating network delay)
      await new Promise(resolve => setTimeout(resolve, 800));

      squads.value = [
        { id: 1, name: 'Computer Science', image: 'https://i.pravatar.cc/150?img=1', membersCount: 124, isJoined: true, hasActivity: true },
        { id: 2, name: 'Project Team 5', image: 'https://i.pravatar.cc/150?img=2', membersCount: 8, isJoined: true },
        { id: 3, name: 'Hackathon Cluj', image: 'https://i.pravatar.cc/150?img=3', membersCount: 45, isJoined: false },
        { id: 4, name: 'Boardgames', image: 'https://i.pravatar.cc/150?img=15', membersCount: 12, isJoined: false }
      ];

      chats.value = [
        { id: 1, name: 'Ioana', message: 'Typing...', avatar: 'https://i.pravatar.cc/150?img=9', active: true, isTyping: true, isPinned: true },
        { id: 2, name: 'Weekend Squad', message: 'Who is joining us?', avatar: 'https://i.pravatar.cc/150?img=11', active: false, unreadCount: 3, hasMention: true },
        { id: 3, name: 'Mihai', message: '', avatar: 'https://i.pravatar.cc/150?img=12', active: true, messageType: 'image' },
        { id: 4, name: 'Spam Bot', message: 'Promotion!', avatar: 'https://i.pravatar.cc/150?img=15', active: false, unreadCount: 15, isMuted: true }
      ];
    } catch (error) {
      console.error("Error fetching social data:", error);
      connectionStatus.value = 'offline';
    } finally {
      isLoading.value = false;
    }
  };

  const toggleMute = (chatId: number) => {
    const chat = chats.value.find(c => c.id === chatId);
    if (chat) {
      chat.isMuted = !chat.isMuted;
      // TODO: Send update to server
    }
  };

  const joinSquad = (squadId: number) => {
    const squad = squads.value.find(s => s.id === squadId);
    if (squad) {
      squad.isJoined = true;
      squad.membersCount++;
      // TODO: Send join request to server
    }
  };

  return {
    squads,
    chats,
    isLoading,
    connectionStatus,
    sortedChats,
    activeFriendsCount,
    fetchSocialData,
    toggleMute,
    joinSquad
  };
});