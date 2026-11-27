// frontend/src/stores/useChatStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  ChatListItem,
  ChatMessagePreviewKind,
} from '../components/chat/ChatListView.vue';
import type {
  ChatHeaderCallControls,
  ConnectionStatus,
} from '../components/chat/ChatHeader.vue';
import type {
  ChatEditPayload,
  ChatSendPayload,
} from '../components/chat/ChatInput.vue';
import type { GroupHeaderSubject } from '../components/chat/GroupChatHeader.vue';
import type {
  ChatContact,
  CreateChatPayload,
} from '../components/chat/NewChatModal.vue';
import type {
  ChatProfileDetails,
  SharedFileItem,
} from '../components/chat/ChatProfilePanel.vue';
import type { MediaLightboxItem } from '../components/chat/MediaLightbox.vue';
import { useChatDrafts } from '../composables/useChatDrafts';
import type {
  ChatEntityId,
  ChatLens,
  ChatMessage,
  ChatMessageAttachment,
  ChatUser,
} from '../types/chat';

export type CallMode = 'voice' | 'video';

export interface ActiveCallRecord {
  chatKey: string;
  lens: ChatLens;
  type: CallMode;
  startedAt: number;
}

const toKey = (id: ChatEntityId): string => String(id);

const formatDurationSeconds = (secs: number): string => {
  const safe = Number.isFinite(secs) && secs > 0 ? Math.floor(secs) : 0;
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
};

const formatFileMeta = (fileName: string, fileSize?: number | string): string => {
  const ext = fileName.includes('.')
    ? (fileName.split('.').pop() ?? 'FILE').slice(0, 6).toUpperCase()
    : 'FILE';
  let sizeLabel = '';
  if (typeof fileSize === 'number' && Number.isFinite(fileSize)) {
    sizeLabel =
      fileSize < 1024
        ? `${fileSize} B`
        : fileSize < 1024 * 1024
          ? `${(fileSize / 1024).toFixed(1)} KB`
          : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  } else if (typeof fileSize === 'string') {
    sizeLabel = fileSize.trim();
  }
  return sizeLabel ? `${ext} · ${sizeLabel}` : ext;
};

const resolveMessagePreview = (
  msg: ChatMessage
): { message: string; kind: ChatMessagePreviewKind } => {
  if (msg.isDeleted) {
    return { message: 'This message was deleted', kind: 'text' };
  }

  const trimmedText = msg.text?.trim() ?? '';

  if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
    const imgCount = msg.attachments.filter((a) => a.kind === 'image').length;
    const allImages = imgCount === msg.attachments.length;
    const kind: ChatMessagePreviewKind = allImages ? 'image' : 'file';

    if (trimmedText) return { message: trimmedText, kind };
    if (msg.attachments.length === 1) {
      const first = msg.attachments[0];
      return {
        message: allImages ? 'Photo' : (first?.fileName || 'File attachment'),
        kind,
      };
    }
    return {
      message: allImages
        ? `${msg.attachments.length} photos`
        : `${msg.attachments.length} files`,
      kind,
    };
  }

  if (msg.type === 'image') {
    return { message: trimmedText || 'Photo', kind: 'image' };
  }
  if (msg.type === 'audio') {
    const dur =
      typeof msg.duration === 'number'
        ? formatDurationSeconds(msg.duration)
        : (msg.duration?.trim() || '0:00');
    return { message: `Voice message (${dur})`, kind: 'audio' };
  }
  if (msg.type === 'file') {
    return { message: trimmedText || msg.fileName || 'File attachment', kind: 'file' };
  }

  return { message: trimmedText, kind: 'text' };
};

const slugifyUsername = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');

let isNetworkBound = false;

export const useChatStore = defineStore('chat', () => {
  const { clearDraft } = useChatDrafts();

  // ==========================================
  // 1. UTILIZATOR CURENT & STARE CONEXIUNE
  // ==========================================
  const currentUserId = ref<string>('me');
  const currentUserName = ref<string>('Andrei');
  const currentUsername = ref<string>('andrei');
  const currentUserAvatarUrl = ref<string | null>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  );

  const connectionStatus = ref<ConnectionStatus>(
    typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'connected'
  );

  if (!isNetworkBound && typeof window !== 'undefined') {
    isNetworkBound = true;
    window.addEventListener('online', () => {
      connectionStatus.value = 'connected';
    });
    window.addEventListener('offline', () => {
      connectionStatus.value = 'offline';
    });
  }

  // ==========================================
  // 2. CONTACTE PE LENS (Partajate: NewChatModal & Add Member)
  // ==========================================
  const contactsByLens = ref<Record<ChatLens, ChatContact[]>>({
    PRO: [
      {
        id: 'u1',
        name: 'Andreea Ionescu',
        username: 'andreea.ionescu',
        avatarUrl: 'https://i.pravatar.cc/150?img=16',
        role: 'UI/UX Designer · UBB CS',
        status: 'online',
      },
      {
        id: 'u2',
        name: 'Pavel Manolescu',
        username: 'pavel.manolescu',
        avatarUrl: 'https://i.pravatar.cc/150?img=33',
        role: 'Backend Dev · Quarkus',
        status: 'online',
      },
      {
        id: 'u3',
        name: 'Mihai (Mentor)',
        username: 'mihai.mentor',
        avatarUrl: 'https://i.pravatar.cc/150?img=11',
        role: 'Senior Architect',
        status: 'away',
      },
      {
        id: 'u4',
        name: 'Elena Radu',
        username: 'elena.radu',
        avatarUrl: null,
        role: 'ML & Data Engineering',
        status: 'online',
      },
      {
        id: 'u5',
        name: 'Vlad Georgescu',
        username: 'vlad.georgescu',
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
        role: 'DevOps & Cloud',
        status: 'offline',
      },
      {
        id: 'u6',
        name: 'Diana Popa',
        username: 'diana.popa',
        avatarUrl: 'https://i.pravatar.cc/150?img=45',
        role: 'QA & Automation',
        status: 'busy',
      },
    ],
    SOCIAL: [
      {
        id: 's1',
        name: 'Alex Marin',
        username: 'alex.marin',
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
        role: '6 mutual friends · Cluj',
        status: 'online',
      },
      {
        id: 's2',
        name: 'Ioana Stan',
        username: 'ioana.stan',
        avatarUrl: 'https://i.pravatar.cc/150?img=32',
        role: 'Running Club · UBB',
        status: 'online',
      },
      {
        id: 's3',
        name: 'Radu Munteanu',
        username: 'radu.m',
        avatarUrl: null,
        role: '3 mutual friends',
        status: 'away',
      },
    ],
    DATE: [
      {
        id: 'd1',
        name: 'Maria Dumitru',
        username: 'maria.d',
        avatarUrl: 'https://i.pravatar.cc/150?img=47',
        role: 'Matched 2h ago · Cluj-Napoca',
        status: 'online',
        badge: 'New Match',
      },
      {
        id: 'd2',
        name: 'Teodora Vasile',
        username: 'teodora.v',
        avatarUrl: 'https://i.pravatar.cc/150?img=44',
        role: 'Matched yesterday',
        status: 'away',
      },
    ],
  });

  // ==========================================
  // 3. CONVERSAȚII PE LENS (cu lastMessageAt real pentru sortare/formatare)
  // ==========================================
  const seedNow = Date.now();
  const oneMin = 60_000;
  const oneDay = 24 * 60 * oneMin;

  const chatsByLens = ref<Record<ChatLens, ChatListItem[]>>({
    PRO: [
      {
        id: 1,
        name: 'Andreea Ionescu',
        message: 'Almost done. I just need to fix the sidebar styling.',
        lastMessageAt: seedNow - 8 * oneMin,
        unread: 2,
        avatarUrl: 'https://i.pravatar.cc/150?img=16',
        status: 'online',
        isPinned: true,
      },
      {
        id: 2,
        name: 'Proiect Colectiv Team',
        message: 'Perfect, tocmai am terminat refactorul pe header, input și bule. Dau push imediat.',
        lastMessageAt: seedNow - 10 * oneMin,
        unread: 0,
        avatarUrl: 'https://i.pravatar.cc/150?img=33',
        isGroup: true,
        isMuted: false,
        isLastMessageMine: true,
        deliveryStatus: 'read',
      },
      {
        id: 3,
        name: 'Mihai (Mentor)',
        message: 'Let me know if you need help with the API.',
        lastMessageAt: seedNow - 2 * oneDay - 12 * oneMin,
        unread: 0,
        avatarUrl: 'https://i.pravatar.cc/150?img=11',
        status: 'away',
        isLastMessageMine: false,
      },
    ],
    SOCIAL: [
      {
        id: 201,
        name: 'Alex Marin',
        message: 'Mergem diseară la sală sau în parc?',
        lastMessageAt: seedNow - 20 * oneMin,
        unread: 1,
        avatarUrl: 'https://i.pravatar.cc/150?img=15',
        status: 'online',
      },
    ],
    DATE: [
      {
        id: 301,
        name: 'Maria Dumitru',
        message: 'Hey! Am văzut că ești tot la UBB Cluj.',
        lastMessageAt: seedNow - 120 * oneMin,
        unread: 1,
        avatarUrl: 'https://i.pravatar.cc/150?img=47',
        status: 'online',
      },
    ],
  });

  // ==========================================
  // 4. PROFILURI, GRUPURI & MESAJE
  // ==========================================
  const profilesByChatId = ref<Record<string, ChatProfileDetails>>({
    '1': {
      username: 'andreea.ionescu',
      bio: 'Product-focused frontend & UI/UX designer crafting dark-mode interfaces and design systems.',
      role: 'UI/UX Designer · Frontend',
      organization: 'UBB · Faculty of Mathematics and Computer Science',
      location: 'Cluj-Napoca, Romania',
      verified: true,
      tags: ['Figma', 'Vue 3', 'Tailwind CSS', 'Design Systems', 'TypeScript'],
      links: [
        { label: 'GitHub · @andreea-ui', url: 'https://github.com' },
        { label: 'Portfolio & Case Studies', url: 'https://dribbble.com' },
      ],
      mutualGroups: ['Proiect Colectiv Team'],
      promptQuestion: 'Currently building',
      promptAnswer: 'Interactive split-view messaging & adaptive lens themes for Cliq.',
    },
    '2': {
      description:
        'Core engineering channel for the Cliq platform — coordinating Vue 3 frontend, Quarkus APIs, PostgreSQL schema, and sprint demos.',
      createdAt: 'Oct 14, 2026',
      adminIds: ['me', 'u1', 'u2'],
    },
    '3': {
      username: 'mihai.mentor',
      bio: 'Staff backend architect mentoring student teams on distributed systems, clean APIs, and production readiness.',
      role: 'Senior Software Architect & Mentor',
      organization: 'Industry Partner · UBB Proiect Colectiv',
      location: 'Cluj-Napoca, Romania',
      verified: true,
      tags: ['Quarkus', 'PostgreSQL', 'System Design', 'WebSockets', 'Docker'],
      links: [{ label: 'LinkedIn Profile', url: 'https://linkedin.com' }],
      mutualGroups: ['Proiect Colectiv Team'],
    },
    '201': {
      username: 'alex.marin',
      bio: 'Coffee, calisthenics, and weekend hikes around Cluj.',
      location: 'Cluj-Napoca, Romania',
      tags: ['Calisthenics', 'Board Games', 'Specialty Coffee'],
    },
    '301': {
      username: 'maria.d',
      bio: 'Architecture student who loves indie concerts and late-night walks.',
      location: 'Cluj-Napoca, Romania',
      tags: ['Architecture', 'Photography', 'Indie Music'],
      promptQuestion: 'Ideal Sunday',
      promptAnswer: 'Matcha in the morning, gallery walk, and cooking pasta from scratch.',
    },
  });

  const groupsById = ref<Record<string, GroupHeaderSubject>>({
    '2': {
      id: '2',
      name: 'Proiect Colectiv Team',
      avatarUrl: 'https://i.pravatar.cc/150?img=33',
      membersCount: 5,
      onlineCount: 4,
      typingUsers: [],
      members: [
        { id: 'u1', name: 'Andreea Ionescu', avatarUrl: 'https://i.pravatar.cc/150?img=16' },
        { id: 'u2', name: 'Pavel Manolescu', avatarUrl: 'https://i.pravatar.cc/150?img=33' },
        { id: 'u3', name: 'Mihai (Mentor)', avatarUrl: 'https://i.pravatar.cc/150?img=11' },
        { id: 'u4', name: 'Elena Radu', avatarUrl: null },
      ],
    },
  });

  const buildInitialMessages = (): Record<string, ChatMessage[]> => ({
    '1': [
      {
        id: 1,
        text: 'Salut! Ai apucat să verifici noul design pentru fereastra de chat?',
        isMine: false,
        timestamp: new Date(seedNow - oneDay - 15 * oneMin),
        status: 'read',
        type: 'text',
      },
      {
        id: 2,
        text: 'Da, arată super curat. Am pregătit și tipurile în `src/types/chat.ts`:\n```ts\nexport type ChatLens = "PRO" | "SOCIAL" | "DATE";\n```',
        isMine: true,
        senderId: 'me',
        timestamp: new Date(seedNow - oneDay - 12 * oneMin),
        status: 'read',
        type: 'text',
        reactions: { '❤️': ['u1'] },
      },
      {
        id: 3,
        text: 'Almost done. I just need to fix the sidebar styling — vezi referința aici https://tailwindcss.com/docs',
        isMine: false,
        timestamp: new Date(seedNow - 8 * oneMin),
        status: 'read',
        type: 'text',
        replyToId: 2,
      },
    ],
    '2': [
      {
        id: 101,
        text: 'Hey team, am urcat schema nouă de PostgreSQL pe branch-ul `feat/chat-api`.',
        isMine: false,
        senderId: 'u2',
        senderName: 'Pavel Manolescu',
        senderAvatar: 'https://i.pravatar.cc/150?img=33',
        timestamp: new Date(seedNow - oneDay - 40 * oneMin),
        status: 'read',
        type: 'text',
      },
      {
        id: 102,
        text: 'Puteți rula migrarea cu:\n```bash\ndocker compose up -d db\n./mvnw quarkus:dev\n```',
        isMine: false,
        senderId: 'u2',
        senderName: 'Pavel Manolescu',
        senderAvatar: 'https://i.pravatar.cc/150?img=33',
        timestamp: new Date(seedNow - oneDay - 38 * oneMin),
        status: 'read',
        type: 'text',
        reactions: { '👍': ['me', 'u1'] },
      },
      {
        id: 103,
        text: 'Super, am verificat endpoint-ul și merge curat! @andrei putem lega componentele de chat azi.',
        isMine: false,
        senderId: 'u1',
        senderName: 'Andreea Ionescu',
        senderAvatar: 'https://i.pravatar.cc/150?img=16',
        timestamp: new Date(seedNow - 25 * oneMin),
        status: 'read',
        type: 'text',
        replyToId: 101,
      },
      {
        id: 104,
        text: 'Perfect, tocmai am terminat refactorul pe header, input și bule. Dau push imediat.',
        isMine: true,
        senderId: 'me',
        timestamp: new Date(seedNow - 10 * oneMin),
        status: 'read',
        type: 'text',
        replyToId: 103,
      },
    ],
    '3': [
      {
        id: 201,
        text: 'Salut Mihai! Am început integrarea front-end pentru modulul de chat.',
        isMine: true,
        senderId: 'me',
        timestamp: new Date(seedNow - 2 * oneDay - 30 * oneMin),
        status: 'read',
        type: 'text',
      },
      {
        id: 202,
        text: 'Let me know if you need help with the API.',
        isMine: false,
        timestamp: new Date(seedNow - 2 * oneDay - 12 * oneMin),
        status: 'read',
        type: 'text',
      },
    ],
    '201': [
      {
        id: 301,
        text: 'Mergem diseară la sală sau în parc?',
        isMine: false,
        timestamp: new Date(seedNow - 20 * oneMin),
        status: 'read',
        type: 'text',
      },
    ],
    '301': [
      {
        id: 401,
        text: 'Hey! Am văzut că ești tot la UBB Cluj.',
        isMine: false,
        timestamp: new Date(seedNow - 120 * oneMin),
        status: 'read',
        type: 'text',
      },
    ],
  });

  const messagesByChatId = ref<Record<string, ChatMessage[]>>(buildInitialMessages());
  const directContactIdByChatId = ref<Record<string, string>>({
    '1': 'u1',
    '3': 'u3',
    '201': 's1',
    '301': 'd1',
  });
  const blockedChatIds = ref<Record<string, boolean>>({});

  // Apel activ + cronometru live (mm:ss) pentru ChatHeader / GroupChatHeader / ChatProfilePanel
  const activeCall = ref<ActiveCallRecord | null>(null);
  const activeCallDuration = ref<string>('0:00');
  let callDurationTimer: ReturnType<typeof setInterval> | null = null;

  const stopCallTimer = () => {
    if (callDurationTimer !== null) {
      clearInterval(callDurationTimer);
      callDurationTimer = null;
    }
    activeCallDuration.value = '0:00';
  };

  const startCallTimer = (startedAt: number) => {
    stopCallTimer();
    const update = () => {
      activeCallDuration.value = formatDurationSeconds((Date.now() - startedAt) / 1000);
    };
    update();
    callDurationTimer = setInterval(update, 1000);
  };

  // ==========================================
  // 5. MANAGEMENT OBJECT URL-URI & GENERATOR ID-URI MONOTONIC
  // ==========================================
  const messageBlobUrlsByChat = new Map<string, Set<string>>();
  const groupAvatarUrlByChat = new Map<string, string>();

  let nextChatNumericId = 1000;
  let lastGeneratedMsgId = Date.now();

  const nextMessageId = (): number => {
    const now = Date.now();
    lastGeneratedMsgId = now > lastGeneratedMsgId ? now : lastGeneratedMsgId + 1;
    return lastGeneratedMsgId;
  };

  const registerMessageBlobUrl = (chatKey: string, blob: File | Blob): string => {
    const url = URL.createObjectURL(blob);
    let set = messageBlobUrlsByChat.get(chatKey);
    if (!set) {
      set = new Set<string>();
      messageBlobUrlsByChat.set(chatKey, set);
    }
    set.add(url);
    return url;
  };

  const revokeMessageBlobUrls = (chatKey: string) => {
    const set = messageBlobUrlsByChat.get(chatKey);
    if (!set) return;
    set.forEach((url) => URL.revokeObjectURL(url));
    set.clear();
    messageBlobUrlsByChat.delete(chatKey);
  };

  const registerGroupAvatarUrl = (chatKey: string, file: File): string => {
    const prev = groupAvatarUrlByChat.get(chatKey);
    if (prev) URL.revokeObjectURL(prev);
    const url = URL.createObjectURL(file);
    groupAvatarUrlByChat.set(chatKey, url);
    return url;
  };

  const revokeGroupAvatarUrl = (chatKey: string) => {
    const prev = groupAvatarUrlByChat.get(chatKey);
    if (!prev) return;
    URL.revokeObjectURL(prev);
    groupAvatarUrlByChat.delete(chatKey);
  };

  // ==========================================
  // 6. GETTERS / SELECTORI
  // ==========================================
  const getChats = (lens: ChatLens): ChatListItem[] => chatsByLens.value[lens];

  const getContacts = (lens: ChatLens): ChatContact[] => contactsByLens.value[lens];

  const getChatById = (lens: ChatLens, chatId: ChatEntityId | null): ChatListItem | null => {
    if (chatId === null) return null;
    const key = toKey(chatId);
    return chatsByLens.value[lens].find((c) => toKey(c.id) === key) ?? null;
  };

  const getMessages = (chatId: ChatEntityId | null): ChatMessage[] => {
    if (chatId === null) return [];
    return messagesByChatId.value[toKey(chatId)] ?? [];
  };

  const getProfileDetails = (chatId: ChatEntityId | null): ChatProfileDetails | null => {
    if (chatId === null) return null;
    return profilesByChatId.value[toKey(chatId)] ?? null;
  };

  const getGroup = (chatId: ChatEntityId | null): GroupHeaderSubject | null => {
    if (chatId === null) return null;
    return groupsById.value[toKey(chatId)] ?? null;
  };

  const getDirectUser = (lens: ChatLens, chatId: ChatEntityId | null): ChatUser | null => {
    const chat = getChatById(lens, chatId);
    if (!chat || chat.isGroup) return null;

    const key = toKey(chat.id);
    const contactId = directContactIdByChatId.value[key];
    const profile = profilesByChatId.value[key];

    return {
      id: contactId ?? chat.id,
      name: chat.name,
      username: profile?.username,
      avatar: chat.avatarUrl ?? null,
      status: chat.status ?? 'offline',
      isTyping: Boolean(chat.isTyping),
    };
  };

  const isChatBlocked = (chatId: ChatEntityId | null): boolean => {
    if (chatId === null) return false;
    return Boolean(blockedChatIds.value[toKey(chatId)]);
  };

  /** Contract complet aliniat cu ChatHeader / GroupChatHeader / ChatProfilePanel */
  const getCallControls = (chatId: ChatEntityId | null): ChatHeaderCallControls => {
    const call = activeCall.value;
    if (!call) {
      return { activeCall: { status: 'idle' } };
    }
    const inCurrentChat = chatId !== null && call.chatKey === toKey(chatId);
    return {
      activeCall: {
        status: 'active',
        type: call.type,
        inCurrentChat,
        duration: activeCallDuration.value,
      },
    };
  };

  /** Extrage media din mesaje singulare ȘI din albume multi-attachment pentru ChatProfilePanel */
  const getSharedMedia = (chatId: ChatEntityId | null): MediaLightboxItem[] => {
    const list = getMessages(chatId);
    const items: MediaLightboxItem[] = [];

    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i];
      if (!msg || msg.isDeleted) continue;

      if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        const imgs = msg.attachments.filter((a) => a.kind === 'image');
        for (let j = imgs.length - 1; j >= 0; j--) {
          const att = imgs[j];
          if (!att?.url) continue;
          items.push({
            id: att.id ?? `${msg.id}-img-${j}`,
            src: att.url,
            alt: msg.text?.trim() || att.fileName || 'Shared photo',
            caption: msg.text?.trim() || null,
            fileName: att.fileName ?? null,
            senderName: msg.isMine ? currentUserName.value : (msg.senderName ?? null),
            timestamp: msg.timestamp,
            messageId: msg.id,
          });
        }
      } else if (msg.type === 'image' && msg.attachment) {
        items.push({
          id: msg.id,
          src: msg.attachment,
          alt: msg.text?.trim() || msg.fileName || 'Shared photo',
          caption: msg.text?.trim() || null,
          fileName: msg.fileName ?? null,
          senderName: msg.isMine ? currentUserName.value : (msg.senderName ?? null),
          timestamp: msg.timestamp,
          messageId: msg.id,
        });
      }
    }

    return items;
  };

  /** Extrage fișiere din mesaje singulare ȘI din loturi multi-attachment pentru ChatProfilePanel */
  const getSharedFiles = (chatId: ChatEntityId | null): SharedFileItem[] => {
    const list = getMessages(chatId);
    const items: SharedFileItem[] = [];

    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i];
      if (!msg || msg.isDeleted) continue;

      if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        const files = msg.attachments.filter((a) => a.kind === 'file');
        for (let j = files.length - 1; j >= 0; j--) {
          const att = files[j];
          if (!att?.url) continue;
          const fileName = att.fileName || 'Attachment';
          items.push({
            id: att.id ?? `${msg.id}-file-${j}`,
            url: att.url,
            fileName,
            metaLabel: formatFileMeta(fileName, att.fileSize),
            timestamp: msg.timestamp,
            messageId: msg.id,
          });
        }
      } else if (msg.type === 'file' && msg.attachment) {
        const fileName = msg.fileName || 'Attachment';
        items.push({
          id: msg.id,
          url: msg.attachment,
          fileName,
          metaLabel: formatFileMeta(fileName, msg.fileSize),
          timestamp: msg.timestamp,
          messageId: msg.id,
        });
      }
    }

    return items;
  };

  const getUnreadChatsCount = (lens: ChatLens): number =>
    chatsByLens.value[lens].filter((c) => c.unread > 0).length;

  const getTotalUnreadMessages = (lens: ChatLens): number =>
    chatsByLens.value[lens].reduce((sum, c) => sum + (c.unread || 0), 0);

  /** Deduplicare strictă pe contactId și username (fără coliziuni pe name) */
  const getExistingDirectChatMap = (lens: ChatLens): Record<string, ChatEntityId> => {
    const map: Record<string, ChatEntityId> = {};
    for (const chat of chatsByLens.value[lens]) {
      if (chat.isGroup) continue;
      const key = toKey(chat.id);
      const contactId = directContactIdByChatId.value[key];
      if (contactId) map[contactId] = chat.id;

      const username = profilesByChatId.value[key]?.username
        ?.trim()
        .replace(/^@/, '')
        .toLowerCase();
      if (username) map[username] = chat.id;
    }
    return map;
  };

  const findGroupChatIdByName = (lens: ChatLens, groupName: string): ChatEntityId | null => {
    const normalized = groupName.trim().toLowerCase();
    const matched = chatsByLens.value[lens].find(
      (c) => c.isGroup && c.name.trim().toLowerCase() === normalized
    );
    return matched ? matched.id : null;
  };

  const findContactByUsername = (lens: ChatLens, username: string): ChatContact | null => {
    const normalized = username.trim().replace(/^@/, '').toLowerCase();
    if (!normalized) return null;
    return (
      contactsByLens.value[lens].find(
        (c) => c.username.trim().replace(/^@/, '').toLowerCase() === normalized
      ) ?? null
    );
  };

  // ==========================================
  // 7. ACȚIUNI CONVERSAȚII (Read, Pin, Mute, Block, Call, Create)
  // ==========================================
  const markChatAsRead = (lens: ChatLens, chatId: ChatEntityId) => {
    const target = getChatById(lens, chatId);
    if (target && target.unread > 0) {
      target.unread = 0;
    }
  };

  const togglePin = (lens: ChatLens, chatId: ChatEntityId) => {
    const target = getChatById(lens, chatId);
    if (target) target.isPinned = !target.isPinned;
  };

  const toggleMute = (lens: ChatLens, chatId: ChatEntityId) => {
    const target = getChatById(lens, chatId);
    if (target) target.isMuted = !target.isMuted;
  };

  const setMuted = (lens: ChatLens, chatId: ChatEntityId, muted: boolean) => {
    const target = getChatById(lens, chatId);
    if (target) target.isMuted = muted;
  };

  const toggleRead = (lens: ChatLens, chatId: ChatEntityId) => {
    const target = getChatById(lens, chatId);
    if (target) target.unread = target.unread > 0 ? 0 : 1;
  };

  const endActiveCall = () => {
    activeCall.value = null;
    stopCallTimer();
  };

  const toggleBlock = (lens: ChatLens, chatId: ChatEntityId) => {
    const chat = getChatById(lens, chatId);
    if (!chat || chat.isGroup) return;

    const key = toKey(chatId);
    const nextBlocked = !blockedChatIds.value[key];
    blockedChatIds.value = {
      ...blockedChatIds.value,
      [key]: nextBlocked,
    };

    if (nextBlocked && activeCall.value?.chatKey === key) {
      endActiveCall();
    }
  };

  const toggleCall = (lens: ChatLens, chatId: ChatEntityId, callType: CallMode) => {
    if (connectionStatus.value !== 'connected') return;
    const chat = getChatById(lens, chatId);
    if (!chat) return;
    if (!chat.isGroup && isChatBlocked(chatId)) return;

    const key = toKey(chatId);
    if (activeCall.value?.chatKey === key && activeCall.value.type === callType) {
      endActiveCall();
      return;
    }

    // Nu pornim un apel nou dacă există deja alt apel activ
    if (activeCall.value) return;

    const startedAt = Date.now();
    activeCall.value = { chatKey: key, lens, type: callType, startedAt };
    startCallTimer(startedAt);
  };

  const createChat = (lens: ChatLens, payload: CreateChatPayload): ChatEntityId => {
    // Protecție suplimentară anti-duplicare pentru DM
    if (payload.mode === 'direct') {
      const existingMap = getExistingDirectChatMap(lens);
      const cleanUsername = payload.contact.username.trim().replace(/^@/, '').toLowerCase();
      const existingId =
        existingMap[toKey(payload.contact.id)] ??
        (cleanUsername ? existingMap[cleanUsername] : undefined);
      if (existingId !== undefined) {
        if (payload.initialMessage) {
          sendMessage(lens, existingId, { type: 'text', text: payload.initialMessage });
        }
        return existingId;
      }
    }

    const newId = ++nextChatNumericId;
    const key = toKey(newId);
    const createdAt = Date.now();

    const initialMsgList: ChatMessage[] = payload.initialMessage
      ? [
          {
            id: nextMessageId(),
            text: payload.initialMessage,
            isMine: true,
            senderId: currentUserId.value,
            timestamp: new Date(createdAt),
            status: 'sent',
            type: 'text',
          },
        ]
      : [];

    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: initialMsgList,
    };

    if (payload.mode === 'direct') {
      const newItem: ChatListItem = {
        id: newId,
        name: payload.contact.name,
        message: payload.initialMessage || 'Start the conversation...',
        lastMessageAt: createdAt,
        unread: 0,
        avatarUrl: payload.contact.avatarUrl ?? null,
        status: payload.contact.status ?? 'offline',
        isLastMessageMine: Boolean(payload.initialMessage),
        deliveryStatus: payload.initialMessage ? 'sent' : undefined,
      };

      profilesByChatId.value = {
        ...profilesByChatId.value,
        [key]: {
          username: payload.contact.username,
          role: payload.contact.role,
        },
      };

      directContactIdByChatId.value = {
        ...directContactIdByChatId.value,
        [key]: toKey(payload.contact.id),
      };

      chatsByLens.value[lens] = [newItem, ...chatsByLens.value[lens]];
    } else {
      const groupAvatarUrl = payload.avatarFile
        ? registerGroupAvatarUrl(key, payload.avatarFile)
        : null;

      const onlineCount =
        payload.members.filter((m) => m.status === 'online').length + 1;

      groupsById.value = {
        ...groupsById.value,
        [key]: {
          id: key,
          name: payload.name,
          avatarUrl: groupAvatarUrl,
          membersCount: payload.members.length + 1,
          onlineCount,
          typingUsers: [],
          members: payload.members.map((m) => ({
            id: toKey(m.id),
            name: m.name,
            avatarUrl: m.avatarUrl ?? null,
          })),
        },
      };

      profilesByChatId.value = {
        ...profilesByChatId.value,
        [key]: {
          description: `Group created in ${lens} workspace.`,
          createdAt: 'Today',
          adminIds: [currentUserId.value],
        },
      };

      const newItem: ChatListItem = {
        id: newId,
        name: payload.name,
        message:
          payload.initialMessage ||
          `Group created with ${payload.members.length} ${payload.members.length === 1 ? 'member' : 'members'}`,
        lastMessageAt: createdAt,
        unread: 0,
        avatarUrl: groupAvatarUrl,
        isGroup: true,
        isLastMessageMine: Boolean(payload.initialMessage),
        deliveryStatus: payload.initialMessage ? 'sent' : undefined,
      };

      chatsByLens.value[lens] = [newItem, ...chatsByLens.value[lens]];
    }

    return newId;
  };

  const openOrCreateDirectChat = (
    lens: ChatLens,
    member: { id: ChatEntityId; name: string; avatarUrl?: string | null }
  ): ChatEntityId => {
    const memberKey = toKey(member.id);
    const existingMap = getExistingDirectChatMap(lens);
    const existingId = existingMap[memberKey];

    if (existingId !== undefined) {
      return existingId;
    }

    const knownContact = contactsByLens.value[lens].find((c) => toKey(c.id) === memberKey);
    return createChat(lens, {
      mode: 'direct',
      contact: knownContact ?? {
        id: member.id,
        name: member.name,
        username: slugifyUsername(member.name) || memberKey,
        avatarUrl: member.avatarUrl ?? null,
        status: 'offline',
      },
    });
  };

  // ==========================================
  // 8. ACȚIUNI GRUP (Add Member, Toggle Admin, Remove Member, Leave)
  // ==========================================
  const addMemberToGroup = (chatId: ChatEntityId, contact: ChatContact) => {
    const key = toKey(chatId);
    const currentAdmins = profilesByChatId.value[key]?.adminIds ?? [];
    if (!currentAdmins.includes(currentUserId.value)) return;

    const currentGroup = groupsById.value[key];
    if (!currentGroup) return;

    const existingMembers = currentGroup.members ?? [];
    if (existingMembers.some((m) => toKey(m.id) === toKey(contact.id))) return;

    groupsById.value = {
      ...groupsById.value,
      [key]: {
        ...currentGroup,
        membersCount: (currentGroup.membersCount ?? existingMembers.length + 1) + 1,
        onlineCount:
          (currentGroup.onlineCount ?? 0) + (contact.status === 'online' ? 1 : 0),
        members: [
          ...existingMembers,
          { id: toKey(contact.id), name: contact.name, avatarUrl: contact.avatarUrl ?? null },
        ],
      },
    };
  };

  const toggleGroupAdmin = (chatId: ChatEntityId, memberId: string) => {
    const key = toKey(chatId);
    if (memberId === currentUserId.value) return;

    const currentProfile = profilesByChatId.value[key] ?? {};
    const currentAdmins = currentProfile.adminIds ?? [];
    if (!currentAdmins.includes(currentUserId.value)) return;

    const isAlreadyAdmin = currentAdmins.includes(memberId);
    const nextAdmins = isAlreadyAdmin
      ? currentAdmins.filter((id) => id !== memberId)
      : [...currentAdmins, memberId];

    profilesByChatId.value = {
      ...profilesByChatId.value,
      [key]: {
        ...currentProfile,
        adminIds: nextAdmins,
      },
    };
  };

  const removeMemberFromGroup = (
    lens: ChatLens,
    chatId: ChatEntityId,
    memberId: string
  ) => {
    const key = toKey(chatId);
    if (memberId === currentUserId.value) return;

    const currentProfile = profilesByChatId.value[key] ?? {};
    const currentAdmins = currentProfile.adminIds ?? [];
    if (!currentAdmins.includes(currentUserId.value)) return;

    const currentGroup = groupsById.value[key];
    if (!currentGroup) return;

    const existingMembers = currentGroup.members ?? [];
    if (!existingMembers.some((m) => toKey(m.id) === memberId)) return;

    const contactMatch = contactsByLens.value[lens].find((c) => toKey(c.id) === memberId);
    const wasOnline = contactMatch?.status === 'online';
    const currentCount = currentGroup.membersCount ?? existingMembers.length + 1;

    groupsById.value = {
      ...groupsById.value,
      [key]: {
        ...currentGroup,
        membersCount: Math.max(1, currentCount - 1),
        onlineCount: Math.max(1, (currentGroup.onlineCount ?? 1) - (wasOnline ? 1 : 0)),
        members: existingMembers.filter((m) => toKey(m.id) !== memberId),
      },
    };

    if (currentAdmins.includes(memberId)) {
      profilesByChatId.value = {
        ...profilesByChatId.value,
        [key]: {
          ...currentProfile,
          adminIds: currentAdmins.filter((id) => id !== memberId),
        },
      };
    }
  };

  const leaveGroup = (lens: ChatLens, chatId: ChatEntityId) => {
    const key = toKey(chatId);
    if (activeCall.value?.chatKey === key) {
      endActiveCall();
    }

    revokeMessageBlobUrls(key);
    revokeGroupAvatarUrl(key);
    clearDraft(chatId);

    chatsByLens.value[lens] = chatsByLens.value[lens].filter((c) => toKey(c.id) !== key);

    const nextMsgs = { ...messagesByChatId.value };
    delete nextMsgs[key];
    messagesByChatId.value = nextMsgs;

    const nextGroups = { ...groupsById.value };
    delete nextGroups[key];
    groupsById.value = nextGroups;

    const nextProfiles = { ...profilesByChatId.value };
    delete nextProfiles[key];
    profilesByChatId.value = nextProfiles;

    const nextBlocked = { ...blockedChatIds.value };
    delete nextBlocked[key];
    blockedChatIds.value = nextBlocked;
  };

  // ==========================================
  // 9. ACȚIUNI MESAJE (Send, Receive WS, Edit, Delete, React, Retry, Clear)
  // ==========================================
  const bumpChatToTop = (
    lens: ChatLens,
    chatId: ChatEntityId,
    patch: Partial<ChatListItem>
  ) => {
    const key = toKey(chatId);
    const list = chatsByLens.value[lens];
    const idx = list.findIndex((c) => toKey(c.id) === key);
    if (idx === -1) return;

    const current = list[idx];
    if (!current) return;

    const updated: ChatListItem = { ...current, ...patch };
    chatsByLens.value[lens] = [
      updated,
      ...list.slice(0, idx),
      ...list.slice(idx + 1),
    ];
  };

  const sendMessage = (
    lens: ChatLens,
    chatId: ChatEntityId,
    payload: ChatSendPayload,
    meta: { replyToId?: ChatEntityId } = {}
  ): ChatMessage => {
    const key = toKey(chatId);
    const sentAt = Date.now();
    const id = nextMessageId();

    let createdMsg: ChatMessage;

    if (payload.type === 'text') {
      createdMsg = {
        id,
        text: payload.text,
        isMine: true,
        senderId: currentUserId.value,
        timestamp: new Date(sentAt),
        status: 'sent',
        type: 'text',
        replyToId: meta.replyToId,
      };
    } else if (payload.type === 'audio') {
      createdMsg = {
        id,
        text: '',
        isMine: true,
        senderId: currentUserId.value,
        timestamp: new Date(sentAt),
        status: 'sent',
        type: 'audio',
        attachment: registerMessageBlobUrl(key, payload.file),
        duration: payload.duration,
        waveform: payload.waveform,
        replyToId: meta.replyToId,
      };
    } else {
      const mappedAttachments: ChatMessageAttachment[] = payload.files.map((item, idx) => ({
        id: `${id}-att-${idx}`,
        url: registerMessageBlobUrl(key, item.file),
        kind: item.kind,
        fileName: item.file.name,
        fileSize: item.file.size,
        mimeType: item.file.type || undefined,
      }));

      const single = mappedAttachments.length === 1 ? mappedAttachments[0] : undefined;

      createdMsg = {
        id,
        text: payload.text ?? '',
        isMine: true,
        senderId: currentUserId.value,
        timestamp: new Date(sentAt),
        status: 'sent',
        type: single ? single.kind : 'attachments',
        attachment: single?.url,
        fileName: single?.fileName,
        fileSize: single?.fileSize,
        attachments: mappedAttachments,
        replyToId: meta.replyToId,
      };
    }

    const currentList = messagesByChatId.value[key] ?? [];
    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: [...currentList, createdMsg],
    };

    const preview = resolveMessagePreview(createdMsg);
    bumpChatToTop(lens, chatId, {
      message: preview.message,
      lastMessageKind: preview.kind,
      lastMessageSenderName: null,
      lastMessageAt: sentAt,
      isLastMessageMine: true,
      deliveryStatus: 'sent',
      unread: 0,
    });

    return createdMsg;
  };

  /** Pregătit pentru mesaje primite live prin WebSocket (cu deduplicare pe id). */
  const receiveIncomingMessage = (
    lens: ChatLens,
    chatId: ChatEntityId,
    msg: ChatMessage,
    isCurrentlyViewing = false
  ) => {
    const key = toKey(chatId);
    const currentList = messagesByChatId.value[key] ?? [];
    if (currentList.some((m) => toKey(m.id) === toKey(msg.id))) return;

    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: [...currentList, msg],
    };

    const existingChat = getChatById(lens, chatId);
    const preview = resolveMessagePreview(msg);

    bumpChatToTop(lens, chatId, {
      message: preview.message,
      lastMessageKind: preview.kind,
      lastMessageSenderName:
        existingChat?.isGroup && msg.senderName
          ? (msg.senderName.trim().split(/\s+/)[0] ?? msg.senderName)
          : null,
      lastMessageAt: msg.timestamp,
      isLastMessageMine: false,
      deliveryStatus: undefined,
      unread: isCurrentlyViewing ? 0 : (existingChat?.unread ?? 0) + 1,
    });
  };

  const editMessage = (
    lens: ChatLens,
    chatId: ChatEntityId,
    payload: ChatEditPayload
  ) => {
    const key = toKey(chatId);
    const targetId = toKey(payload.messageId);
    const list = messagesByChatId.value[key] ?? [];
    let updatedMessage: ChatMessage | null = null;

    const nextList = list.map((m) => {
      if (toKey(m.id) !== targetId) return m;
      updatedMessage = { ...m, text: payload.text, isEdited: true };
      return updatedMessage;
    });

    if (!updatedMessage) return;

    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: nextList,
    };

    const lastMsg = nextList[nextList.length - 1];
    const chat = getChatById(lens, chatId);
    if (chat && lastMsg && toKey(lastMsg.id) === targetId) {
      const preview = resolveMessagePreview(updatedMessage);
      chat.message = preview.message;
      chat.lastMessageKind = preview.kind;
    }
  };

  const deleteMessage = (
    lens: ChatLens,
    chatId: ChatEntityId,
    deleted: ChatMessage
  ) => {
    const key = toKey(chatId);
    const targetId = toKey(deleted.id);
    const list = messagesByChatId.value[key] ?? [];

    const nextList = list.map((m) =>
      toKey(m.id) === targetId
        ? {
            ...m,
            isDeleted: true,
            text: '',
            attachment: undefined,
            attachments: undefined,
          }
        : m
    );

    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: nextList,
    };

    const lastMsg = nextList[nextList.length - 1];
    const chat = getChatById(lens, chatId);
    if (chat && lastMsg && toKey(lastMsg.id) === targetId) {
      chat.message = 'This message was deleted';
      chat.lastMessageKind = 'text';
    }
  };

  const reactToMessage = (
    chatId: ChatEntityId,
    messageId: ChatEntityId,
    emoji: string
  ) => {
    const key = toKey(chatId);
    const targetId = toKey(messageId);
    const userId = currentUserId.value;
    const list = messagesByChatId.value[key] ?? [];

    const nextList = list.map((msg) => {
      if (toKey(msg.id) !== targetId) return msg;

      const nextReactions: Record<string, ChatEntityId | ChatEntityId[]> = {};
      const existingForEmoji = msg.reactions?.[emoji];
      const existingList = Array.isArray(existingForEmoji)
        ? existingForEmoji
        : existingForEmoji !== undefined && existingForEmoji !== null
          ? [existingForEmoji]
          : [];
      const alreadyReacted = existingList.some((id) => toKey(id) === userId);

      if (msg.reactions) {
        for (const [k, val] of Object.entries(msg.reactions)) {
          if (Array.isArray(val)) {
            const filtered = val.filter((id) => toKey(id) !== userId);
            if (filtered.length > 0) nextReactions[k] = filtered;
          } else if (val !== undefined && val !== null && toKey(val) !== userId) {
            nextReactions[k] = val;
          }
        }
      }

      if (!alreadyReacted) {
        const existing = nextReactions[emoji];
        if (Array.isArray(existing)) {
          nextReactions[emoji] = [...existing, userId];
        } else if (existing !== undefined) {
          nextReactions[emoji] = [existing, userId];
        } else {
          nextReactions[emoji] = [userId];
        }
      }

      return { ...msg, reactions: nextReactions };
    });

    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: nextList,
    };
  };

  const retryMessage = (
    lens: ChatLens,
    chatId: ChatEntityId,
    retried: ChatMessage
  ) => {
    const key = toKey(chatId);
    const targetId = toKey(retried.id);
    const list = messagesByChatId.value[key] ?? [];

    const nextList = list.map((m) =>
      toKey(m.id) === targetId ? { ...m, status: 'sent' as const } : m
    );

    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: nextList,
    };

    const lastMsg = nextList[nextList.length - 1];
    const chat = getChatById(lens, chatId);
    if (chat && lastMsg && toKey(lastMsg.id) === targetId) {
      chat.deliveryStatus = 'sent';
    }
  };

  const clearChat = (lens: ChatLens, chatId: ChatEntityId) => {
    const key = toKey(chatId);
    revokeMessageBlobUrls(key);

    messagesByChatId.value = {
      ...messagesByChatId.value,
      [key]: [],
    };

    const chat = getChatById(lens, chatId);
    if (chat) {
      chat.message = 'No messages yet';
      chat.lastMessageKind = 'text';
      chat.lastMessageSenderName = null;
      chat.isLastMessageMine = false;
      chat.deliveryStatus = undefined;
    }
  };

  return {
    // State
    currentUserId,
    currentUserName,
    currentUsername,
    currentUserAvatarUrl,
    connectionStatus,
    contactsByLens,
    chatsByLens,
    profilesByChatId,
    groupsById,
    messagesByChatId,
    blockedChatIds,
    activeCall,
    activeCallDuration,

    // Selectors
    getChats,
    getContacts,
    getChatById,
    getMessages,
    getProfileDetails,
    getGroup,
    getDirectUser,
    isChatBlocked,
    getCallControls,
    getSharedMedia,
    getSharedFiles,
    getUnreadChatsCount,
    getTotalUnreadMessages,
    getExistingDirectChatMap,
    findGroupChatIdByName,
    findContactByUsername,

    // Actions — Chats & Calls
    markChatAsRead,
    togglePin,
    toggleMute,
    setMuted,
    toggleRead,
    toggleBlock,
    toggleCall,
    endActiveCall,
    createChat,
    openOrCreateDirectChat,

    // Actions — Groups
    addMemberToGroup,
    toggleGroupAdmin,
    removeMemberFromGroup,
    leaveGroup,

    // Actions — Messages
    sendMessage,
    receiveIncomingMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    retryMessage,
    clearChat,
  };
});