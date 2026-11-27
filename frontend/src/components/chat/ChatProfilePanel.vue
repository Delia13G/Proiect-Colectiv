<!-- src/components/chat/ChatProfilePanel.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  X,
  Phone,
  Video,
  Bell,
  BellOff,
  Pin,
  PinOff,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Users,
  Image as ImageIcon,
  ImageOff,
  FileText,
  Link2,
  Download,
  Search,
  Ban,
  Trash2,
  LogOut,
  MessageSquare,
  Sparkles,
  UserPlus,
  UserMinus,
  Shield,
  ShieldOff,
  Plus,
  ChevronRight,
  CornerUpRight,
  Loader2,
} from 'lucide-vue-next';
import AppTooltip from '../ui/AppTooltip.vue';
import MediaLightbox, {
  type MediaLightboxItem,
  type MediaLightboxLabels,
} from './MediaLightbox.vue';
import { getAvatarInitials, getAvatarTone } from '../../utils/avatar';
import { getLensTheme } from '../../utils/lensTheme';
import type { ChatLens } from './ChatListView.vue';
import type {
  ActiveCallState,
  CallCapability,
  ChatHeaderCallControls,
  ConnectionStatus,
  PresenceStatus,
} from './ChatHeader.vue';
import type { GroupAvatarMember, GroupHeaderSubject } from './GroupChatHeader.vue';
import type { ChatContact } from './NewChatModal.vue';
import type { ChatMessage, ChatUser } from '../../types/chat';

export type ProfilePanelTab = 'about' | 'members' | 'media' | 'files' | 'links';
export type PaginatedPanelTab = 'media' | 'files' | 'links';

export interface ProfileLink {
  label: string;
  url: string;
}

export interface ChatProfileDetails {
  username?: string;
  bio?: string;
  role?: string;
  organization?: string;
  location?: string;
  verified?: boolean;
  tags?: string[];
  links?: ProfileLink[];
  mutualGroups?: string[];
  /** Specific pentru DATE sau highlight contextual */
  promptQuestion?: string;
  promptAnswer?: string;
  /** Specific pentru grupuri */
  description?: string;
  createdAt?: string;
  adminIds?: string[];
}

export interface SharedFileItem {
  id: string | number;
  url: string;
  fileName: string;
  metaLabel: string;
  timestamp: Date | string | number;
  messageId?: string | number;
}

export interface SharedLinkItem {
  id: string;
  url: string;
  domain: string;
  snippet: string;
  timestamp: Date | string | number;
  messageId?: string | number;
}

export interface ChatProfilePendingActions {
  clear?: boolean;
  leave?: boolean;
  block?: boolean;
}

export interface ChatProfilePanelLabels {
  presence: Record<PresenceStatus, string>;
  groupInfoTitle: string;
  contactInfoTitle: string;
  groupAsideAriaLabel: string;
  contactAsideAriaLabel: string;
  closePanel: string;
  verifiedBadge: string;
  copyUsername: string;
  usernameCopied: string;
  blockedBadge: string;
  call: string;
  inCall: string;
  video: string;
  inVideo: string;
  voiceCallLabel: string;
  videoCallLabel: string;
  returnToVoiceCall: string;
  returnToVideoCall: string;
  callDisabledBlocked: string;
  callDisabledOffline: string;
  callDisabledElsewhere: string;
  callDisabledBusy: string;
  callUnavailable: string;
  mute: string;
  muted: string;
  muteNotifications: string;
  unmuteNotifications: string;
  pin: string;
  pinned: string;
  pinConversation: string;
  unpinConversation: string;
  sectionsAriaLabel: string;
  tabAbout: string;
  tabMembers: string;
  tabMedia: string;
  tabFiles: string;
  tabLinks: string;
  aboutHeading: string;
  defaultBio: (lens: ChatLens) => string;
  skillsHeading: string;
  interestsHeading: string;
  linksHeading: string;
  mutualGroupsHeading: (count: number) => string;
  descriptionHeading: string;
  createdAtPrefix: (date: string) => string;
  filterMembersPlaceholder: string;
  filterMembersAriaLabel: string;
  addMemberTitle: string;
  closeAddMember: string;
  addPeopleHeading: string;
  availableCount: (count: number) => string;
  searchContactsPlaceholder: string;
  searchContactsAriaLabel: string;
  noMatchingPeople: string;
  allContactsInGroup: string;
  you: string;
  adminBadge: string;
  memberLabel: string;
  noMatchingMembers: string;
  makeAdmin: string;
  removeAdmin: string;
  removeFromGroup: string;
  confirmRemove: string;
  messageMember: (name: string) => string;
  noMediaEmpty: string;
  noFilesEmpty: string;
  noLinksEmpty: string;
  loadMore: string;
  loadingMore: string;
  jumpToMessage: string;
  downloadFile: (name: string) => string;
  blockUser: (name: string) => string;
  unblockUser: (name: string) => string;
  clearChatHistory: string;
  confirmClearChat: string;
  leaveGroup: string;
  confirmLeaveGroup: string;
  membersSummary: (total: number, online: number) => string;
  onlineSummary: (online: number) => string;
  lightbox?: Partial<MediaLightboxLabels>;
}

export type ChatProfilePanelLabelOverrides = Partial<
  Omit<ChatProfilePanelLabels, 'presence'>
> & {
  presence?: Partial<Record<PresenceStatus, string>>;
};

const DEFAULT_LABELS: ChatProfilePanelLabels = {
  presence: {
    online: 'Online',
    away: 'Away',
    busy: 'Busy',
    dnd: 'Do not disturb',
    offline: 'Offline',
  },
  groupInfoTitle: 'Group Info',
  contactInfoTitle: 'Contact Info',
  groupAsideAriaLabel: 'Group details',
  contactAsideAriaLabel: 'Contact profile',
  closePanel: 'Close profile panel',
  verifiedBadge: 'Verified account',
  copyUsername: 'Copy username',
  usernameCopied: 'Username copied',
  blockedBadge: 'Blocked',
  call: 'Call',
  inCall: 'In call',
  video: 'Video',
  inVideo: 'In video',
  voiceCallLabel: 'Voice call',
  videoCallLabel: 'Video call',
  returnToVoiceCall: 'Return to voice call',
  returnToVideoCall: 'Return to video call',
  callDisabledBlocked: 'Unblock user to call',
  callDisabledOffline: 'Reconnect to start a call',
  callDisabledElsewhere: 'Active call in another conversation',
  callDisabledBusy: 'Already in a call',
  callUnavailable: 'Calls unavailable',
  mute: 'Mute',
  muted: 'Muted',
  muteNotifications: 'Mute notifications',
  unmuteNotifications: 'Unmute notifications',
  pin: 'Pin',
  pinned: 'Pinned',
  pinConversation: 'Pin conversation',
  unpinConversation: 'Unpin conversation',
  sectionsAriaLabel: 'Profile sections',
  tabAbout: 'About',
  tabMembers: 'Members',
  tabMedia: 'Media',
  tabFiles: 'Files',
  tabLinks: 'Links',
  aboutHeading: 'About',
  defaultBio: (lens) =>
    `Active on Cliq ${lens}. Start collaborating or sharing ideas right in this thread.`,
  skillsHeading: 'Skills & Stack',
  interestsHeading: 'Interests',
  linksHeading: 'Links',
  mutualGroupsHeading: (count) => `Mutual Groups (${count})`,
  descriptionHeading: 'Description',
  createdAtPrefix: (date) => `Created ${date}`,
  filterMembersPlaceholder: 'Filter members...',
  filterMembersAriaLabel: 'Filter group members',
  addMemberTitle: 'Add member to group',
  closeAddMember: 'Close add member picker',
  addPeopleHeading: 'Add people to group',
  availableCount: (count) => `${count} available`,
  searchContactsPlaceholder: 'Search people to add...',
  searchContactsAriaLabel: 'Search contacts to add to group',
  noMatchingPeople: 'No matching people found.',
  allContactsInGroup: 'Everyone from your contacts is already in this group.',
  you: 'You',
  adminBadge: 'Admin',
  memberLabel: 'Member',
  noMatchingMembers: 'No matching members.',
  makeAdmin: 'Make admin',
  removeAdmin: 'Remove admin',
  removeFromGroup: 'Remove from group',
  confirmRemove: 'Confirm',
  messageMember: (name) => `Message ${name}`,
  noMediaEmpty: 'No photos shared in this chat yet.',
  noFilesEmpty: 'No files shared in this chat yet.',
  noLinksEmpty: 'No links shared in this chat yet.',
  loadMore: 'Load more',
  loadingMore: 'Loading...',
  jumpToMessage: 'Jump to message',
  downloadFile: (name) => `Download ${name}`,
  blockUser: (name) => `Block ${name}`,
  unblockUser: (name) => `Unblock ${name}`,
  clearChatHistory: 'Clear chat history',
  confirmClearChat: 'Click again to clear chat',
  leaveGroup: 'Leave group',
  confirmLeaveGroup: 'Click again to leave group',
  membersSummary: (total, online) =>
    `${total} ${total === 1 ? 'member' : 'members'}${online > 0 ? ` · ${online} online` : ''}`,
  onlineSummary: (online) => `${online} online`,
};

export interface ChatProfilePanelProps {
  open: boolean;
  activeLens: ChatLens;
  /** ID unic al conversației (evită resetarea panelului la update-uri de nume/avatar din WebSocket) */
  conversationId?: string | number | null;
  panelId?: string;
  isGroup?: boolean;
  user?: ChatUser | null;
  group?: GroupHeaderSubject | null;
  profile?: ChatProfileDetails | null;
  messages?: ChatMessage[];
  /** Override-uri opționale venite direct din backend pentru conversații paginate */
  mediaItems?: MediaLightboxItem[];
  fileItems?: SharedFileItem[];
  linkItems?: SharedLinkItem[];
  hasMoreMedia?: boolean;
  hasMoreFiles?: boolean;
  hasMoreLinks?: boolean;
  isLoadingMore?: boolean;
  canJumpToMessage?: boolean;
  /** Lista de contacte disponibile pentru picker-ul inline de "Add member" */
  availableContacts?: ChatContact[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatarUrl?: string | null;
  initialTab?: ProfilePanelTab;
  calls?: ChatHeaderCallControls;
  connectionStatus?: ConnectionStatus;
  isMuted?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
  pendingActions?: ChatProfilePendingActions;
  pendingMemberIds?: Array<string | number>;
  locale?: string;
  labels?: ChatProfilePanelLabelOverrides;
}

const CONFIRM_RESET_MS = 4000;
let panelInstanceSeq = 0;

const props = withDefaults(defineProps<ChatProfilePanelProps>(), {
  conversationId: null,
  panelId: undefined,
  isGroup: false,
  user: null,
  group: null,
  profile: null,
  messages: () => [],
  mediaItems: undefined,
  fileItems: undefined,
  linkItems: undefined,
  hasMoreMedia: false,
  hasMoreFiles: false,
  hasMoreLinks: false,
  isLoadingMore: false,
  canJumpToMessage: false,
  availableContacts: () => [],
  currentUserId: 'me',
  currentUserName: '',
  currentUserAvatarUrl: null,
  initialTab: 'about',
  calls: () => ({}),
  connectionStatus: 'connected',
  isMuted: false,
  isPinned: false,
  isBlocked: false,
  pendingActions: () => ({}),
  pendingMemberIds: () => [],
  locale: undefined,
  labels: () => ({}),
});

const emit = defineEmits<{
  close: [];
  'voice-call': [];
  'video-call': [];
  'toggle-mute': [];
  'toggle-pin': [];
  'toggle-block': [];
  'clear-chat': [];
  'leave-group': [];
  'add-member': [contact: ChatContact];
  'toggle-admin': [memberId: string];
  'remove-member': [memberId: string];
  'open-mutual-group': [groupName: string];
  'message-member': [member: { id: string; name: string; avatarUrl?: string | null }];
  'jump-to-message': [messageId: string | number];
  'load-more': [tab: PaginatedPanelTab];
}>();

const instanceId = ++panelInstanceSeq;
const getTabId = (tab: ProfilePanelTab) => `profile-tab-${instanceId}-${tab}`;
const getTabPanelId = (tab: ProfilePanelTab) => `profile-tabpanel-${instanceId}-${tab}`;

const t = computed<ChatProfilePanelLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
  presence: {
    ...DEFAULT_LABELS.presence,
    ...props.labels?.presence,
  },
}));

const lensTheme = computed(() => getLensTheme(props.activeLens));

// ==========================================
// 1. HELPERE SECURITATE URL, TEXT & SCROLL LOCK
// ==========================================
const normalizeUrl = (url?: string | null): string | null => {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
};

const sanitizeSafeUrl = (
  raw: string | null | undefined,
  options: { allowMailto?: boolean; allowBlob?: boolean; allowRelative?: boolean } = {}
): string | null => {
  const trimmed = raw?.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;

  if (options.allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:' || protocol === 'http:') return parsed.href;
    if (options.allowMailto && protocol === 'mailto:') return parsed.href;
    if (options.allowBlob && protocol === 'blob:') return trimmed;
    return null;
  } catch {
    return null;
  }
};

const trimTrailingUrlPunctuation = (rawUrl: string): string => {
  let url = rawUrl;
  while (url.length > 0) {
    const last = url[url.length - 1];
    if (!last) break;
    if (/[.,;:!?"'`<>]/.test(last)) {
      url = url.slice(0, -1);
      continue;
    }
    if (last === ')' || last === ']' || last === '}') {
      const openChar = last === ')' ? '(' : last === ']' ? '[' : '{';
      const opens = url.split(openChar).length - 1;
      const closes = url.split(last).length - 1;
      if (closes > opens) {
        url = url.slice(0, -1);
        continue;
      }
    }
    break;
  }
  return url;
};

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const foldText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const acquireScrollLock = () => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const count = Number(body.dataset.scrollLockCount ?? '0');
  if (count === 0) {
    body.dataset.scrollLockPrevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
  }
  body.dataset.scrollLockCount = String(count + 1);
};

const releaseScrollLock = () => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const count = Math.max(0, Number(body.dataset.scrollLockCount ?? '0') - 1);
  if (count === 0) {
    body.style.overflow = body.dataset.scrollLockPrevOverflow ?? '';
    delete body.dataset.scrollLockCount;
    delete body.dataset.scrollLockPrevOverflow;
  } else {
    body.dataset.scrollLockCount = String(count);
  }
};

// ==========================================
// 2. OVERLAY DRAWER (< xl) vs SIDEBAR (>= xl)
// ==========================================
const panelAsideRef = ref<HTMLElement | null>(null);
const closePanelBtnRef = ref<HTMLButtonElement | null>(null);
const isOverlayViewport = ref(false);
let overlayMediaQuery: MediaQueryList | null = null;
let hasDrawerScrollLock = false;
let previouslyFocusedBeforeDrawer: HTMLElement | null = null;

const updateOverlayViewport = (event: MediaQueryListEvent) => {
  isOverlayViewport.value = event.matches;
};

const syncDrawerScrollLock = () => {
  const shouldLock = props.open && isOverlayViewport.value;
  if (shouldLock && !hasDrawerScrollLock) {
    acquireScrollLock();
    hasDrawerScrollLock = true;
  } else if (!shouldLock && hasDrawerScrollLock) {
    releaseScrollLock();
    hasDrawerScrollLock = false;
  }
};

// ==========================================
// 3. IDENTITATE, TAB-URI & STĂRI LOCALE
// ==========================================
const activeTab = ref<ProfilePanelTab>(props.initialTab);
const tabButtonRefs = new Map<ProfilePanelTab, HTMLButtonElement>();
const memberSearchQuery = ref('');
const isAddMemberOpen = ref(false);
const addMemberSearchQuery = ref('');
const addMemberInputRef = ref<HTMLInputElement | null>(null);

const avatarFailed = ref(false);
const failedMemberAvatars = ref<Set<string>>(new Set());
const failedMediaIds = ref<Set<string>>(new Set());

const copiedHandle = ref(false);
const liveAnnouncement = ref('');
let copyTimer: ReturnType<typeof setTimeout> | null = null;

// Confirmări în 2 pași cu auto-reset după 4s
const confirmClear = ref(false);
const confirmLeave = ref(false);
const confirmRemoveMemberId = ref<string | null>(null);
let confirmResetTimer: ReturnType<typeof setTimeout> | null = null;

const hasActiveConfirmation = computed(
  () => confirmClear.value || confirmLeave.value || confirmRemoveMemberId.value !== null
);

// Index Lightbox delegat către MediaLightbox.vue
const lightboxIndex = ref<number | null>(null);

const setTabButtonRef = (tab: ProfilePanelTab, el: unknown) => {
  if (el instanceof HTMLButtonElement) tabButtonRefs.set(tab, el);
  else tabButtonRefs.delete(tab);
};

const clearConfirmTimer = () => {
  if (confirmResetTimer !== null) {
    clearTimeout(confirmResetTimer);
    confirmResetTimer = null;
  }
};

const resetConfirmations = () => {
  confirmClear.value = false;
  confirmLeave.value = false;
  confirmRemoveMemberId.value = null;
  clearConfirmTimer();
};

const scheduleConfirmationReset = () => {
  clearConfirmTimer();
  confirmResetTimer = setTimeout(() => {
    confirmClear.value = false;
    confirmLeave.value = false;
    confirmRemoveMemberId.value = null;
    confirmResetTimer = null;
  }, CONFIRM_RESET_MS);
};

const isConnected = computed(() => props.connectionStatus === 'connected');

const displayName = computed(() =>
  props.isGroup
    ? (props.group?.name?.trim() || 'Group')
    : (props.user?.name?.trim() || 'User')
);

const displayAvatar = computed(() =>
  props.isGroup
    ? normalizeUrl(props.group?.avatarUrl)
    : normalizeUrl(props.user?.avatar)
);

// Afișăm handle-ul doar dacă există real în profil (nu fabricăm handle-uri false)
const resolvedUsername = computed(() => {
  if (props.isGroup) return '';
  return props.profile?.username?.trim().replace(/^@/, '') ?? '';
});

const resolvedCurrentUserName = computed(
  () => props.currentUserName.trim() || t.value.you
);
const resolvedCurrentUserAvatar = computed(() => normalizeUrl(props.currentUserAvatarUrl));

const normalizedUserPresence = computed<PresenceStatus | null>(() => {
  const raw = props.user?.status?.trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'online') return 'online';
  if (raw === 'away' || raw === 'idle') return 'away';
  if (raw === 'busy') return 'busy';
  if (raw === 'dnd' || raw.includes('disturb')) return 'dnd';
  if (raw === 'offline') return 'offline';
  return null;
});

const statusDotClass = computed(() => {
  if (!isConnected.value) return 'bg-slate-500';
  switch (normalizedUserPresence.value) {
    case 'online':
      return 'bg-emerald-500';
    case 'away':
      return 'bg-amber-400';
    case 'busy':
    case 'dnd':
      return 'bg-rose-500';
    default:
      return 'bg-slate-500';
  }
});

// Deduplicare membri + excludere currentUserId (evită duplicarea rândului "You")
const otherGroupMembers = computed<GroupAvatarMember[]>(() => {
  const list = props.group?.members ?? [];
  const currentId = String(props.currentUserId);
  const seen = new Set<string>();
  const result: GroupAvatarMember[] = [];

  for (const member of list) {
    const id = String(member.id);
    if (!id || id === currentId || seen.has(id)) continue;
    seen.add(id);
    result.push(member);
  }
  return result;
});

// Distinge explicit între număr de membri necunoscut (null) vs cunoscut
const safeGroupMembersCount = computed<number | null>(() => {
  if (!props.group) return null;
  if (typeof props.group.membersCount === 'number' && Number.isFinite(props.group.membersCount)) {
    return Math.max(0, Math.floor(props.group.membersCount));
  }
  if (props.group.members !== undefined) {
    return otherGroupMembers.value.length + 1;
  }
  return null;
});

const safeGroupOnlineCount = computed(() => {
  const raw = props.group?.onlineCount;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return 0;
  const count = Math.floor(raw);
  return safeGroupMembersCount.value !== null
    ? Math.min(count, safeGroupMembersCount.value)
    : count;
});

const subtitleText = computed(() => {
  if (props.isGroup) {
    if (safeGroupMembersCount.value !== null) {
      return t.value.membersSummary(safeGroupMembersCount.value, safeGroupOnlineCount.value);
    }
    return safeGroupOnlineCount.value > 0 ? t.value.onlineSummary(safeGroupOnlineCount.value) : '';
  }

  if (normalizedUserPresence.value) {
    return t.value.presence[normalizedUserPresence.value];
  }
  return props.user?.status?.trim() || t.value.presence.offline;
});

// Cheie stabilă de conversație (preferă conversationId, cu fallback sigur pentru DM-uri)
const conversationKey = computed(() => {
  if (props.conversationId !== null && props.conversationId !== undefined) {
    return `${props.isGroup ? 'g' : 'd'}:${String(props.conversationId)}`;
  }
  if (props.isGroup) {
    return `g:${String(props.group?.id ?? '')}`;
  }
  const userWithOptionalId = props.user as (ChatUser & { id?: string | number }) | null;
  const fallbackDmId =
    userWithOptionalId?.id !== undefined && userWithOptionalId?.id !== null
      ? String(userWithOptionalId.id)
      : resolvedUsername.value || props.user?.name?.trim() || '';
  return `d:${fallbackDmId}`;
});

const resetTransientStates = () => {
  resetConfirmations();
  memberSearchQuery.value = '';
  isAddMemberOpen.value = false;
  addMemberSearchQuery.value = '';
  failedMemberAvatars.value = new Set();
  failedMediaIds.value = new Set();
  lightboxIndex.value = null;
};

watch(displayAvatar, () => {
  avatarFailed.value = false;
});

watch(
  () => props.connectionStatus,
  (nextStatus, prevStatus) => {
    if (nextStatus === 'connected' && prevStatus && prevStatus !== 'connected') {
      avatarFailed.value = false;
      failedMemberAvatars.value = new Set();
      failedMediaIds.value = new Set();
    }
  }
);

watch(
  () => [props.open, props.initialTab, props.isGroup] as const,
  ([isOpen, nextTab, isGroupMode], prev) => {
    syncDrawerScrollLock();

    const wasOpen = Boolean(prev?.[0]);

    if (!isOpen) {
      resetTransientStates();
      if (wasOpen && isOverlayViewport.value && previouslyFocusedBeforeDrawer) {
        const toRestore = previouslyFocusedBeforeDrawer;
        previouslyFocusedBeforeDrawer = null;
        nextTick(() => {
          if (typeof document !== 'undefined' && document.contains(toRestore)) {
            toRestore.focus();
          }
        });
      }
      return;
    }

    if (isGroupMode && nextTab === 'about') {
      activeTab.value = 'members';
    } else if (!isGroupMode && nextTab === 'members') {
      activeTab.value = 'about';
    } else {
      activeTab.value = nextTab;
    }

    if (!wasOpen && isOverlayViewport.value && typeof document !== 'undefined') {
      previouslyFocusedBeforeDrawer =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      nextTick(() => closePanelBtnRef.value?.focus());
    }
  },
  { immediate: true }
);

watch(isOverlayViewport, syncDrawerScrollLock);

watch(activeTab, () => {
  resetConfirmations();
  isAddMemberOpen.value = false;
  addMemberSearchQuery.value = '';
});

watch(conversationKey, () => {
  resetTransientStates();
  avatarFailed.value = false;
  if (props.isGroup && activeTab.value === 'about') {
    activeTab.value = 'members';
  } else if (!props.isGroup && activeTab.value === 'members') {
    activeTab.value = 'about';
  }
});

// ==========================================
// 4. LOGICĂ APELURI ALINIATĂ CU ChatHeader
// ==========================================
const isBlockedDM = computed(() => !props.isGroup && props.isBlocked);

const voiceCapability = computed<CallCapability>(
  () => props.calls.voice ?? { status: 'available' }
);
const videoCapability = computed<CallCapability>(
  () => props.calls.video ?? { status: 'available' }
);
const activeCall = computed<ActiveCallState>(
  () => props.calls.activeCall ?? { status: 'idle' }
);

const showVoiceCall = computed(() => voiceCapability.value.status !== 'hidden');
const showVideoCall = computed(() => videoCapability.value.status !== 'hidden');

const isActiveVoiceHere = computed(
  () =>
    activeCall.value.status === 'active' &&
    activeCall.value.type === 'voice' &&
    activeCall.value.inCurrentChat
);
const isActiveVideoHere = computed(
  () =>
    activeCall.value.status === 'active' &&
    activeCall.value.type === 'video' &&
    activeCall.value.inCurrentChat
);
const hasActiveCallElsewhere = computed(
  () => activeCall.value.status === 'active' && !activeCall.value.inCurrentChat
);
const currentCallDuration = computed(() =>
  activeCall.value.status === 'active' && activeCall.value.inCurrentChat
    ? (activeCall.value.duration?.trim() || null)
    : null
);

const isVoiceDisabled = computed(() => {
  if (isActiveVoiceHere.value) return false;
  return (
    isBlockedDM.value ||
    voiceCapability.value.status === 'disabled' ||
    hasActiveCallElsewhere.value ||
    isActiveVideoHere.value ||
    !isConnected.value
  );
});

const isVideoDisabled = computed(() => {
  if (isActiveVideoHere.value) return false;
  return (
    isBlockedDM.value ||
    videoCapability.value.status === 'disabled' ||
    hasActiveCallElsewhere.value ||
    isActiveVoiceHere.value ||
    !isConnected.value
  );
});

const voiceTooltipText = computed(() => {
  if (isActiveVoiceHere.value) {
    return currentCallDuration.value
      ? `${t.value.returnToVoiceCall} (${currentCallDuration.value})`
      : t.value.returnToVoiceCall;
  }
  if (isBlockedDM.value) return t.value.callDisabledBlocked;
  if (voiceCapability.value.status === 'disabled') {
    return voiceCapability.value.reason?.trim() || t.value.callUnavailable;
  }
  if (hasActiveCallElsewhere.value) return t.value.callDisabledElsewhere;
  if (isActiveVideoHere.value) return t.value.callDisabledBusy;
  if (!isConnected.value) return t.value.callDisabledOffline;
  return t.value.voiceCallLabel;
});

const videoTooltipText = computed(() => {
  if (isActiveVideoHere.value) {
    return currentCallDuration.value
      ? `${t.value.returnToVideoCall} (${currentCallDuration.value})`
      : t.value.returnToVideoCall;
  }
  if (isBlockedDM.value) return t.value.callDisabledBlocked;
  if (videoCapability.value.status === 'disabled') {
    return videoCapability.value.reason?.trim() || t.value.callUnavailable;
  }
  if (hasActiveCallElsewhere.value) return t.value.callDisabledElsewhere;
  if (isActiveVoiceHere.value) return t.value.callDisabledBusy;
  if (!isConnected.value) return t.value.callDisabledOffline;
  return t.value.videoCallLabel;
});

const onVoiceCallClick = () => {
  if (isVoiceDisabled.value) return;
  emit('voice-call');
};

const onVideoCallClick = () => {
  if (isVideoDisabled.value) return;
  emit('video-call');
};

const quickActionColsClass = computed(() => {
  const count = 2 + Number(showVoiceCall.value) + Number(showVideoCall.value);
  if (count === 4) return 'grid-cols-4';
  if (count === 3) return 'grid-cols-3';
  return 'grid-cols-2';
});

// ==========================================
// 5. PROFIL LINKS SANITIZATE + MEDIA / FILES / LINKS
// ==========================================
const safeProfileLinks = computed<ProfileLink[]>(() => {
  const list = props.profile?.links ?? [];
  const seen = new Set<string>();
  const result: ProfileLink[] = [];
  for (const item of list) {
    const safeUrl = sanitizeSafeUrl(item.url, { allowMailto: true });
    if (!safeUrl || seen.has(safeUrl)) continue;
    seen.add(safeUrl);
    result.push({ label: item.label.trim() || safeUrl, url: safeUrl });
  }
  return result;
});

const getFileName = (msg: ChatMessage): string => {
  if (msg.fileName) return msg.fileName;
  if (!msg.attachment) return 'Attachment';
  const raw = msg.attachment.split(/[?#]/)[0]?.split('/').pop() ?? 'Attachment';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const getFileMeta = (msg: ChatMessage): string => {
  const name = getFileName(msg);
  const ext = name.includes('.')
    ? (name.split('.').pop() ?? 'FILE').slice(0, 6).toUpperCase()
    : 'FILE';
  const size = msg.fileSize;
  let formattedSize = '';
  if (typeof size === 'number' && Number.isFinite(size)) {
    formattedSize =
      size < 1024
        ? `${size} B`
        : size < 1024 * 1024
          ? `${(size / 1024).toFixed(1)} KB`
          : `${(size / (1024 * 1024)).toFixed(1)} MB`;
  } else if (typeof size === 'string') {
    formattedSize = size;
  }
  return formattedSize ? `${ext} · ${formattedSize}` : ext;
};

const sharedMedia = computed<MediaLightboxItem[]>(() => {
  if (props.mediaItems !== undefined) {
    return props.mediaItems.reduce<MediaLightboxItem[]>((acc, item) => {
      const safeSrc = sanitizeSafeUrl(item.src, { allowBlob: true, allowRelative: true });
      if (!safeSrc) return acc;
      acc.push({ ...item, src: safeSrc });
      return acc;
    }, []);
  }

  const derived: MediaLightboxItem[] = [];
  for (let i = props.messages.length - 1; i >= 0; i--) {
    const msg = props.messages[i];
    if (!msg || msg.isDeleted || msg.type !== 'image' || !msg.attachment) continue;
    const safeSrc = sanitizeSafeUrl(msg.attachment, { allowBlob: true, allowRelative: true });
    if (!safeSrc) continue;

    derived.push({
      id: msg.id,
      src: safeSrc,
      alt: msg.text || 'Shared photo',
      caption: msg.text || null,
      fileName: msg.fileName || null,
      timestamp: msg.timestamp,
      messageId: msg.id,
    });
  }
  return derived;
});

const sharedFiles = computed<SharedFileItem[]>(() => {
  if (props.fileItems !== undefined) {
    return props.fileItems.reduce<SharedFileItem[]>((acc, item) => {
      const safeUrl = sanitizeSafeUrl(item.url, { allowBlob: true, allowRelative: true });
      if (!safeUrl) return acc;
      acc.push({ ...item, url: safeUrl });
      return acc;
    }, []);
  }

  const derived: SharedFileItem[] = [];
  for (let i = props.messages.length - 1; i >= 0; i--) {
    const msg = props.messages[i];
    if (!msg || msg.isDeleted || msg.type !== 'file' || !msg.attachment) continue;
    const safeUrl = sanitizeSafeUrl(msg.attachment, { allowBlob: true, allowRelative: true });
    if (!safeUrl) continue;

    derived.push({
      id: msg.id,
      url: safeUrl,
      fileName: getFileName(msg),
      metaLabel: getFileMeta(msg),
      timestamp: msg.timestamp,
      messageId: msg.id,
    });
  }
  return derived;
});

const sharedLinks = computed<SharedLinkItem[]>(() => {
  if (props.linkItems !== undefined) {
    return props.linkItems.reduce<SharedLinkItem[]>((acc, item) => {
      const safeUrl = sanitizeSafeUrl(item.url);
      if (!safeUrl) return acc;
      acc.push({ ...item, url: safeUrl });
      return acc;
    }, []);
  }

  const results: SharedLinkItem[] = [];
  const seen = new Set<string>();
  const urlRegex = /https?:\/\/[^\s<>"'`]+/g;

  for (let i = props.messages.length - 1; i >= 0; i--) {
    const msg = props.messages[i];
    if (!msg || msg.isDeleted || !msg.text) continue;

    const matches = msg.text.match(urlRegex);
    if (!matches) continue;

    const compactText = collapseWhitespace(msg.text);
    const snippet = compactText.length > 90 ? `${compactText.slice(0, 90)}…` : compactText;

    for (const rawMatch of matches) {
      const cleanUrl = sanitizeSafeUrl(trimTrailingUrlPunctuation(rawMatch));
      if (!cleanUrl || seen.has(cleanUrl)) continue;
      seen.add(cleanUrl);

      let domain = cleanUrl;
      try {
        domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
      } catch {
        // Fallback pe URL-ul brut
      }

      results.push({
        id: `${msg.id}-${cleanUrl}`,
        url: cleanUrl,
        domain,
        snippet,
        timestamp: msg.timestamp,
        messageId: msg.id,
      });
    }
  }

  return results;
});

const markMediaFailed = (id: string | number) => {
  const key = String(id);
  if (failedMediaIds.value.has(key)) return;
  const next = new Set(failedMediaIds.value);
  next.add(key);
  failedMediaIds.value = next;
};

// ==========================================
// 6. MEMBRI GRUP, PERMISIUNI ADMIN & PICKER INLINE
// ==========================================
const pendingMemberSet = computed(() => new Set(props.pendingMemberIds.map((id) => String(id))));

const isMemberPending = (memberId: string | number) =>
  pendingMemberSet.value.has(String(memberId));

const isGroupAdmin = (memberId: string | number): boolean =>
  Boolean(props.profile?.adminIds?.some((id) => String(id) === String(memberId)));

const isCurrentUserAdmin = computed(() => isGroupAdmin(props.currentUserId));

watch(isCurrentUserAdmin, (isAdmin) => {
  if (!isAdmin) {
    isAddMemberOpen.value = false;
    addMemberSearchQuery.value = '';
    confirmRemoveMemberId.value = null;
  }
});

const foldedMemberQuery = computed(() => foldText(memberSearchQuery.value.trim()));
const foldedAddMemberQuery = computed(() => foldText(addMemberSearchQuery.value.trim()));

const showCurrentUserRow = computed(() => {
  const q = foldedMemberQuery.value;
  if (!q) return true;
  return (
    foldText(t.value.you).includes(q) ||
    foldText(resolvedCurrentUserName.value).includes(q) ||
    (isCurrentUserAdmin.value && foldText(t.value.adminBadge).includes(q))
  );
});

const filteredMembers = computed<GroupAvatarMember[]>(() => {
  const q = foldedMemberQuery.value;
  const matched = q
    ? otherGroupMembers.value.filter((m) => foldText(m.name).includes(q))
    : [...otherGroupMembers.value];

  return matched.sort((a, b) => {
    const aAdmin = isGroupAdmin(a.id) ? 1 : 0;
    const bAdmin = isGroupAdmin(b.id) ? 1 : 0;
    if (aAdmin !== bAdmin) return bAdmin - aAdmin;
    return a.name.localeCompare(b.name, props.locale);
  });
});

// Filtrare strict după ID (două persoane cu același nume nu se blochează reciproc)
const existingMemberIds = computed(() => {
  const ids = new Set<string>([String(props.currentUserId)]);
  for (const m of otherGroupMembers.value) {
    ids.add(String(m.id));
  }
  return ids;
});

const addableContacts = computed<ChatContact[]>(() => {
  const ids = existingMemberIds.value;
  const q = foldedAddMemberQuery.value;

  return props.availableContacts.filter((c) => {
    if (ids.has(String(c.id))) return false;
    if (!q) return true;
    return (
      foldText(c.name).includes(q) ||
      foldText(`@${c.username}`).includes(q) ||
      (c.role ? foldText(c.role).includes(q) : false)
    );
  });
});

const getMemberAvatarKey = (id: string | number, avatarUrl: string | null) =>
  `${String(id)}:${avatarUrl ?? ''}`;

const hasValidMemberAvatar = (id: string | number, rawUrl?: string | null): boolean => {
  const url = normalizeUrl(rawUrl);
  return Boolean(url) && !failedMemberAvatars.value.has(getMemberAvatarKey(id, url));
};

const markMemberAvatarFailed = (id: string | number, rawUrl?: string | null) => {
  const key = getMemberAvatarKey(id, normalizeUrl(rawUrl));
  if (failedMemberAvatars.value.has(key)) return;
  const next = new Set(failedMemberAvatars.value);
  next.add(key);
  failedMemberAvatars.value = next;
};

const toggleAddMemberPicker = () => {
  if (!isCurrentUserAdmin.value) return;
  isAddMemberOpen.value = !isAddMemberOpen.value;
  addMemberSearchQuery.value = '';
  if (isAddMemberOpen.value) {
    nextTick(() => addMemberInputRef.value?.focus());
  }
};

const handleSelectMemberToAdd = (contact: ChatContact) => {
  if (!isCurrentUserAdmin.value || isMemberPending(contact.id)) return;
  emit('add-member', contact);
};

const handleToggleAdminClick = (memberId: string | number) => {
  if (!isCurrentUserAdmin.value || isMemberPending(memberId)) return;
  resetConfirmations();
  emit('toggle-admin', String(memberId));
};

const handleRemoveMemberClick = (memberId: string | number) => {
  if (!isCurrentUserAdmin.value || isMemberPending(memberId)) return;
  const idStr = String(memberId);
  if (confirmRemoveMemberId.value !== idStr) {
    confirmRemoveMemberId.value = idStr;
    confirmClear.value = false;
    confirmLeave.value = false;
    scheduleConfirmationReset();
    return;
  }
  resetConfirmations();
  emit('remove-member', idStr);
};

// ==========================================
// 7. FORMATARE DATE, CLIPBOARD, ACȚIUNI & TASTATURĂ
// ==========================================
const shortDateFormatter = computed(() => {
  try {
    return new Intl.DateTimeFormat(props.locale || undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  }
});

const formatShortDate = (dateInput: Date | string | number): string => {
  const d = new Date(dateInput);
  return Number.isNaN(d.getTime()) ? '' : shortDateFormatter.value.format(d);
};

const copyUsername = async () => {
  if (!resolvedUsername.value || typeof navigator === 'undefined' || !navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(`@${resolvedUsername.value}`);
    copiedHandle.value = true;
    liveAnnouncement.value = '';
    await nextTick();
    liveAnnouncement.value = t.value.usernameCopied;

    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copiedHandle.value = false;
      liveAnnouncement.value = '';
      copyTimer = null;
    }, 1800);
  } catch {
    // Clipboard indisponibil
  }
};

const handleBlockClick = () => {
  if (props.pendingActions.block) return;
  emit('toggle-block');
};

const handleClearClick = () => {
  if (props.pendingActions.clear) return;
  if (!confirmClear.value) {
    confirmClear.value = true;
    confirmLeave.value = false;
    confirmRemoveMemberId.value = null;
    scheduleConfirmationReset();
    return;
  }
  resetConfirmations();
  emit('clear-chat');
};

const handleLeaveClick = () => {
  if (props.pendingActions.leave) return;
  if (!confirmLeave.value) {
    confirmLeave.value = true;
    confirmClear.value = false;
    confirmRemoveMemberId.value = null;
    scheduleConfirmationReset();
    return;
  }
  resetConfirmations();
  emit('leave-group');
};

const tabs = computed<Array<{ id: ProfilePanelTab; label: string; count?: number }>>(() => {
  const primaryTab = props.isGroup
    ? {
        id: 'members' as const,
        label: t.value.tabMembers,
        count: safeGroupMembersCount.value ?? undefined,
      }
    : { id: 'about' as const, label: t.value.tabAbout };

  return [
    primaryTab,
    { id: 'media', label: t.value.tabMedia, count: sharedMedia.value.length },
    { id: 'files', label: t.value.tabFiles, count: sharedFiles.value.length },
    { id: 'links', label: t.value.tabLinks, count: sharedLinks.value.length },
  ];
});

const onTabKeyDown = (event: KeyboardEvent, index: number) => {
  const list = tabs.value;
  if (list.length === 0) return;

  let nextIdx: number | null = null;
  if (event.key === 'ArrowRight') nextIdx = (index + 1) % list.length;
  else if (event.key === 'ArrowLeft') nextIdx = (index - 1 + list.length) % list.length;
  else if (event.key === 'Home') nextIdx = 0;
  else if (event.key === 'End') nextIdx = list.length - 1;

  if (nextIdx === null) return;
  const targetTab = list[nextIdx];
  if (!targetTab) return;

  event.preventDefault();
  activeTab.value = targetTab.id;
  tabButtonRefs.get(targetTab.id)?.focus();
};

const getDrawerFocusableElements = (): HTMLElement[] => {
  const root = panelAsideRef.value;
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.getClientRects().length > 0);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.open || event.defaultPrevented) return;
  // MediaLightbox își gestionează propriile taste când este deschis
  if (lightboxIndex.value !== null) return;

  // Ignoră dacă există un alt modal/dialog deschis peste panou
  if (typeof document !== 'undefined') {
    const openModals = document.querySelectorAll('[aria-modal="true"], dialog[open]');
    for (const modal of openModals) {
      if (modal !== panelAsideRef.value) return;
    }
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    if (hasActiveConfirmation.value) {
      resetConfirmations();
    } else if (isAddMemberOpen.value) {
      isAddMemberOpen.value = false;
      addMemberSearchQuery.value = '';
    } else {
      emit('close');
    }
    return;
  }

  // Focus trap în modul overlay drawer (< xl)
  if (event.key === 'Tab' && isOverlayViewport.value) {
    const focusables = getDrawerFocusableElements();
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !panelAsideRef.value?.contains(active)) {
        event.preventDefault();
        last?.focus();
      }
    } else if (!active || active === last || !panelAsideRef.value?.contains(active)) {
      event.preventDefault();
      first?.focus();
    }
  }
};

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    overlayMediaQuery = window.matchMedia('(max-width: 1279px)');
    isOverlayViewport.value = overlayMediaQuery.matches;
    overlayMediaQuery.addEventListener?.('change', updateOverlayViewport);
    syncDrawerScrollLock();

    if (props.open && isOverlayViewport.value) {
      previouslyFocusedBeforeDrawer =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      nextTick(() => closePanelBtnRef.value?.focus());
    }
  }
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  overlayMediaQuery?.removeEventListener?.('change', updateOverlayViewport);
  document.removeEventListener('keydown', handleKeyDown);
  clearConfirmTimer();
  if (copyTimer) clearTimeout(copyTimer);
  if (hasDrawerScrollLock) {
    releaseScrollLock();
    hasDrawerScrollLock = false;
  }
});
</script>

<template>
  <transition name="panel-slide">
    <div
      v-if="open"
      class="absolute inset-0 z-40 flex justify-end xl:static xl:z-auto xl:inset-auto xl:h-full xl:shrink-0"
    >
      <!-- Backdrop click-to-close pe ecrane < xl -->
      <div
        class="flex-1 bg-slate-950/60 backdrop-blur-[2px] xl:hidden"
        aria-hidden="true"
        @click="emit('close')"
      />

      <!-- PANOU PRINCIPAL DE PROFIL / GRUP -->
      <aside
        :id="panelId"
        ref="panelAsideRef"
        :role="isOverlayViewport ? 'dialog' : 'complementary'"
        :aria-modal="isOverlayViewport ? 'true' : undefined"
        :aria-label="isGroup ? t.groupAsideAriaLabel : t.contactAsideAriaLabel"
        class="w-full sm:w-80 2xl:w-[348px] h-full bg-slate-900/95 xl:bg-slate-900/60 backdrop-blur-xl border-l border-white/10 flex flex-col min-h-0 overflow-hidden shadow-2xl xl:shadow-none"
      >
        <!-- HEADER PANOU (relative z-20 pentru ca tooltip-ul Close să stea mereu deasupra hero bannerului) -->
        <header class="relative z-20 h-[68px] px-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 class="text-sm font-bold text-white tracking-wide">
            {{ isGroup ? t.groupInfoTitle : t.contactInfoTitle }}
          </h2>
          <AppTooltip :text="t.closePanel" shortcut="Esc" align="right">
            <button
              ref="closePanelBtnRef"
              type="button"
              @click="emit('close')"
              class="min-w-[44px] min-h-[44px] md:min-w-[34px] md:min-h-[34px] -mr-1.5 md:mr-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              :aria-label="t.closePanel"
            >
              <X :size="18" aria-hidden="true" />
            </button>
          </AppTooltip>
        </header>

        <!-- CORP SCROLLABIL -->
        <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col">
          <!-- HERO CARD -->
          <div class="relative px-5 pt-6 pb-5 border-b border-white/10 text-center">
            <div
              class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b pointer-events-none"
              :class="lensTheme.banner"
              aria-hidden="true"
            />

            <!-- Avatar Mare -->
            <div class="relative inline-flex mb-3">
              <div
                class="w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-xl flex items-center justify-center text-xl font-bold"
                :class="
                  displayAvatar && !avatarFailed
                    ? 'bg-slate-800 border-white/15'
                    : `${getAvatarTone(displayName).surface} ${getAvatarTone(displayName).border}`
                "
              >
                <img
                  v-if="displayAvatar && !avatarFailed"
                  :key="displayAvatar"
                  :src="displayAvatar"
                  referrerpolicy="no-referrer"
                  @error="avatarFailed = true"
                  :alt="displayName"
                  draggable="false"
                  class="w-full h-full object-cover"
                />
                <span v-else aria-hidden="true">{{ getAvatarInitials(displayName, 2) || '?' }}</span>
              </div>

              <span
                v-if="!isGroup"
                class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-slate-900 transition-colors duration-300"
                :class="statusDotClass"
                aria-hidden="true"
              />
            </div>

            <!-- Nume + Verified (strict pe profile.verified) -->
            <div class="flex items-center justify-center gap-1.5">
              <h3 class="text-base font-bold text-white truncate max-w-[230px]" :title="displayName">
                {{ displayName }}
              </h3>
              <AppTooltip v-if="!isGroup && profile?.verified" :text="t.verifiedBadge">
                <span class="inline-flex shrink-0" :aria-label="t.verifiedBadge">
                  <ShieldCheck :size="15" :class="lensTheme.text" aria-hidden="true" />
                </span>
              </AppTooltip>
            </div>

            <!-- Handle click-to-copy (doar când există username real) -->
            <AppTooltip
              v-if="!isGroup && resolvedUsername"
              :text="copiedHandle ? t.usernameCopied : t.copyUsername"
            >
              <button
                type="button"
                @click="copyUsername"
                class="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                :aria-label="copiedHandle ? t.usernameCopied : `${t.copyUsername} @${resolvedUsername}`"
              >
                <span>@{{ resolvedUsername }}</span>
                <Check v-if="copiedHandle" :size="12" class="text-emerald-400" aria-hidden="true" />
                <Copy v-else :size="11" class="opacity-60" aria-hidden="true" />
              </button>
            </AppTooltip>

            <span class="sr-only" aria-live="polite" aria-atomic="true">
              {{ liveAnnouncement }}
            </span>

            <p v-if="subtitleText" class="mt-1 text-xs font-medium text-slate-400">
              {{ subtitleText }}
            </p>

            <!-- Badge Blocked -->
            <span
              v-if="isBlockedDM"
              class="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[11px] font-semibold text-rose-300"
            >
              <Ban :size="11" aria-hidden="true" />
              {{ t.blockedBadge }}
            </span>

            <!-- BARĂ ACȚIUNI RAPIDE -->
            <div class="mt-5 grid gap-2" :class="quickActionColsClass">
              <AppTooltip v-if="showVoiceCall" :text="voiceTooltipText" align="left">
                <button
                  type="button"
                  :aria-disabled="isVoiceDisabled ? 'true' : undefined"
                  :aria-pressed="isActiveVoiceHere"
                  @click="onVoiceCallClick"
                  class="w-full flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  :class="
                    isVoiceDisabled
                      ? 'opacity-35 cursor-not-allowed bg-slate-800/60 border-white/5 text-slate-400'
                      : isActiveVoiceHere
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 cursor-pointer'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-white/5 text-slate-300 hover:text-white cursor-pointer'
                  "
                  :aria-label="voiceTooltipText"
                >
                  <Phone :size="16" aria-hidden="true" />
                  <span class="text-[10px] font-medium tabular-nums">
                    {{
                      isActiveVoiceHere
                        ? (currentCallDuration || t.inCall)
                        : t.call
                    }}
                  </span>
                </button>
              </AppTooltip>

              <AppTooltip v-if="showVideoCall" :text="videoTooltipText">
                <button
                  type="button"
                  :aria-disabled="isVideoDisabled ? 'true' : undefined"
                  :aria-pressed="isActiveVideoHere"
                  @click="onVideoCallClick"
                  class="w-full flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  :class="
                    isVideoDisabled
                      ? 'opacity-35 cursor-not-allowed bg-slate-800/60 border-white/5 text-slate-400'
                      : isActiveVideoHere
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 cursor-pointer'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-white/5 text-slate-300 hover:text-white cursor-pointer'
                  "
                  :aria-label="videoTooltipText"
                >
                  <Video :size="16" aria-hidden="true" />
                  <span class="text-[10px] font-medium tabular-nums">
                    {{
                      isActiveVideoHere
                        ? (currentCallDuration || t.inVideo)
                        : t.video
                    }}
                  </span>
                </button>
              </AppTooltip>

              <AppTooltip :text="isMuted ? t.unmuteNotifications : t.muteNotifications">
                <button
                  type="button"
                  @click="emit('toggle-mute')"
                  :aria-pressed="isMuted"
                  class="w-full flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  :class="
                    isMuted
                      ? lensTheme.soft
                      : 'bg-slate-800/60 hover:bg-slate-800 border-white/5 text-slate-300 hover:text-white'
                  "
                  :aria-label="isMuted ? t.unmuteNotifications : t.muteNotifications"
                >
                  <BellOff v-if="isMuted" :size="16" aria-hidden="true" />
                  <Bell v-else :size="16" aria-hidden="true" />
                  <span class="text-[10px] font-medium">{{ isMuted ? t.muted : t.mute }}</span>
                </button>
              </AppTooltip>

              <AppTooltip
                :text="isPinned ? t.unpinConversation : t.pinConversation"
                align="right"
              >
                <button
                  type="button"
                  @click="emit('toggle-pin')"
                  :aria-pressed="isPinned"
                  class="w-full flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  :class="
                    isPinned
                      ? lensTheme.soft
                      : 'bg-slate-800/60 hover:bg-slate-800 border-white/5 text-slate-300 hover:text-white'
                  "
                  :aria-label="isPinned ? t.unpinConversation : t.pinConversation"
                >
                  <PinOff v-if="isPinned" :size="16" aria-hidden="true" />
                  <Pin v-else :size="16" aria-hidden="true" />
                  <span class="text-[10px] font-medium">{{ isPinned ? t.pinned : t.pin }}</span>
                </button>
              </AppTooltip>
            </div>
          </div>

          <!-- TABS SECȚIUNI (WAI-ARIA complet) -->
          <div class="px-3 pt-3 pb-2 border-b border-white/5 shrink-0">
            <div role="tablist" :aria-label="t.sectionsAriaLabel" class="grid grid-cols-4 gap-1">
              <button
                v-for="(tab, idx) in tabs"
                :id="getTabId(tab.id)"
                :key="tab.id"
                :ref="(el) => setTabButtonRef(tab.id, el)"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab.id"
                :aria-controls="getTabPanelId(tab.id)"
                :tabindex="activeTab === tab.id ? 0 : -1"
                @click="activeTab = tab.id"
                @keydown="onTabKeyDown($event, idx)"
                class="py-2 md:py-1.5 px-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex items-center justify-center gap-1"
                :class="
                  activeTab === tab.id
                    ? lensTheme.tabActive
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                "
              >
                <span class="truncate">{{ tab.label }}</span>
                <span
                  v-if="tab.count !== undefined && tab.count > 0"
                  class="text-[9px] font-mono opacity-80 tabular-nums"
                >
                  {{ tab.count }}
                </span>
              </button>
            </div>
          </div>

          <!-- CONȚINUT TAB ACTIV -->
          <div
            :id="getTabPanelId(activeTab)"
            role="tabpanel"
            :aria-labelledby="getTabId(activeTab)"
            class="p-4 flex-1 space-y-4"
          >
            <!-- 1. TAB ABOUT (Direct Chat) -->
            <template v-if="activeTab === 'about' && !isGroup">
              <div class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {{ t.aboutHeading }}
                </span>
                <p class="text-xs text-slate-200 leading-relaxed">
                  {{ profile?.bio || t.defaultBio(activeLens) }}
                </p>
              </div>

              <!-- Prompt contextual -->
              <div
                v-if="profile?.promptQuestion && profile?.promptAnswer"
                class="p-3.5 rounded-xl border space-y-1"
                :class="lensTheme.soft"
              >
                <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-90">
                  <Sparkles :size="12" aria-hidden="true" />
                  <span>{{ profile.promptQuestion }}</span>
                </div>
                <p class="text-xs text-white leading-relaxed">
                  {{ profile.promptAnswer }}
                </p>
              </div>

              <!-- Metadate -->
              <div
                v-if="profile?.role || profile?.organization || profile?.location"
                class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2.5"
              >
                <div v-if="profile.role" class="flex items-center gap-2.5 text-xs text-slate-300">
                  <Briefcase :size="14" class="text-slate-500 shrink-0" aria-hidden="true" />
                  <span class="truncate">{{ profile.role }}</span>
                </div>
                <div v-if="profile.organization" class="flex items-center gap-2.5 text-xs text-slate-300">
                  <GraduationCap :size="14" class="text-slate-500 shrink-0" aria-hidden="true" />
                  <span class="truncate">{{ profile.organization }}</span>
                </div>
                <div v-if="profile.location" class="flex items-center gap-2.5 text-xs text-slate-300">
                  <MapPin :size="14" class="text-slate-500 shrink-0" aria-hidden="true" />
                  <span class="truncate">{{ profile.location }}</span>
                </div>
              </div>

              <!-- Skills / Interests Tags -->
              <div v-if="profile?.tags && profile.tags.length > 0" class="space-y-2">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-0.5">
                  {{ activeLens === 'PRO' ? t.skillsHeading : t.interestsHeading }}
                </span>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="(tag, idx) in profile.tags"
                    :key="`${idx}-${tag}`"
                    class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-[11px] font-medium text-slate-200"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- Link-uri profil sanitizate (blochează javascript:/data:) -->
              <div v-if="safeProfileLinks.length > 0" class="space-y-1.5">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-0.5">
                  {{ t.linksHeading }}
                </span>
                <a
                  v-for="item in safeProfileLinks"
                  :key="item.url"
                  :href="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 text-xs text-slate-200 transition-colors"
                >
                  <span class="truncate font-medium">{{ item.label }}</span>
                  <ExternalLink :size="13" class="text-slate-400 shrink-0" aria-hidden="true" />
                </a>
              </div>

              <!-- Grupuri comune interactive -->
              <div v-if="profile?.mutualGroups && profile.mutualGroups.length > 0" class="space-y-1.5">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-0.5">
                  {{ t.mutualGroupsHeading(profile.mutualGroups.length) }}
                </span>
                <div class="space-y-1">
                  <button
                    v-for="(groupTitle, idx) in profile.mutualGroups"
                    :key="`${idx}-${groupTitle}`"
                    type="button"
                    @click="emit('open-mutual-group', groupTitle)"
                    class="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-white/5 text-xs text-slate-200 transition-colors cursor-pointer group/mg outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  >
                    <span class="flex items-center gap-2.5 min-w-0">
                      <Users :size="14" :class="lensTheme.text" class="shrink-0" aria-hidden="true" />
                      <span class="truncate">{{ groupTitle }}</span>
                    </span>
                    <ChevronRight
                      :size="14"
                      class="text-slate-500 group-hover/mg:text-white group-hover/mg:translate-x-0.5 transition-all shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </template>

            <!-- 2. TAB MEMBERS (Group Chat) -->
            <template v-else-if="activeTab === 'members' && isGroup">
              <div
                v-if="profile?.description"
                class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1"
              >
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {{ t.descriptionHeading }}
                </span>
                <p class="text-xs text-slate-200 leading-relaxed">
                  {{ profile.description }}
                </p>
                <p v-if="profile.createdAt" class="text-[10px] text-slate-500 pt-1">
                  {{ t.createdAtPrefix(profile.createdAt) }}
                </p>
              </div>

              <!-- Căutare membri + Add Member (doar Admin) -->
              <div class="flex items-center gap-2">
                <div class="relative flex-1">
                  <Search
                    :size="14"
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    v-model="memberSearchQuery"
                    type="text"
                    :placeholder="t.filterMembersPlaceholder"
                    :aria-label="t.filterMembersAriaLabel"
                    class="w-full bg-slate-950/70 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all"
                    :class="lensTheme.ring"
                  />
                </div>
                <AppTooltip
                  v-if="isCurrentUserAdmin"
                  :text="isAddMemberOpen ? t.closeAddMember : t.addMemberTitle"
                  align="right"
                >
                  <button
                    type="button"
                    :aria-expanded="isAddMemberOpen"
                    @click="toggleAddMemberPicker"
                    class="min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    :class="
                      isAddMemberOpen
                        ? `${lensTheme.bg} border-transparent text-white`
                        : lensTheme.soft
                    "
                    :aria-label="isAddMemberOpen ? t.closeAddMember : t.addMemberTitle"
                  >
                    <X v-if="isAddMemberOpen" :size="16" aria-hidden="true" />
                    <UserPlus v-else :size="16" aria-hidden="true" />
                  </button>
                </AppTooltip>
              </div>

              <!-- PICKER INLINE: Adăugare coleg -->
              <transition name="fade">
                <div
                  v-if="isAddMemberOpen && isCurrentUserAdmin"
                  class="p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-2.5"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-white">{{ t.addPeopleHeading }}</span>
                    <span class="text-[10px] text-slate-500">
                      {{ t.availableCount(addableContacts.length) }}
                    </span>
                  </div>

                  <input
                    ref="addMemberInputRef"
                    v-model="addMemberSearchQuery"
                    type="text"
                    :placeholder="t.searchContactsPlaceholder"
                    :aria-label="t.searchContactsAriaLabel"
                    class="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all"
                    :class="lensTheme.ring"
                  />

                  <div
                    v-if="addableContacts.length === 0"
                    class="py-3 text-center text-[11px] text-slate-500"
                  >
                    {{ addMemberSearchQuery.trim() ? t.noMatchingPeople : t.allContactsInGroup }}
                  </div>

                  <div v-else class="space-y-1 max-h-40 overflow-y-auto scrollbar-hide">
                    <button
                      v-for="contact in addableContacts"
                      :key="contact.id"
                      type="button"
                      :disabled="isMemberPending(contact.id)"
                      @click="handleSelectMemberToAdd(contact)"
                      class="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                    >
                      <div
                        class="w-7 h-7 rounded-full overflow-hidden border flex items-center justify-center text-[10px] font-semibold shrink-0"
                        :class="
                          hasValidMemberAvatar(contact.id, contact.avatarUrl)
                            ? 'bg-slate-800 border-white/10'
                            : `${getAvatarTone(contact.name).surface} ${getAvatarTone(contact.name).border}`
                        "
                      >
                        <img
                          v-if="hasValidMemberAvatar(contact.id, contact.avatarUrl)"
                          :src="normalizeUrl(contact.avatarUrl) ?? ''"
                          referrerpolicy="no-referrer"
                          @error="markMemberAvatarFailed(contact.id, contact.avatarUrl)"
                          alt=""
                          class="w-full h-full object-cover"
                        />
                        <span v-else aria-hidden="true">{{ getAvatarInitials(contact.name, 2) || '?' }}</span>
                      </div>

                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-white truncate">{{ contact.name }}</p>
                        <p v-if="contact.role" class="text-[10px] text-slate-500 truncate">
                          {{ contact.role }}
                        </p>
                      </div>

                      <span
                        class="p-1 rounded-md border transition-colors shrink-0"
                        :class="lensTheme.soft"
                      >
                        <Loader2
                          v-if="isMemberPending(contact.id)"
                          :size="12"
                          class="motion-safe:animate-spin"
                          aria-hidden="true"
                        />
                        <Plus v-else :size="12" aria-hidden="true" />
                      </span>
                    </button>
                  </div>
                </div>
              </transition>

              <!-- Lista membri actuali -->
              <div class="space-y-1">
                <!-- Rândul utilizatorului curent (unic, exclus din filteredMembers) -->
                <div
                  v-if="showCurrentUserRow"
                  class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-white/5"
                >
                  <div
                    class="w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center text-[11px] font-semibold shrink-0"
                    :class="
                      hasValidMemberAvatar(currentUserId, resolvedCurrentUserAvatar)
                        ? 'bg-slate-800 border-white/10'
                        : `${getAvatarTone(resolvedCurrentUserName).surface} ${getAvatarTone(resolvedCurrentUserName).border}`
                    "
                  >
                    <img
                      v-if="hasValidMemberAvatar(currentUserId, resolvedCurrentUserAvatar)"
                      :src="resolvedCurrentUserAvatar ?? ''"
                      referrerpolicy="no-referrer"
                      @error="markMemberAvatarFailed(currentUserId, resolvedCurrentUserAvatar)"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                    <span v-else aria-hidden="true">{{
                      getAvatarInitials(resolvedCurrentUserName, 2) || '?'
                    }}</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-white truncate">
                      {{ resolvedCurrentUserName }}
                      <span
                        v-if="currentUserName.trim()"
                        class="text-slate-400 font-normal"
                      >
                        ({{ t.you }})
                      </span>
                    </p>
                    <span
                      v-if="isCurrentUserAdmin"
                      class="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border"
                      :class="lensTheme.soft"
                    >
                      {{ t.adminBadge }}
                    </span>
                    <span v-else class="text-[10px] text-slate-500">{{ t.memberLabel }}</span>
                  </div>
                </div>

                <div
                  v-if="filteredMembers.length === 0 && !showCurrentUserRow"
                  class="py-6 text-center text-xs text-slate-500"
                >
                  {{ t.noMatchingMembers }}
                </div>

                <div
                  v-for="member in filteredMembers"
                  :key="member.id"
                  class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group/member"
                >
                  <div
                    class="w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center text-[11px] font-semibold shrink-0"
                    :class="
                      hasValidMemberAvatar(member.id, member.avatarUrl)
                        ? 'bg-slate-800 border-white/10'
                        : `${getAvatarTone(member.name).surface} ${getAvatarTone(member.name).border}`
                    "
                  >
                    <img
                      v-if="hasValidMemberAvatar(member.id, member.avatarUrl)"
                      :src="normalizeUrl(member.avatarUrl) ?? ''"
                      referrerpolicy="no-referrer"
                      @error="markMemberAvatarFailed(member.id, member.avatarUrl)"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                    <span v-else aria-hidden="true">{{
                      getAvatarInitials(member.name, 2) || '?'
                    }}</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-white truncate">{{ member.name }}</p>
                    <span
                      v-if="isGroupAdmin(member.id)"
                      class="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border"
                      :class="lensTheme.soft"
                    >
                      {{ t.adminBadge }}
                    </span>
                    <span v-else class="text-[10px] text-slate-500">{{ t.memberLabel }}</span>
                  </div>

                  <!-- Acțiuni membru -->
                  <div class="flex items-center gap-1 shrink-0">
                    <AppTooltip
                      v-if="isCurrentUserAdmin && confirmRemoveMemberId !== String(member.id)"
                      :text="isGroupAdmin(member.id) ? t.removeAdmin : t.makeAdmin"
                      placement="top"
                      align="right"
                    >
                      <button
                        type="button"
                        :disabled="isMemberPending(member.id)"
                        :aria-pressed="isGroupAdmin(member.id)"
                        @click="handleToggleAdminClick(member.id)"
                        class="min-w-[40px] min-h-[40px] md:min-w-[28px] md:min-h-[28px] flex items-center justify-center rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        :class="
                          isGroupAdmin(member.id)
                            ? `${lensTheme.text} hover:bg-rose-500/15 hover:text-rose-300`
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/80 opacity-80 group-hover/member:opacity-100'
                        "
                        :aria-label="
                          isGroupAdmin(member.id)
                            ? `${t.removeAdmin} — ${member.name}`
                            : `${t.makeAdmin} — ${member.name}`
                        "
                      >
                        <Loader2
                          v-if="isMemberPending(member.id)"
                          :size="14"
                          class="motion-safe:animate-spin"
                          aria-hidden="true"
                        />
                        <ShieldOff v-else-if="isGroupAdmin(member.id)" :size="14" aria-hidden="true" />
                        <Shield v-else :size="14" aria-hidden="true" />
                      </button>
                    </AppTooltip>

                    <AppTooltip
                      v-if="isCurrentUserAdmin"
                      :text="
                        confirmRemoveMemberId === String(member.id)
                          ? t.confirmRemove
                          : t.removeFromGroup
                      "
                      placement="top"
                      align="right"
                    >
                      <button
                        type="button"
                        :disabled="isMemberPending(member.id)"
                        @click="handleRemoveMemberClick(member.id)"
                        class="min-h-[40px] md:min-h-[28px] flex items-center justify-center gap-1 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                        :class="
                          confirmRemoveMemberId === String(member.id)
                            ? 'px-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[10px] font-semibold'
                            : 'min-w-[40px] md:min-w-[28px] text-slate-400 hover:text-rose-300 hover:bg-rose-500/15 opacity-80 group-hover/member:opacity-100'
                        "
                        :aria-label="
                          confirmRemoveMemberId === String(member.id)
                            ? `${t.confirmRemove} — ${t.removeFromGroup} ${member.name}`
                            : `${t.removeFromGroup} — ${member.name}`
                        "
                      >
                        <UserMinus :size="14" aria-hidden="true" />
                        <span v-if="confirmRemoveMemberId === String(member.id)">
                          {{ t.confirmRemove }}
                        </span>
                      </button>
                    </AppTooltip>

                    <AppTooltip
                      v-if="confirmRemoveMemberId !== String(member.id)"
                      :text="t.messageMember(member.name)"
                      placement="top"
                      align="right"
                    >
                      <button
                        type="button"
                        @click="
                          emit('message-member', {
                            id: String(member.id),
                            name: member.name,
                            avatarUrl: member.avatarUrl,
                          })
                        "
                        class="min-w-[40px] min-h-[40px] md:min-w-[28px] md:min-h-[28px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all cursor-pointer opacity-80 group-hover/member:opacity-100 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-slate-500"
                        :aria-label="t.messageMember(member.name)"
                      >
                        <MessageSquare :size="14" aria-hidden="true" />
                      </button>
                    </AppTooltip>
                  </div>
                </div>
              </div>
            </template>

            <!-- 3. TAB MEDIA -->
            <template v-else-if="activeTab === 'media'">
              <div
                v-if="sharedMedia.length === 0"
                class="py-10 flex flex-col items-center text-center gap-2 text-slate-500"
              >
                <ImageIcon :size="24" class="opacity-50" aria-hidden="true" />
                <p class="text-xs">{{ t.noMediaEmpty }}</p>
              </div>

              <template v-else>
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    v-for="(item, idx) in sharedMedia"
                    :key="item.id"
                    type="button"
                    @click="lightboxIndex = idx"
                    class="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-white/5 hover:border-white/25 transition-all cursor-pointer group/tile outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex items-center justify-center"
                    :aria-label="`Open image ${idx + 1} of ${sharedMedia.length}`"
                  >
                    <ImageOff
                      v-if="failedMediaIds.has(String(item.id))"
                      :size="18"
                      class="text-slate-500"
                      aria-hidden="true"
                    />
                    <img
                      v-else
                      :src="item.src"
                      referrerpolicy="no-referrer"
                      :alt="item.alt || item.caption || 'Shared photo'"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      @error="markMediaFailed(item.id)"
                      class="w-full h-full object-cover transition-transform duration-200 group-hover/tile:scale-105"
                    />
                  </button>
                </div>

                <button
                  v-if="hasMoreMedia"
                  type="button"
                  :disabled="isLoadingMore"
                  @click="emit('load-more', 'media')"
                  class="w-full py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex items-center justify-center gap-1.5"
                >
                  <Loader2
                    v-if="isLoadingMore"
                    :size="13"
                    class="motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  <span>{{ isLoadingMore ? t.loadingMore : t.loadMore }}</span>
                </button>
              </template>
            </template>

            <!-- 4. TAB FILES -->
            <template v-else-if="activeTab === 'files'">
              <div
                v-if="sharedFiles.length === 0"
                class="py-10 flex flex-col items-center text-center gap-2 text-slate-500"
              >
                <FileText :size="24" class="opacity-50" aria-hidden="true" />
                <p class="text-xs">{{ t.noFilesEmpty }}</p>
              </div>

              <template v-else>
                <div class="space-y-1.5">
                  <div
                    v-for="file in sharedFiles"
                    :key="file.id"
                    class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5"
                  >
                    <div class="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                      <FileText :size="16" aria-hidden="true" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-white truncate" :title="file.fileName">
                        {{ file.fileName }}
                      </p>
                      <p class="text-[10px] text-slate-500 truncate">
                        {{ file.metaLabel }} · {{ formatShortDate(file.timestamp) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-0.5 shrink-0">
                      <AppTooltip
                        v-if="canJumpToMessage && file.messageId !== undefined"
                        :text="t.jumpToMessage"
                        placement="top"
                        align="right"
                      >
                        <button
                          type="button"
                          @click="emit('jump-to-message', file.messageId)"
                          class="min-w-[44px] min-h-[44px] md:min-w-[30px] md:min-h-[30px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                          :aria-label="t.jumpToMessage"
                        >
                          <CornerUpRight :size="14" aria-hidden="true" />
                        </button>
                      </AppTooltip>

                      <AppTooltip :text="t.downloadFile(file.fileName)" placement="top" align="right">
                        <a
                          :href="file.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          :download="file.fileName"
                          class="min-w-[44px] min-h-[44px] md:min-w-[30px] md:min-h-[30px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                          :aria-label="t.downloadFile(file.fileName)"
                        >
                          <Download :size="14" aria-hidden="true" />
                        </a>
                      </AppTooltip>
                    </div>
                  </div>
                </div>

                <button
                  v-if="hasMoreFiles"
                  type="button"
                  :disabled="isLoadingMore"
                  @click="emit('load-more', 'files')"
                  class="w-full py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex items-center justify-center gap-1.5"
                >
                  <Loader2
                    v-if="isLoadingMore"
                    :size="13"
                    class="motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  <span>{{ isLoadingMore ? t.loadingMore : t.loadMore }}</span>
                </button>
              </template>
            </template>

            <!-- 5. TAB LINKS -->
            <template v-else-if="activeTab === 'links'">
              <div
                v-if="sharedLinks.length === 0"
                class="py-10 flex flex-col items-center text-center gap-2 text-slate-500"
              >
                <Link2 :size="24" class="opacity-50" aria-hidden="true" />
                <p class="text-xs">{{ t.noLinksEmpty }}</p>
              </div>

              <template v-else>
                <div class="space-y-2">
                  <div
                    v-for="item in sharedLinks"
                    :key="item.id"
                    class="rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-white/5 transition-colors flex items-start gap-1"
                  >
                    <a
                      :href="item.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-1 min-w-0 block p-3 group/link outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-xl"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-semibold truncate" :class="lensTheme.text">
                          {{ item.domain }}
                        </span>
                        <ExternalLink
                          :size="12"
                          class="text-slate-500 group-hover/link:text-white shrink-0 transition-colors"
                          aria-hidden="true"
                        />
                      </div>
                      <p class="mt-1 text-[11px] text-slate-400 line-clamp-2 break-words">
                        {{ item.snippet }}
                      </p>
                      <span class="mt-1.5 block text-[10px] text-slate-500">
                        {{ formatShortDate(item.timestamp) }}
                      </span>
                    </a>

                    <AppTooltip
                      v-if="canJumpToMessage && item.messageId !== undefined"
                      class="mt-1.5 mr-1 shrink-0"
                      :text="t.jumpToMessage"
                      placement="top"
                      align="right"
                    >
                      <button
                        type="button"
                        @click="emit('jump-to-message', item.messageId)"
                        class="min-w-[44px] min-h-[44px] md:min-w-[30px] md:min-h-[30px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        :aria-label="t.jumpToMessage"
                      >
                        <CornerUpRight :size="14" aria-hidden="true" />
                      </button>
                    </AppTooltip>
                  </div>
                </div>

                <button
                  v-if="hasMoreLinks"
                  type="button"
                  :disabled="isLoadingMore"
                  @click="emit('load-more', 'links')"
                  class="w-full py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-slate-500 flex items-center justify-center gap-1.5"
                >
                  <Loader2
                    v-if="isLoadingMore"
                    :size="13"
                    class="motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  <span>{{ isLoadingMore ? t.loadingMore : t.loadMore }}</span>
                </button>
              </template>
            </template>
          </div>

          <!-- ZONA DE PRIVACY & ACȚIUNI PERICULOASE -->
          <div class="p-4 border-t border-white/10 space-y-1.5 mt-auto">
            <button
              v-if="!isGroup"
              type="button"
              :disabled="Boolean(pendingActions.block)"
              @click="handleBlockClick"
              class="w-full px-3 py-2.5 md:py-2 rounded-xl text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
              :class="
                isBlocked
                  ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              "
            >
              <Loader2
                v-if="pendingActions.block"
                :size="15"
                class="motion-safe:animate-spin shrink-0"
                aria-hidden="true"
              />
              <Ban v-else :size="15" class="shrink-0" aria-hidden="true" />
              <span class="truncate">
                {{ isBlocked ? t.unblockUser(displayName) : t.blockUser(displayName) }}
              </span>
            </button>

            <button
              type="button"
              :disabled="Boolean(pendingActions.clear)"
              @click="handleClearClick"
              class="w-full px-3 py-2.5 md:py-2 rounded-xl text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
              :class="
                confirmClear
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-rose-400 hover:bg-rose-500/10'
              "
            >
              <Loader2
                v-if="pendingActions.clear"
                :size="15"
                class="motion-safe:animate-spin shrink-0"
                aria-hidden="true"
              />
              <Trash2 v-else :size="15" class="shrink-0" aria-hidden="true" />
              <span>{{ confirmClear ? t.confirmClearChat : t.clearChatHistory }}</span>
            </button>

            <button
              v-if="isGroup"
              type="button"
              :disabled="Boolean(pendingActions.leave)"
              @click="handleLeaveClick"
              class="w-full px-3 py-2.5 md:py-2 rounded-xl text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
              :class="
                confirmLeave
                  ? 'bg-rose-500/20 text-rose-300 font-semibold'
                  : 'text-rose-400 hover:bg-rose-500/10'
              "
            >
              <Loader2
                v-if="pendingActions.leave"
                :size="15"
                class="motion-safe:animate-spin shrink-0"
                aria-hidden="true"
              />
              <LogOut v-else :size="15" class="shrink-0" aria-hidden="true" />
              <span>{{ confirmLeave ? t.confirmLeaveGroup : t.leaveGroup }}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </transition>

  <!-- GALERIE LIGHTBOX REUTILIZABILĂ -->
  <MediaLightbox
    v-model:active-index="lightboxIndex"
    :items="sharedMedia"
    :can-jump-to-message="canJumpToMessage"
    :locale="locale"
    :labels="t.lightbox"
    @jump-to-message="emit('jump-to-message', $event)"
  />
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>