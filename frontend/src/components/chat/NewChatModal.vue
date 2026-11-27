<!-- src/components/chat/NewChatModal.vue -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  X,
  Search,
  UserPlus,
  Users,
  Check,
  Camera,
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle,
  MessageSquarePlus,
} from 'lucide-vue-next';
import AppTooltip from '../ui/AppTooltip.vue';
import { getAvatarInitials, getAvatarTone } from '../../utils/avatar';
import { getLensTheme } from '../../utils/lensTheme';
import type { ConnectionStatus } from './ChatHeader.vue';
import type { ChatEntityId, ChatLens, ChatPresenceStatus } from '../../types/chat';

export type ContactStatus = ChatPresenceStatus;

export interface ChatContact {
  id: ChatEntityId;
  name: string;
  username: string;
  avatarUrl?: string | null;
  role?: string;
  status?: ContactStatus | null;
  badge?: string;
}

export interface CreateDirectChatPayload {
  mode: 'direct';
  contact: ChatContact;
  initialMessage?: string;
}

export interface CreateGroupChatPayload {
  mode: 'group';
  name: string;
  members: ChatContact[];
  avatarFile?: File | null;
  initialMessage?: string;
}

export type CreateChatPayload = CreateDirectChatPayload | CreateGroupChatPayload;

export interface NewChatModalLabels {
  directTitle: string;
  groupTitle: string;
  directSubtitle: string;
  groupSubtitle: string;
  dateSubtitle: string;
  closeModal: string;
  modeTabsAriaLabel: string;
  tabDirect: string;
  tabGroup: string;
  uploadGroupAvatar: string;
  removeGroupAvatar: string;
  groupNamePlaceholder: string;
  groupNameAriaLabel: string;
  selectedMembersHeading: string;
  removeMember: (name: string) => string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  clearSearch: string;
  contactsListAriaLabel: string;
  emptySearchPrefix: string;
  emptyContactsTitle: string;
  emptyContactsDateDescription: string;
  emptyContactsDescription: string;
  openExistingChat: string;
  toLabel: string;
  deselectContact: (name: string) => string;
  firstMessagePlaceholder: string;
  firstMessageAriaLabel: string;
  keyboardNavigate: string;
  keyboardSelect: string;
  keyboardClose: string;
  cancel: string;
  createGroup: string;
  startChat: string;
  chatWith: (firstName: string) => string;
  submitHintSelectContact: string;
  submitHintGroupName: string;
  submitHintSelectMembers: string;
  errorMaxMembers: (max: number) => string;
  errorInvalidAvatarType: string;
  errorAvatarTooLarge: (maxMB: number) => string;
  resultsAnnouncement: (count: number) => string;
}

const DEFAULT_LABELS: NewChatModalLabels = {
  directTitle: 'Start a new conversation',
  groupTitle: 'Create a new group',
  directSubtitle: 'Select someone or jump straight into an existing chat',
  groupSubtitle: 'Name your group and pick team members',
  dateSubtitle: 'Choose one of your matches to start chatting',
  closeModal: 'Close modal',
  modeTabsAriaLabel: 'Conversation type',
  tabDirect: 'Direct Message',
  tabGroup: 'New Group',
  uploadGroupAvatar: 'Upload group photo',
  removeGroupAvatar: 'Remove group avatar',
  groupNamePlaceholder: 'Group name (e.g. Sprint 4 Backend)...',
  groupNameAriaLabel: 'Group name',
  selectedMembersHeading: 'Selected members',
  removeMember: (name) => `Remove ${name}`,
  searchPlaceholder: 'Search by name, @username, or role...',
  searchAriaLabel: 'Search contacts',
  clearSearch: 'Clear search',
  contactsListAriaLabel: 'Available contacts',
  emptySearchPrefix: 'No contacts found for',
  emptyContactsTitle: 'No contacts available yet',
  emptyContactsDateDescription: 'Match with someone first to start a conversation.',
  emptyContactsDescription: 'People you can message in this lens will appear here.',
  openExistingChat: 'Open chat',
  toLabel: 'To:',
  deselectContact: (name) => `Deselect ${name}`,
  firstMessagePlaceholder: 'Write a first message (optional)...',
  firstMessageAriaLabel: 'First message (optional)',
  keyboardNavigate: 'navigate',
  keyboardSelect: 'select',
  keyboardClose: 'close',
  cancel: 'Cancel',
  createGroup: 'Create group',
  startChat: 'Start chat',
  chatWith: (firstName) => `Chat with ${firstName}`,
  submitHintSelectContact: 'Select a contact to start chatting',
  submitHintGroupName: 'Enter a group name (min. 2 characters)',
  submitHintSelectMembers: 'Select at least 1 member',
  errorMaxMembers: (max) => `You can add up to ${max} members in a group.`,
  errorInvalidAvatarType: 'Please choose a valid image file (PNG, JPG, WebP, or GIF).',
  errorAvatarTooLarge: (maxMB) => `Group avatar must be smaller than ${maxMB} MB.`,
  resultsAnnouncement: (count) =>
    count === 0
      ? 'No matching contacts'
      : count === 1
        ? '1 contact available'
        : `${count} contacts available`,
};

export interface NewChatModalProps {
  open: boolean;
  activeLens: ChatLens;
  /** Lista reală de contacte (din Pinia / API) */
  contacts?: ChatContact[];
  /** Hartă contactId (sau username normalizat) -> chatId pentru deduplicarea chat-urilor 1-la-1 */
  existingDirectChatMap?: Record<string, ChatEntityId>;
  isLoading?: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  connectionStatus?: ConnectionStatus;
  maxGroupMembers?: number;
  maxGroupNameLength?: number;
  maxInitialMessageLength?: number;
  maxAvatarSizeMB?: number;
  labels?: Partial<NewChatModalLabels>;
}

const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const AVATAR_ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,image/gif';
const SEARCH_DEBOUNCE_MS = 250;
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

let modalInstanceSeq = 0;

const props = withDefaults(defineProps<NewChatModalProps>(), {
  contacts: () => [],
  existingDirectChatMap: () => ({}),
  isLoading: false,
  isSubmitting: false,
  errorMessage: null,
  connectionStatus: 'connected',
  maxGroupMembers: 20,
  maxGroupNameLength: 50,
  maxInitialMessageLength: 1000,
  maxAvatarSizeMB: 5,
  labels: () => ({}),
});

const emit = defineEmits<{
  close: [];
  search: [query: string];
  'open-existing': [chatId: ChatEntityId];
  create: [payload: CreateChatPayload];
}>();

const instanceId = ++modalInstanceSeq;
const titleId = `new-chat-modal-title-${instanceId}`;
const directTabId = `new-chat-tab-direct-${instanceId}`;
const groupTabId = `new-chat-tab-group-${instanceId}`;
const tabpanelId = `new-chat-tabpanel-${instanceId}`;
const listboxId = `new-chat-contacts-${instanceId}`;
const getOptionId = (index: number) => `new-chat-contact-opt-${instanceId}-${index}`;

const t = computed<NewChatModalLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
}));

const lensTheme = computed(() => getLensTheme(props.activeLens));
const supportsGroupMode = computed(() => props.activeLens !== 'DATE');
const isConnected = computed(() => props.connectionStatus === 'connected');

// ==========================================
// 1. HELPERE URL, DIACRITICE & SCROLL LOCK (Ref-counted)
// ==========================================
const normalizeUrl = (raw?: string | null): string | null => {
  const trimmed = raw?.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'https:' || protocol === 'http:') return parsed.href;
    if (protocol === 'blob:') return trimmed;
    return null;
  } catch {
    return null;
  }
};

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
// 2. STATE LOCAL, LIFECYCLE & FOCUS RESTORE
// ==========================================
const mode = ref<'direct' | 'group'>('direct');
const searchQuery = ref('');
const activeIndex = ref(0);

const selectedDirectContact = ref<ChatContact | null>(null);
const selectedGroupMembers = ref<ChatContact[]>([]);
const groupName = ref('');
const initialMessage = ref('');

const groupAvatarFile = ref<File | null>(null);
const groupAvatarPreview = ref<string | null>(null);
const localError = ref<string | null>(null);
const liveAnnouncement = ref('');

const dialogPanelRef = ref<HTMLElement | null>(null);
const directTabRef = ref<HTMLButtonElement | null>(null);
const groupTabRef = ref<HTMLButtonElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const groupNameInputRef = ref<HTMLInputElement | null>(null);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const firstMessageInputRef = ref<HTMLInputElement | null>(null);
const listContainerRef = ref<HTMLElement | null>(null);

const failedAvatars = ref<Set<string>>(new Set());

let isModalActive = false;
let isResetting = false;
let isUnmounted = false;
let announceSeq = 0;
let previouslyFocusedEl: HTMLElement | null = null;
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPointerX = -1;
let lastPointerY = -1;

const clearSearchTimer = () => {
  if (searchDebounceTimer !== null) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
};

const revokeGroupAvatarPreview = () => {
  if (groupAvatarPreview.value) {
    URL.revokeObjectURL(groupAvatarPreview.value);
    groupAvatarPreview.value = null;
  }
};

const pushLiveAnnouncement = async (message: string) => {
  const seq = ++announceSeq;
  liveAnnouncement.value = '';
  await nextTick();
  if (isUnmounted || !isModalActive || seq !== announceSeq) return;
  liveAnnouncement.value = message;
};

const resetState = () => {
  isResetting = true;
  mode.value = 'direct';
  searchQuery.value = '';
  activeIndex.value = 0;
  selectedDirectContact.value = null;
  selectedGroupMembers.value = [];
  groupName.value = '';
  initialMessage.value = '';
  groupAvatarFile.value = null;
  revokeGroupAvatarPreview();
  localError.value = null;
  liveAnnouncement.value = '';
  failedAvatars.value = new Set();
  nextTick(() => {
    isResetting = false;
  });
};

const activateModal = () => {
  if (isModalActive || typeof document === 'undefined' || typeof window === 'undefined') return;
  isModalActive = true;
  previouslyFocusedEl =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  resetState();
  acquireScrollLock();
  window.addEventListener('keydown', handleDialogKeyDown);
  nextTick(() => {
    if (isModalActive && !isUnmounted) {
      searchInputRef.value?.focus();
    }
  });
};

const deactivateModal = (restoreFocus: boolean) => {
  if (!isModalActive) return;
  isModalActive = false;
  clearSearchTimer();
  revokeGroupAvatarPreview();
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleDialogKeyDown);
  }
  releaseScrollLock();

  const elToRestore = previouslyFocusedEl;
  previouslyFocusedEl = null;
  if (restoreFocus && elToRestore && typeof document !== 'undefined') {
    nextTick(() => {
      if (document.contains(elToRestore)) {
        elToRestore.focus();
      }
    });
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) activateModal();
    else deactivateModal(true);
  }
);

watch(
  () => props.activeLens,
  (lens) => {
    selectedDirectContact.value = null;
    selectedGroupMembers.value = [];
    localError.value = null;
    if (lens === 'DATE' && mode.value === 'group') {
      mode.value = 'direct';
    }
  }
);

watch(
  () => props.connectionStatus,
  (nextStatus, prevStatus) => {
    if (nextStatus === 'connected' && prevStatus && prevStatus !== 'connected') {
      failedAvatars.value = new Set();
    }
  }
);

// Debounced @search (ignorat pe reset intern)
watch(searchQuery, (val) => {
  clearSearchTimer();
  if (!props.open || isResetting) return;
  const trimmed = val.trim();
  searchDebounceTimer = setTimeout(() => {
    emit('search', trimmed);
    if (!props.isLoading) {
      pushLiveAnnouncement(t.value.resultsAnnouncement(filteredContacts.value.length));
    }
  }, SEARCH_DEBOUNCE_MS);
});

// Anunț actualizat și după ce se încheie o căutare asincronă din backend
watch(
  () => props.isLoading,
  (loading, wasLoading) => {
    if (!loading && wasLoading && props.open && searchQuery.value.trim()) {
      pushLiveAnnouncement(t.value.resultsAnnouncement(filteredContacts.value.length));
    }
  }
);

// ==========================================
// 3. DEDUPLICARE, AVATARE & FILTRARE FĂRĂ DIACRITICE
// ==========================================
const uniqueContacts = computed<ChatContact[]>(() => {
  const seen = new Set<string>();
  const result: ChatContact[] = [];
  for (const contact of props.contacts) {
    const key = String(contact.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(contact);
  }
  return result;
});

// Deduplicare strict pe ID sau username normalizat (fără coliziuni pe nume)
const getExistingChatId = (contact: ChatContact): ChatEntityId | null => {
  const map = props.existingDirectChatMap;
  if (!map) return null;

  const byId = map[String(contact.id)];
  if (byId !== undefined) return byId;

  const cleanUsername = contact.username.trim().replace(/^@/, '').toLowerCase();
  if (!cleanUsername) return null;

  const byUsername = map[cleanUsername];
  if (byUsername !== undefined) return byUsername;

  const byHandle = map[`@${cleanUsername}`];
  if (byHandle !== undefined) return byHandle;

  return null;
};

const foldedQuery = computed(() => foldText(searchQuery.value.trim()));

const filteredContacts = computed<ChatContact[]>(() => {
  const q = foldedQuery.value;
  if (!q) return uniqueContacts.value;

  return uniqueContacts.value.filter((c) => {
    const nameMatch = foldText(c.name).includes(q);
    const handleMatch = foldText(`@${c.username}`).includes(q);
    const roleMatch = c.role ? foldText(c.role).includes(q) : false;
    return nameMatch || handleMatch || roleMatch;
  });
});

watch(filteredContacts, (list) => {
  if (list.length === 0) {
    activeIndex.value = -1;
  } else if (activeIndex.value < 0 || activeIndex.value >= list.length) {
    activeIndex.value = 0;
  }
});

const activeOptionId = computed(() => {
  if (props.isLoading || filteredContacts.value.length === 0 || activeIndex.value < 0) {
    return undefined;
  }
  return getOptionId(activeIndex.value);
});

const getAvatarKey = (contact: ChatContact) =>
  `${String(contact.id)}:${normalizeUrl(contact.avatarUrl) ?? ''}`;

const hasValidAvatar = (contact: ChatContact): boolean => {
  const url = normalizeUrl(contact.avatarUrl);
  return Boolean(url) && !failedAvatars.value.has(getAvatarKey(contact));
};

const markAvatarFailed = (contact: ChatContact) => {
  const key = getAvatarKey(contact);
  if (failedAvatars.value.has(key)) return;
  const next = new Set(failedAvatars.value);
  next.add(key);
  failedAvatars.value = next;
};

const isMemberSelected = (contactId: ChatEntityId): boolean =>
  selectedGroupMembers.value.some((m) => String(m.id) === String(contactId));

const isDirectSelected = (contactId: ChatEntityId): boolean =>
  selectedDirectContact.value !== null &&
  String(selectedDirectContact.value.id) === String(contactId);

const statusDotClass = (status?: ContactStatus | null): string => {
  if (!isConnected.value) return 'bg-slate-600';
  switch (status) {
    case 'online':
      return 'bg-emerald-500';
    case 'away':
      return 'bg-amber-400';
    case 'busy':
    case 'dnd':
      return 'bg-rose-500';
    default:
      return 'bg-slate-600';
  }
};

// ==========================================
// 4. ACȚIUNI SELECȚIE, AVATAR & SUBMIT
// ==========================================
const switchMode = (nextMode: 'direct' | 'group') => {
  if (props.isSubmitting) return;
  if (nextMode === 'group' && !supportsGroupMode.value) return;
  mode.value = nextMode;
  localError.value = null;
  activeIndex.value = filteredContacts.value.length > 0 ? 0 : -1;
  nextTick(() => {
    if (nextMode === 'group' && !groupName.value.trim()) {
      groupNameInputRef.value?.focus();
    } else {
      searchInputRef.value?.focus();
    }
  });
};

const onModeTabKeyDown = (event: KeyboardEvent) => {
  if (!supportsGroupMode.value || props.isSubmitting) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    const next = mode.value === 'direct' ? 'group' : 'direct';
    mode.value = next;
    localError.value = null;
    nextTick(() => {
      if (next === 'direct') directTabRef.value?.focus();
      else groupTabRef.value?.focus();
    });
  } else if (event.key === 'Home') {
    event.preventDefault();
    mode.value = 'direct';
    nextTick(() => directTabRef.value?.focus());
  } else if (event.key === 'End') {
    event.preventDefault();
    mode.value = 'group';
    nextTick(() => groupTabRef.value?.focus());
  }
};

const handleContactClick = (contact: ChatContact) => {
  if (props.isSubmitting) return;
  localError.value = null;

  if (mode.value === 'direct') {
    const existingId = getExistingChatId(contact);
    if (existingId !== null) {
      emit('open-existing', existingId);
      return;
    }

    if (isDirectSelected(contact.id)) {
      selectedDirectContact.value = null;
    } else {
      selectedDirectContact.value = contact;
      nextTick(() => firstMessageInputRef.value?.focus());
    }
    return;
  }

  const existingIdx = selectedGroupMembers.value.findIndex(
    (m) => String(m.id) === String(contact.id)
  );
  if (existingIdx !== -1) {
    selectedGroupMembers.value.splice(existingIdx, 1);
  } else {
    if (selectedGroupMembers.value.length >= props.maxGroupMembers) {
      localError.value = t.value.errorMaxMembers(props.maxGroupMembers);
      return;
    }
    selectedGroupMembers.value.push(contact);
  }
};

const removeGroupMember = (contactId: ChatEntityId) => {
  if (props.isSubmitting) return;
  selectedGroupMembers.value = selectedGroupMembers.value.filter(
    (m) => String(m.id) !== String(contactId)
  );
  localError.value = null;
};

const clearDirectSelection = () => {
  if (props.isSubmitting) return;
  selectedDirectContact.value = null;
  nextTick(() => searchInputRef.value?.focus());
};

const handleGroupAvatarChange = (e: Event) => {
  if (props.isSubmitting) return;
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  if (!ALLOWED_AVATAR_MIME_TYPES.has(file.type.toLowerCase())) {
    localError.value = t.value.errorInvalidAvatarType;
    return;
  }

  const maxBytes = props.maxAvatarSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    localError.value = t.value.errorAvatarTooLarge(props.maxAvatarSizeMB);
    return;
  }

  localError.value = null;
  revokeGroupAvatarPreview();
  groupAvatarFile.value = file;
  groupAvatarPreview.value = URL.createObjectURL(file);
};

const removeGroupAvatar = () => {
  if (props.isSubmitting) return;
  groupAvatarFile.value = null;
  revokeGroupAvatarPreview();
};

const submitDisabledReason = computed<string>(() => {
  if (props.isSubmitting) return '';
  if (mode.value === 'direct') {
    return selectedDirectContact.value === null ? t.value.submitHintSelectContact : '';
  }
  if (groupName.value.trim().length < 2) return t.value.submitHintGroupName;
  if (selectedGroupMembers.value.length < 1) return t.value.submitHintSelectMembers;
  return '';
});

const canSubmit = computed(
  () => !props.isSubmitting && submitDisabledReason.value === ''
);

const handleSubmit = () => {
  if (props.isSubmitting) return;
  if (submitDisabledReason.value) {
    localError.value = submitDisabledReason.value;
    if (mode.value === 'group' && groupName.value.trim().length < 2) {
      groupNameInputRef.value?.focus();
    }
    return;
  }

  localError.value = null;
  const trimmedMessage = initialMessage.value.trim() || undefined;

  if (mode.value === 'direct' && selectedDirectContact.value) {
    emit('create', {
      mode: 'direct',
      contact: selectedDirectContact.value,
      initialMessage: trimmedMessage,
    });
    return;
  }

  if (mode.value === 'group') {
    emit('create', {
      mode: 'group',
      name: groupName.value.trim(),
      members: [...selectedGroupMembers.value],
      avatarFile: groupAvatarFile.value,
      initialMessage: trimmedMessage,
    });
  }
};

const handleClose = () => {
  if (props.isSubmitting) return;
  emit('close');
};

// ==========================================
// 5. NAVIGARE TASTATURĂ (IME-safe), ANTI-MOUSE-STEAL & FOCUS TRAP
// ==========================================
const scrollActiveRowIntoView = () => {
  nextTick(() => {
    const container = listContainerRef.value;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(
      `[data-contact-idx="${activeIndex.value}"]`
    );
    activeEl?.scrollIntoView({ block: 'nearest' });
  });
};

const onContactPointerMove = (index: number, event: PointerEvent) => {
  if (event.clientX === lastPointerX && event.clientY === lastPointerY) return;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  activeIndex.value = index;
};

const handleGroupNameKeyDown = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (canSubmit.value) {
    handleSubmit();
  } else {
    searchInputRef.value?.focus();
  }
};

const handleFirstMessageKeyDown = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSubmit();
  }
};

const handleSearchKeyDown = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229 || props.isSubmitting) return;
  const total = filteredContacts.value.length;

  if (e.key === 'ArrowDown' && total > 0) {
    e.preventDefault();
    activeIndex.value = activeIndex.value < 0 ? 0 : (activeIndex.value + 1) % total;
    scrollActiveRowIntoView();
  } else if (e.key === 'ArrowUp' && total > 0) {
    e.preventDefault();
    activeIndex.value = activeIndex.value <= 0 ? total - 1 : activeIndex.value - 1;
    scrollActiveRowIntoView();
  } else if (e.key === 'Enter' && total > 0 && activeIndex.value >= 0) {
    e.preventDefault();
    const target = filteredContacts.value[activeIndex.value];
    if (target) handleContactClick(target);
  } else if (e.key === 'Backspace' && searchQuery.value === '') {
    if (mode.value === 'group' && selectedGroupMembers.value.length > 0) {
      selectedGroupMembers.value.pop();
    } else if (mode.value === 'direct' && selectedDirectContact.value) {
      selectedDirectContact.value = null;
    }
  }
};

const handleDialogKeyDown = (e: KeyboardEvent) => {
  if (!isModalActive || e.defaultPrevented) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
    return;
  }

  if (e.key === 'Tab' && dialogPanelRef.value) {
    const focusables = Array.from(
      dialogPanelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => el.getClientRects().length > 0);

    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (!active || active === first || !dialogPanelRef.value.contains(active)) {
        e.preventDefault();
        last?.focus();
      }
    } else if (!active || active === last || !dialogPanelRef.value.contains(active)) {
      e.preventDefault();
      first?.focus();
    }
  }
};

const displayedError = computed(() => props.errorMessage || localError.value);

const submitLabel = computed(() => {
  if (mode.value === 'group') return t.value.createGroup;
  if (selectedDirectContact.value) {
    const firstName =
      selectedDirectContact.value.name.trim().split(/\s+/)[0] ||
      selectedDirectContact.value.name;
    return t.value.chatWith(firstName);
  }
  return t.value.startChat;
});

onMounted(() => {
  if (props.open) {
    activateModal();
  }
});

onUnmounted(() => {
  isUnmounted = true;
  deactivateModal(false);
});
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="handleClose"
        class="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <div
          ref="dialogPanelRef"
          class="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        >
          <!-- HEADER -->
          <div class="relative z-20 flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                :class="lensTheme.soft"
              >
                <Users v-if="mode === 'group'" :size="18" aria-hidden="true" />
                <MessageSquarePlus v-else :size="18" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <h2 :id="titleId" class="text-sm font-bold text-white truncate">
                  {{ mode === 'group' ? t.groupTitle : t.directTitle }}
                </h2>
                <p class="text-[11px] text-slate-400 truncate">
                  {{
                    activeLens === 'DATE'
                      ? t.dateSubtitle
                      : mode === 'group'
                        ? t.groupSubtitle
                        : t.directSubtitle
                  }}
                </p>
              </div>
            </div>

            <AppTooltip :text="t.closeModal" shortcut="Esc" align="right" :disabled="isSubmitting">
              <button
                type="button"
                :disabled="isSubmitting"
                @click="handleClose"
                class="min-w-[44px] min-h-[44px] md:min-w-[34px] md:min-h-[34px] -mr-2 md:mr-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                :aria-label="t.closeModal"
              >
                <X :size="18" aria-hidden="true" />
              </button>
            </AppTooltip>
          </div>

          <!-- TABS MOD (Ascunse automat pe DATE, navigare cu ArrowLeft/ArrowRight) -->
          <div v-if="supportsGroupMode" class="px-5 pt-3.5 shrink-0">
            <div
              role="tablist"
              :aria-label="t.modeTabsAriaLabel"
              class="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-white/5"
            >
              <button
                :id="directTabId"
                ref="directTabRef"
                type="button"
                role="tab"
                :disabled="isSubmitting"
                :aria-selected="mode === 'direct'"
                :aria-controls="tabpanelId"
                :tabindex="mode === 'direct' ? 0 : -1"
                @click="switchMode('direct')"
                @keydown="onModeTabKeyDown"
                class="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="
                  mode === 'direct'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                "
              >
                <UserPlus
                  :size="15"
                  :class="mode === 'direct' ? lensTheme.text : ''"
                  aria-hidden="true"
                />
                <span>{{ t.tabDirect }}</span>
              </button>

              <button
                :id="groupTabId"
                ref="groupTabRef"
                type="button"
                role="tab"
                :disabled="isSubmitting"
                :aria-selected="mode === 'group'"
                :aria-controls="tabpanelId"
                :tabindex="mode === 'group' ? 0 : -1"
                @click="switchMode('group')"
                @keydown="onModeTabKeyDown"
                class="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="
                  mode === 'group'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                "
              >
                <Users
                  :size="15"
                  :class="mode === 'group' ? lensTheme.text : ''"
                  aria-hidden="true"
                />
                <span>{{ t.tabGroup }}</span>
              </button>
            </div>
          </div>

          <!-- CONȚINUT TABPANEL (legat de tablist când supportsGroupMode e activ) -->
          <div
            :id="tabpanelId"
            :role="supportsGroupMode ? 'tabpanel' : undefined"
            :aria-labelledby="supportsGroupMode ? (mode === 'direct' ? directTabId : groupTabId) : undefined"
            class="flex-1 min-h-0 flex flex-col"
          >
            <!-- ZONA DETALII GRUP (Avatar + Nume) -->
            <div v-if="mode === 'group'" class="px-5 pt-3.5 shrink-0">
              <div class="flex items-center gap-3">
                <!-- Uploader Avatar Grup -->
                <div class="relative shrink-0">
                  <input
                    ref="avatarInputRef"
                    type="file"
                    :accept="AVATAR_ACCEPT_ATTR"
                    :disabled="isSubmitting"
                    class="hidden"
                    @change="handleGroupAvatarChange"
                  />
                  <AppTooltip :text="t.uploadGroupAvatar" align="left" :disabled="isSubmitting">
                    <button
                      type="button"
                      :disabled="isSubmitting"
                      @click="avatarInputRef?.click()"
                      class="w-12 h-12 rounded-2xl border border-dashed border-white/20 hover:border-white/40 bg-slate-800/80 flex items-center justify-center overflow-hidden transition-colors cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      :aria-label="t.uploadGroupAvatar"
                    >
                      <img
                        v-if="groupAvatarPreview"
                        :src="groupAvatarPreview"
                        alt=""
                        class="w-full h-full object-cover"
                      />
                      <Camera
                        v-else
                        :size="18"
                        class="text-slate-400 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                    </button>
                  </AppTooltip>

                  <button
                    v-if="groupAvatarPreview"
                    type="button"
                    :disabled="isSubmitting"
                    @click="removeGroupAvatar"
                    class="absolute -top-2 -right-2 w-7 h-7 md:w-5 md:h-5 rounded-full bg-slate-950 border border-white/15 text-slate-300 hover:text-rose-400 flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    :aria-label="t.removeGroupAvatar"
                  >
                    <Trash2 :size="10" aria-hidden="true" />
                  </button>
                </div>

                <!-- Input Nume Grup -->
                <div class="flex-1 min-w-0">
                  <div class="relative">
                    <input
                      ref="groupNameInputRef"
                      v-model="groupName"
                      type="text"
                      :disabled="isSubmitting"
                      :maxlength="maxGroupNameLength"
                      :placeholder="t.groupNamePlaceholder"
                      :aria-label="t.groupNameAriaLabel"
                      @keydown="handleGroupNameKeyDown"
                      class="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 pr-12 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                      :class="lensTheme.ring"
                    />
                    <span
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums text-slate-500"
                      aria-hidden="true"
                    >
                      {{ groupName.length }}/{{ maxGroupNameLength }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- CHIPS MEMBRI SELECTAȚI (Group) -->
            <div
              v-if="mode === 'group' && selectedGroupMembers.length > 0"
              class="px-5 pt-3 shrink-0"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[11px] font-medium text-slate-400">
                  {{ t.selectedMembersHeading }}
                </span>
                <span class="text-[11px] font-mono tabular-nums text-slate-500">
                  {{ selectedGroupMembers.length }} / {{ maxGroupMembers }}
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-hide">
                <span
                  v-for="member in selectedGroupMembers"
                  :key="member.id"
                  class="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full border text-[11px] font-medium"
                  :class="lensTheme.chip"
                >
                  <span class="w-4 h-4 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-[8px] font-bold shrink-0">
                    <img
                      v-if="hasValidAvatar(member)"
                      :src="normalizeUrl(member.avatarUrl) ?? ''"
                      referrerpolicy="no-referrer"
                      @error="markAvatarFailed(member)"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                    <template v-else>{{ getAvatarInitials(member.name, 1) || '?' }}</template>
                  </span>
                  <span class="truncate max-w-[120px]">{{ member.name }}</span>
                  <button
                    type="button"
                    :disabled="isSubmitting"
                    @click="removeGroupMember(member.id)"
                    class="hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                    :aria-label="t.removeMember(member.name)"
                  >
                    <X :size="12" aria-hidden="true" />
                  </button>
                </span>
              </div>
            </div>

            <!-- CĂUTARE CONTACTE (ARIA Combobox legat de Listbox) -->
            <div class="px-5 pt-3.5 pb-2 shrink-0">
              <div class="relative">
                <Search
                  :size="15"
                  class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  ref="searchInputRef"
                  v-model="searchQuery"
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded="true"
                  :aria-controls="listboxId"
                  :aria-activedescendant="activeOptionId"
                  :disabled="isSubmitting"
                  :placeholder="t.searchPlaceholder"
                  :aria-label="t.searchAriaLabel"
                  @keydown="handleSearchKeyDown"
                  class="w-full bg-slate-950/70 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                  :class="lensTheme.ring"
                />
                <button
                  v-if="searchQuery && !isSubmitting"
                  type="button"
                  @click="searchQuery = ''; searchInputRef?.focus()"
                  class="absolute right-0.5 md:right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] md:min-w-[28px] md:min-h-[28px] flex items-center justify-center rounded-md text-slate-400 hover:text-white cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  :aria-label="t.clearSearch"
                >
                  <X :size="13" aria-hidden="true" />
                </button>
              </div>

              <span class="sr-only" aria-live="polite" aria-atomic="true">
                {{ liveAnnouncement }}
              </span>
            </div>

            <!-- BANNER EROARE INLINE -->
            <div
              v-if="displayedError"
              role="alert"
              class="mx-5 mb-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shrink-0"
            >
              <AlertCircle :size="15" class="shrink-0" aria-hidden="true" />
              <span>{{ displayedError }}</span>
            </div>

            <!-- LISTA DE CONTACTE -->
            <div
              :id="listboxId"
              ref="listContainerRef"
              class="flex-1 min-h-0 overflow-y-auto px-3 py-1.5 space-y-1 scrollbar-hide"
              role="listbox"
              :aria-label="t.contactsListAriaLabel"
              :aria-multiselectable="mode === 'group'"
              :aria-busy="isLoading"
            >
              <!-- Loading Skeleton -->
              <template v-if="isLoading">
                <div
                  v-for="n in 3"
                  :key="n"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                >
                  <div class="w-10 h-10 rounded-full bg-slate-800/80 motion-safe:animate-pulse shrink-0" />
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-36 rounded bg-slate-800/80 motion-safe:animate-pulse" />
                    <div class="h-2.5 w-48 rounded bg-slate-800/50 motion-safe:animate-pulse" />
                  </div>
                </div>
              </template>

              <!-- Empty State -->
              <div
                v-else-if="filteredContacts.length === 0"
                class="py-10 px-4 flex flex-col items-center text-center gap-2 text-xs text-slate-400"
              >
                <template v-if="searchQuery.trim()">
                  <p>
                    {{ t.emptySearchPrefix }} "<span class="text-white font-medium">{{
                      searchQuery.trim()
                    }}</span>".
                  </p>
                  <button
                    type="button"
                    @click="searchQuery = ''; searchInputRef?.focus()"
                    class="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  >
                    {{ t.clearSearch }}
                  </button>
                </template>
                <template v-else>
                  <p class="font-semibold text-white">{{ t.emptyContactsTitle }}</p>
                  <p class="max-w-xs text-slate-400">
                    {{
                      activeLens === 'DATE'
                        ? t.emptyContactsDateDescription
                        : t.emptyContactsDescription
                    }}
                  </p>
                </template>
              </div>

              <!-- Contact Rows -->
              <button
                v-else
                v-for="(contact, idx) in filteredContacts"
                :id="getOptionId(idx)"
                :key="contact.id"
                :data-contact-idx="idx"
                type="button"
                role="option"
                :disabled="isSubmitting"
                :aria-selected="
                  mode === 'group'
                    ? isMemberSelected(contact.id)
                    : isDirectSelected(contact.id)
                "
                @pointermove="onContactPointerMove(idx, $event)"
                @click="handleContactClick(contact)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="
                  idx === activeIndex
                    ? lensTheme.activeRow
                    : 'border-transparent hover:bg-slate-800/60'
                "
              >
                <!-- Avatar + Status -->
                <div class="relative shrink-0">
                  <div
                    class="w-10 h-10 rounded-full overflow-hidden border flex items-center justify-center text-xs font-semibold"
                    :class="
                      hasValidAvatar(contact)
                        ? 'bg-slate-800 border-white/10'
                        : `${getAvatarTone(contact.name).surface} ${getAvatarTone(contact.name).border}`
                    "
                  >
                    <img
                      v-if="hasValidAvatar(contact)"
                      :key="getAvatarKey(contact)"
                      :src="normalizeUrl(contact.avatarUrl) ?? ''"
                      referrerpolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      @error="markAvatarFailed(contact)"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                    <span v-else aria-hidden="true">{{
                      getAvatarInitials(contact.name, 2) || '?'
                    }}</span>
                  </div>
                  <span
                    v-if="contact.status"
                    class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 transition-colors duration-300"
                    :class="statusDotClass(contact.status)"
                    aria-hidden="true"
                  />
                </div>

                <!-- Info Contact -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-semibold text-white truncate">{{ contact.name }}</span>
                    <span v-if="contact.username" class="text-[11px] text-slate-500 truncate">
                      @{{ contact.username }}
                    </span>
                    <span
                      v-if="contact.badge"
                      class="px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0"
                      :class="lensTheme.soft"
                    >
                      {{ contact.badge }}
                    </span>
                  </div>
                  <p v-if="contact.role" class="text-[11px] text-slate-400 truncate mt-0.5">
                    {{ contact.role }}
                  </p>
                </div>

                <!-- Indicator dreapta -->
                <div class="shrink-0">
                  <template v-if="mode === 'direct'">
                    <span
                      v-if="getExistingChatId(contact) !== null"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-white/10 text-[10px] font-semibold text-slate-300"
                    >
                      <span>{{ t.openExistingChat }}</span>
                      <ArrowRight :size="11" aria-hidden="true" />
                    </span>
                    <span
                      v-else-if="isDirectSelected(contact.id)"
                      class="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      :class="lensTheme.bg"
                    >
                      <Check :size="12" aria-hidden="true" />
                    </span>
                  </template>

                  <template v-else>
                    <span
                      class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                      :class="
                        isMemberSelected(contact.id)
                          ? `${lensTheme.check} text-white`
                          : 'border-slate-600 bg-slate-950/60'
                      "
                    >
                      <Check v-if="isMemberSelected(contact.id)" :size="12" aria-hidden="true" />
                    </span>
                  </template>
                </div>
              </button>
            </div>

            <!-- DESTINATAR DIRECT + MESAJ OPȚIONAL DE ÎNCEPUT -->
            <div
              v-if="
                (mode === 'direct' && selectedDirectContact) ||
                (mode === 'group' && selectedGroupMembers.length > 0)
              "
              class="px-5 py-3 border-t border-white/10 bg-slate-950/40 shrink-0 space-y-2"
            >
              <div
                v-if="mode === 'direct' && selectedDirectContact"
                class="flex items-center gap-2 text-[11px] text-slate-400"
              >
                <span>{{ t.toLabel }}</span>
                <span
                  class="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full border font-medium"
                  :class="lensTheme.chip"
                >
                  <span class="w-4 h-4 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-[8px] font-bold shrink-0">
                    <img
                      v-if="hasValidAvatar(selectedDirectContact)"
                      :src="normalizeUrl(selectedDirectContact.avatarUrl) ?? ''"
                      referrerpolicy="no-referrer"
                      @error="markAvatarFailed(selectedDirectContact)"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                    <template v-else>{{
                      getAvatarInitials(selectedDirectContact.name, 1) || '?'
                    }}</template>
                  </span>
                  <span class="truncate max-w-[180px]">{{ selectedDirectContact.name }}</span>
                  <button
                    type="button"
                    :disabled="isSubmitting"
                    @click="clearDirectSelection"
                    class="hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                    :aria-label="t.deselectContact(selectedDirectContact.name)"
                  >
                    <X :size="12" aria-hidden="true" />
                  </button>
                </span>
              </div>

              <input
                ref="firstMessageInputRef"
                v-model="initialMessage"
                type="text"
                :maxlength="maxInitialMessageLength"
                :disabled="isSubmitting"
                :placeholder="t.firstMessagePlaceholder"
                :aria-label="t.firstMessageAriaLabel"
                @keydown="handleFirstMessageKeyDown"
                class="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                :class="lensTheme.ring"
              />
            </div>
          </div>

          <!-- FOOTER -->
          <div
            class="px-5 py-3.5 border-t border-white/10 bg-slate-900/95 flex items-center justify-between gap-3 shrink-0"
          >
            <span class="hidden sm:inline text-[11px] text-slate-500">
              <kbd class="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">↑↓</kbd>
              {{ t.keyboardNavigate }} ·
              <kbd class="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd>
              {{ t.keyboardSelect }} ·
              <kbd class="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd>
              {{ t.keyboardClose }}
            </span>

            <div class="flex items-center gap-2 ml-auto">
              <button
                type="button"
                :disabled="isSubmitting"
                @click="handleClose"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {{ t.cancel }}
              </button>

              <AppTooltip
                :text="submitDisabledReason"
                placement="top"
                align="right"
                :disabled="!submitDisabledReason || isSubmitting"
              >
                <button
                  type="button"
                  :aria-disabled="!canSubmit ? 'true' : undefined"
                  @click="handleSubmit"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  :class="[
                    lensTheme.bg,
                    canSubmit
                      ? `${lensTheme.bgHover} cursor-pointer active:scale-95`
                      : 'opacity-40 cursor-not-allowed',
                  ]"
                >
                  <Loader2
                    v-if="isSubmitting"
                    :size="14"
                    class="motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  <span>{{ submitLabel }}</span>
                </button>
              </AppTooltip>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>