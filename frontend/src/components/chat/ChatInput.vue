<!-- src/components/chat/ChatInput.vue -->
<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  computed,
  defineAsyncComponent,
  h,
} from 'vue';
import {
  Paperclip,
  Smile,
  Send,
  Check,
  Mic,
  X,
  Trash2,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next';
import AppTooltip from '../ui/AppTooltip.vue';
import { useAudioRecorder } from '../../composables/useAudioRecorder';
import { useChatDrafts } from '../../composables/useChatDrafts';
import { getAvatarInitials, getAvatarTone } from '../../utils/avatar';
import type { ChatTheme } from '../../types/chat';

// Atât JS-ul (+ dataset-ul emoji), cât și CSS-ul se încarcă lazy abia la deschiderea picker-ului
const LazyEmojiPicker = defineAsyncComponent({
  loader: async () => {
    await import('vue3-emoji-picker/css');
    return import('vue3-emoji-picker');
  },
  delay: 120,
  timeout: 15000,
  loadingComponent: {
    render: () =>
      h(
        'div',
        {
          class:
            'w-[280px] h-[320px] bg-slate-900 flex items-center justify-center text-slate-400',
          'aria-busy': 'true',
        },
        [
          h('div', {
            class:
              'w-6 h-6 border-2 border-slate-700 border-t-slate-200 rounded-full motion-safe:animate-spin',
          }),
        ]
      ),
  },
  errorComponent: {
    render: () =>
      h(
        'div',
        {
          class: 'w-[260px] p-4 bg-slate-900 text-xs text-rose-300 text-center',
          role: 'alert',
        },
        'Failed to load emoji picker.'
      ),
  },
});

export type AttachmentKind = 'image' | 'file';
export type ReplyMediaKind = 'image' | 'audio' | 'file';
export type EnterToSendMode = 'desktop' | 'always' | 'never';

export interface ChatAttachmentItem {
  file: File;
  kind: AttachmentKind;
}

export type ChatSendPayload =
  | { type: 'text'; text: string }
  | { type: 'attachments'; files: ChatAttachmentItem[]; text?: string }
  | { type: 'audio'; file: Blob; duration: number; waveform: number[] };

export interface ChatEditPayload {
  messageId: string | number;
  text: string;
}

/** Date de prezentare pentru Reply — decuplate de modelul complet ChatMessage */
export interface ChatReplyTarget {
  id: string | number;
  text?: string | null;
  authorName?: string | null;
  attachmentKind?: ReplyMediaKind | null;
  attachmentLabel?: string | null;
}

/** Date de prezentare pentru Edit — decuplate de modelul complet ChatMessage */
export interface ChatEditTarget {
  id: string | number;
  text: string;
}

export interface MentionUser {
  id: string | number;
  username: string;
  name?: string;
  avatarUrl?: string | null;
}

export interface SlashCommand {
  command: string;
  description: string;
}

export interface ChatInputLabels {
  placeholder: string;
  editPlaceholder: string;
  disabledPlaceholder: string;
  inputAriaLabel: string;
  editingMessage: string;
  replyingToAuthor: (author: string) => string;
  replyingToMessage: string;
  replyMediaImage: string;
  replyMediaAudio: string;
  replyMediaFile: string;
  replyMediaFallback: string;
  cancelAction: string;
  dismissError: string;
  attachFiles: string;
  attachDisabledEditing: string;
  attachLimitReached: (max: number) => string;
  insertEmoji: string;
  sendMessage: string;
  sendMessageShortcut: string;
  saveChanges: string;
  saveChangesShortcut: string;
  messageOverLimit: string;
  noChangesToSave: string;
  processingAttachments: string;
  recordVoiceMessage: string;
  cancelRecording: string;
  sendVoiceMessage: string;
  recordingHint: string;
  mentionsHeading: string;
  mentionsAriaLabel: string;
  commandsHeading: string;
  commandsAriaLabel: string;
  removeFile: (fileName: string) => string;
  errorMaxFiles: (max: number) => string;
  errorTruncatedFiles: (added: number, max: number) => string;
  errorFileSize: (rejectedCount: number, maxMB: number) => string;
  errorFileType: (rejectedCount: number) => string;
  errorMicrophone: string;
}

const DEFAULT_LABELS: ChatInputLabels = {
  placeholder: 'Type a message...',
  editPlaceholder: 'Edit your message...',
  disabledPlaceholder: 'Messaging is currently unavailable...',
  inputAriaLabel: 'Message input',
  editingMessage: 'Editing message',
  replyingToAuthor: (author) => `Replying to ${author}`,
  replyingToMessage: 'Replying to message',
  replyMediaImage: 'Photo',
  replyMediaAudio: 'Voice message',
  replyMediaFile: 'File',
  replyMediaFallback: 'Attachment',
  cancelAction: 'Cancel action',
  dismissError: 'Dismiss error',
  attachFiles: 'Attach files',
  attachDisabledEditing: 'Attachments unavailable while editing',
  attachLimitReached: (max) => `Maximum ${max} files attached`,
  insertEmoji: 'Emoji',
  sendMessage: 'Send',
  sendMessageShortcut: 'Enter',
  saveChanges: 'Save changes',
  saveChangesShortcut: 'Enter',
  messageOverLimit: 'Message exceeds character limit',
  noChangesToSave: 'No changes to save',
  processingAttachments: 'Processing attachments...',
  recordVoiceMessage: 'Voice message',
  cancelRecording: 'Cancel voice recording (Esc)',
  sendVoiceMessage: 'Send voice message',
  recordingHint: 'Enter to send · Esc to cancel',
  mentionsHeading: 'Members',
  mentionsAriaLabel: 'Mention a member',
  commandsHeading: 'Commands',
  commandsAriaLabel: 'Slash commands',
  removeFile: (fileName) => `Remove ${fileName}`,
  errorMaxFiles: (max) => `You can attach up to ${max} files at once.`,
  errorTruncatedFiles: (added, max) =>
    `Only the first ${added} file(s) were added (max ${max}).`,
  errorFileSize: (count, maxMB) =>
    count === 1
      ? `1 file exceeds the ${maxMB} MB limit.`
      : `${count} files exceed the ${maxMB} MB limit.`,
  errorFileType: (count) =>
    count === 1
      ? '1 file type is not supported.'
      : `${count} file types are not supported.`,
  errorMicrophone: 'Microphone access was denied or is unavailable.',
};

interface NormalizedMention {
  id: string;
  username: string;
  label: string;
  avatarUrl: string | null;
}

interface StagedFile {
  id: string;
  file: File;
  preview: string;
  kind: AttachmentKind;
  sizeLabel: string;
  status: 'compressing' | 'ready';
}

export interface ChatInputProps {
  theme: ChatTheme;
  chatId?: string | number;
  replyingTo?: ChatReplyTarget | null;
  editingTarget?: ChatEditTarget | null;
  mentionUsers?: Array<string | MentionUser>;
  commands?: SlashCommand[];
  disabled?: boolean;
  isSending?: boolean;
  maxLength?: number;
  maxFiles?: number;
  maxFileSizeMB?: number;
  accept?: string;
  allowAttachments?: boolean;
  allowAudio?: boolean;
  allowEmoji?: boolean;
  enterToSend?: EnterToSendMode;
  persistDraft?: boolean;
  labels?: Partial<ChatInputLabels>;
}

// Comprimăm doar formate raster statice (lăsăm GIF-urile animate și SVG-urile intacte)
const COMPRESSIBLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TYPING_IDLE_MS = 2500;
const TYPING_HEARTBEAT_MS = 3000;
const ERROR_AUTO_DISMISS_MS = 4500;

let instanceSeq = 0;

const props = withDefaults(defineProps<ChatInputProps>(), {
  chatId: 'default',
  replyingTo: null,
  editingTarget: null,
  mentionUsers: () => [],
  commands: () => [],
  disabled: false,
  isSending: false,
  maxLength: 4000,
  maxFiles: 10,
  maxFileSizeMB: 25,
  accept: undefined,
  allowAttachments: true,
  allowAudio: true,
  allowEmoji: true,
  enterToSend: 'desktop',
  persistDraft: true,
  labels: () => ({}),
});

const emit = defineEmits<{
  send: [payload: ChatSendPayload];
  edit: [payload: ChatEditPayload];
  'cancel-action': [];
  typing: [status: boolean];
}>();

const instanceId = ++instanceSeq;
const suggestionsListboxId = `chat-input-suggestions-${instanceId}`;
const getSuggestionOptionId = (index: number) =>
  `chat-input-option-${instanceId}-${index}`;

const t = computed<ChatInputLabels>(() => ({
  ...DEFAULT_LABELS,
  ...props.labels,
}));

// --- STATE & REFS ---
const messageText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const emojiContainerRef = ref<HTMLElement | null>(null);
const emojiButtonRef = ref<HTMLButtonElement | null>(null);
const suggestionsPopupRef = ref<HTMLElement | null>(null);
const sendRecordingBtnRef = ref<HTMLButtonElement | null>(null);

const isEditing = computed(() => props.editingTarget !== null);
const trimmedText = computed(() => messageText.value.trim());
const charCount = computed(() => messageText.value.length);
const isOverLimit = computed(() => props.maxLength > 0 && charCount.value > props.maxLength);
const showCharCounter = computed(
  () => props.maxLength > 0 && charCount.value >= Math.floor(props.maxLength * 0.85)
);

// Anunț screen reader o singură dată la depășirea limitei (fără spam pe fiecare caracter)
const limitAnnouncement = ref('');
watch(isOverLimit, (over, wasOver) => {
  if (over) {
    limitAnnouncement.value = t.value.messageOverLimit;
  } else if (wasOver) {
    limitAnnouncement.value = '';
  }
});

// Detectare pointer touch (SSR-safe) pentru comportamentul tastei Enter pe mobil vs. desktop
const isCoarsePointer = ref(false);
let coarseMediaQuery: MediaQueryList | null = null;

const updateCoarsePointer = (event: MediaQueryListEvent) => {
  isCoarsePointer.value = event.matches;
};

const shouldSendOnEnter = computed(() => {
  if (props.enterToSend === 'always') return true;
  if (props.enterToSend === 'never') return false;
  return !isCoarsePointer.value;
});

// --- FEEDBACK ERORI (auto-dismiss) ---
const errorMessage = ref('');
let errorTimeout: ReturnType<typeof setTimeout> | null = null;

const showError = (msg: string) => {
  errorMessage.value = msg;
  if (errorTimeout) clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => {
    errorMessage.value = '';
    errorTimeout = null;
  }, ERROR_AUTO_DISMISS_MS);
};

const clearError = () => {
  errorMessage.value = '';
  if (errorTimeout) {
    clearTimeout(errorTimeout);
    errorTimeout = null;
  }
};

// --- SHARED REACTIVE DRAFTS (sincronizat instant cu ChatListView) ---
const {
  getDraft: getSharedDraft,
  setDraft: setSharedDraft,
  clearDraft: clearSharedDraft,
  flushDraft: flushSharedDraft,
} = useChatDrafts();

const readDraft = (id: string | number = props.chatId): string =>
  props.persistDraft ? getSharedDraft(id) : '';

const scheduleDraftWrite = (value: string, id: string | number = props.chatId) => {
  if (!props.persistDraft) return;
  setSharedDraft(id, value);
};

const clearDraft = (id: string | number = props.chatId) => {
  if (!props.persistDraft) return;
  clearSharedDraft(id);
};

const flushPendingDraft = (id: string | number = props.chatId) => {
  if (!props.persistDraft) return;
  flushSharedDraft(id);
};

// --- TYPING INDICATOR CU HEARTBEAT ---
let typingTimeout: ReturnType<typeof setTimeout> | null = null;
let isCurrentlyTyping = false;
let lastTypingEmitAt = 0;

const stopTypingImmediately = () => {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  lastTypingEmitAt = 0;
  if (isCurrentlyTyping) {
    isCurrentlyTyping = false;
    emit('typing', false);
  }
};

const notifyTyping = () => {
  if (props.disabled || isEditing.value) return;

  if (!trimmedText.value) {
    stopTypingImmediately();
    return;
  }

  const now = Date.now();
  if (!isCurrentlyTyping || now - lastTypingEmitAt >= TYPING_HEARTBEAT_MS) {
    isCurrentlyTyping = true;
    lastTypingEmitAt = now;
    emit('typing', true);
  }

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isCurrentlyTyping = false;
    lastTypingEmitAt = 0;
    typingTimeout = null;
    emit('typing', false);
  }, TYPING_IDLE_MS);
};

// --- TEXTAREA HELPERS ---
const focusInput = (moveCursorToEnd = false) => {
  nextTick(() => {
    const el = textareaRef.value;
    if (!el || props.disabled || isRecording.value) return;
    el.focus();
    if (moveCursorToEnd) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  });
};

const adjustTextareaHeight = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
};

const resetTextareaHeight = () => {
  if (textareaRef.value) textareaRef.value.style.height = 'auto';
};

const insertTextAtCursor = (snippet: string) => {
  if (props.disabled || !snippet) return;
  const el = textareaRef.value;
  const startPos = el?.selectionStart ?? messageText.value.length;
  const endPos = el?.selectionEnd ?? startPos;

  const before = messageText.value.slice(0, startPos);
  const after = messageText.value.slice(endPos);
  messageText.value = `${before}${snippet}${after}`;

  notifyTyping();

  nextTick(() => {
    adjustTextareaHeight();
    if (textareaRef.value) {
      textareaRef.value.focus();
      const newCursorPos = startPos + snippet.length;
      textareaRef.value.setSelectionRange(newCursorPos, newCursorPos);
    }
  });
};

// --- 1. EMOJI PICKER (LAZY) ---
const showEmojiPicker = ref(false);

const handleEmojiEscape = (e: KeyboardEvent) => {
  if (!showEmojiPicker.value) return;
  e.preventDefault();
  e.stopPropagation();
  showEmojiPicker.value = false;
  focusInput();
};

const onSelectEmoji = (emoji: { i: string }) => {
  if (props.disabled) return;
  showEmojiPicker.value = false;
  insertTextAtCursor(emoji.i);
};

// --- 2. MENȚIUNI & COMENZI (ARIA Combobox + protecție mouse-steal) ---
type SuggestionMode = 'mentions' | 'commands' | null;

const suggestionMode = ref<SuggestionMode>(null);
const filteredUsers = ref<NormalizedMention[]>([]);
const filteredCommands = ref<SlashCommand[]>([]);
const selectedSuggestionIndex = ref(0);
const activeWordRange = ref({ start: 0, end: 0 });
const failedMentionAvatars = ref<Set<string>>(new Set());

let lastPointerX = -1;
let lastPointerY = -1;

const isSuggestionsOpen = computed(() => suggestionMode.value !== null);

const activeSuggestionCount = computed(() =>
  suggestionMode.value === 'mentions'
    ? filteredUsers.value.length
    : suggestionMode.value === 'commands'
      ? filteredCommands.value.length
      : 0
);

const activeSuggestionOptionId = computed(() => {
  if (!isSuggestionsOpen.value || activeSuggestionCount.value === 0) return undefined;
  return getSuggestionOptionId(selectedSuggestionIndex.value);
});

const normalizedMentionUsers = computed<NormalizedMention[]>(() => {
  const seen = new Set<string>();
  const result: NormalizedMention[] = [];

  for (const entry of props.mentionUsers) {
    const normalized: NormalizedMention =
      typeof entry === 'string'
        ? { id: entry.trim(), username: entry.trim(), label: entry.trim(), avatarUrl: null }
        : {
            id: String(entry.id),
            username: entry.username.trim(),
            label: entry.name?.trim() || entry.username.trim(),
            avatarUrl: entry.avatarUrl?.trim() || null,
          };

    if (!normalized.id || !normalized.username || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    result.push(normalized);
  }

  return result;
});

watch(
  () => props.mentionUsers,
  () => {
    failedMentionAvatars.value = new Set();
    if (suggestionMode.value === 'mentions') {
      updateSuggestions(false);
    }
  }
);

watch(
  () => props.commands,
  () => {
    if (suggestionMode.value === 'commands') {
      updateSuggestions(false);
    }
  }
);

const getMentionAvatarKey = (user: NormalizedMention) =>
  `${user.id}:${user.avatarUrl ?? ''}`;

const hasValidMentionAvatar = (user: NormalizedMention) =>
  Boolean(user.avatarUrl) && !failedMentionAvatars.value.has(getMentionAvatarKey(user));

const markMentionAvatarFailed = (user: NormalizedMention) => {
  const key = getMentionAvatarKey(user);
  if (failedMentionAvatars.value.has(key)) return;
  const next = new Set(failedMentionAvatars.value);
  next.add(key);
  failedMentionAvatars.value = next;
};

const closeSuggestions = () => {
  suggestionMode.value = null;
};

const scrollActiveSuggestionIntoView = () => {
  nextTick(() => {
    const activeEl = suggestionsPopupRef.value?.querySelector<HTMLElement>('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  });
};

const onOptionPointerMove = (index: number, event: PointerEvent) => {
  // Ignoră evenimentele sintetice declanșate de scroll-ul din tastatură sub un cursor nemișcat
  if (event.clientX === lastPointerX && event.clientY === lastPointerY) return;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  selectedSuggestionIndex.value = index;
};

const updateSuggestions = (resetIndex = false) => {
  const el = textareaRef.value;
  if (!el || props.disabled) {
    closeSuggestions();
    return;
  }

  const cursor = el.selectionStart ?? messageText.value.length;
  const textBeforeCursor = messageText.value.slice(0, cursor);
  const words = textBeforeCursor.split(/[\s\n]+/);
  const lastWord = words[words.length - 1] ?? '';

  activeWordRange.value = { start: cursor - lastWord.length, end: cursor };

  if (lastWord.startsWith('@') && normalizedMentionUsers.value.length > 0) {
    const search = lastWord.slice(1).toLowerCase();
    filteredUsers.value = normalizedMentionUsers.value.filter(
      (u) =>
        u.username.toLowerCase().includes(search) || u.label.toLowerCase().includes(search)
    );
    suggestionMode.value = filteredUsers.value.length > 0 ? 'mentions' : null;
  } else if (
    !isEditing.value &&
    lastWord.startsWith('/') &&
    textBeforeCursor === lastWord &&
    props.commands.length > 0
  ) {
    const search = lastWord.toLowerCase();
    filteredCommands.value = props.commands.filter((c) =>
      c.command.toLowerCase().includes(search)
    );
    suggestionMode.value = filteredCommands.value.length > 0 ? 'commands' : null;
  } else {
    closeSuggestions();
  }

  if (resetIndex) {
    selectedSuggestionIndex.value = 0;
  } else if (selectedSuggestionIndex.value >= activeSuggestionCount.value) {
    selectedSuggestionIndex.value = Math.max(0, activeSuggestionCount.value - 1);
  }
};

const handleInput = () => {
  updateSuggestions(true);
  adjustTextareaHeight();
  notifyTyping();
};

const handleCursorMove = () => {
  updateSuggestions(false);
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.isComposing || e.keyCode === 229) return;
  if (
    isSuggestionsOpen.value &&
    (e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'Enter' ||
      e.key === 'Tab' ||
      e.key === 'Escape')
  ) {
    return;
  }
  if (
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'ArrowUp' ||
    e.key === 'ArrowDown' ||
    e.key === 'Home' ||
    e.key === 'End'
  ) {
    updateSuggestions(false);
  }
};

const replaceWordAtCursor = (replacement: string) => {
  const rangeStart = activeWordRange.value.start;
  const rangeEnd = activeWordRange.value.end;
  const before = messageText.value.slice(0, rangeStart);
  const after = messageText.value.slice(rangeEnd);

  messageText.value = `${before}${replacement}${after}`;
  closeSuggestions();
  notifyTyping();

  nextTick(() => {
    adjustTextareaHeight();
    if (textareaRef.value) {
      textareaRef.value.focus();
      const newCursor = rangeStart + replacement.length;
      textareaRef.value.setSelectionRange(newCursor, newCursor);
    }
  });
};

const insertMention = (user: NormalizedMention) => replaceWordAtCursor(`@${user.username} `);
const insertCommand = (command: string) => replaceWordAtCursor(`${command} `);

const handleKeyDown = (e: KeyboardEvent) => {
  // Protecție IME (caractere compuse / diacritice)
  if (e.isComposing || e.keyCode === 229) return;

  if (isSuggestionsOpen.value) {
    const count = activeSuggestionCount.value;

    if (e.key === 'ArrowDown' && count > 0) {
      e.preventDefault();
      selectedSuggestionIndex.value = (selectedSuggestionIndex.value + 1) % count;
      scrollActiveSuggestionIntoView();
      return;
    }
    if (e.key === 'ArrowUp' && count > 0) {
      e.preventDefault();
      selectedSuggestionIndex.value = (selectedSuggestionIndex.value - 1 + count) % count;
      scrollActiveSuggestionIntoView();
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (suggestionMode.value === 'mentions' && filteredUsers.value[selectedSuggestionIndex.value]) {
        insertMention(filteredUsers.value[selectedSuggestionIndex.value]);
      } else if (
        suggestionMode.value === 'commands' &&
        filteredCommands.value[selectedSuggestionIndex.value]
      ) {
        insertCommand(filteredCommands.value[selectedSuggestionIndex.value].command);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSuggestions();
      return;
    }
  }

  if (e.key === 'Escape') {
    if (showEmojiPicker.value) {
      e.preventDefault();
      showEmojiPicker.value = false;
      focusInput();
      return;
    }
    if (props.replyingTo || props.editingTarget) {
      e.preventDefault();
      emit('cancel-action');
      return;
    }
  }

  if (e.key === 'Enter') {
    const isExplicitShortcut = e.ctrlKey || e.metaKey;
    if (isExplicitShortcut || (!e.shiftKey && shouldSendOnEnter.value)) {
      e.preventDefault();
      handleSend();
    }
  }
};

// --- 3. STAGING, VALIDARE `accept` & COMPRESIE LAZY (Slot reservation sincron) ---
const stagedFiles = ref<StagedFile[]>([]);
const isCompressing = computed(() =>
  stagedFiles.value.some((item) => item.status === 'compressing')
);

let stageSessionId = 0;
let isComponentUnmounted = false;

const createFileId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const matchesAccept = (file: File, accept?: string): boolean => {
  if (!accept || !accept.trim()) return true;
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return tokens.some((token) => {
    if (token === '*/*') return true;
    if (token.startsWith('.')) return fileName.endsWith(token);
    if (token.endsWith('/*')) return fileType.startsWith(token.slice(0, -1));
    return fileType === token;
  });
};

const compressImage = async (file: File): Promise<File> => {
  if (!COMPRESSIBLE_IMAGE_TYPES.has(file.type)) return file;
  try {
    const { default: imageCompression } = await import('browser-image-compression');
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    });
  } catch {
    return file;
  }
};

const addFilesToStage = async (files: File[]) => {
  if (props.disabled || isEditing.value || !props.allowAttachments || files.length === 0) return;

  const remainingSlots = props.maxFiles - stagedFiles.value.length;
  if (remainingSlots <= 0) {
    showError(t.value.errorMaxFiles(props.maxFiles));
    return;
  }

  const maxBytes = props.maxFileSizeMB > 0 ? props.maxFileSizeMB * 1024 * 1024 : Infinity;
  const accepted: File[] = [];
  let rejectedType = 0;
  let rejectedSize = 0;

  for (const file of files) {
    if (!matchesAccept(file, props.accept)) {
      rejectedType++;
      continue;
    }
    if (file.size > maxBytes) {
      rejectedSize++;
      continue;
    }
    if (accepted.length < remainingSlots) {
      accepted.push(file);
    }
  }

  const validCount = files.length - rejectedType - rejectedSize;
  const errors: string[] = [];
  if (rejectedType > 0) errors.push(t.value.errorFileType(rejectedType));
  if (rejectedSize > 0) errors.push(t.value.errorFileSize(rejectedSize, props.maxFileSizeMB));
  if (validCount > remainingSlots) {
    errors.push(t.value.errorTruncatedFiles(remainingSlots, props.maxFiles));
  }
  if (errors.length > 0) {
    showError(errors.join(' '));
  }

  if (accepted.length === 0) return;

  const session = stageSessionId;

  // Rezervăm sincron slot-urile în stagedFiles pentru a elimina race condition-ul pe maxFiles
  const pendingEntries = accepted.map((file) => {
    const isImage = file.type.startsWith('image/');
    const needsCompression = isImage && COMPRESSIBLE_IMAGE_TYPES.has(file.type);
    const entry: StagedFile = {
      id: createFileId(),
      file,
      preview: isImage && !needsCompression ? URL.createObjectURL(file) : '',
      kind: isImage ? 'image' : 'file',
      sizeLabel: formatFileSize(file.size),
      status: needsCompression ? 'compressing' : 'ready',
    };
    return entry;
  });

  stagedFiles.value.push(...pendingEntries);

  for (const entry of pendingEntries) {
    if (entry.status !== 'compressing') continue;

    const compressed = await compressImage(entry.file);
    if (isComponentUnmounted || session !== stageSessionId) return;

    const idx = stagedFiles.value.findIndex((item) => item.id === entry.id);
    // Utilizatorul a eliminat fișierul în timpul compresiei — nu creăm URL orfan
    if (idx === -1) continue;

    stagedFiles.value[idx] = {
      ...stagedFiles.value[idx],
      file: compressed,
      preview: URL.createObjectURL(compressed),
      sizeLabel: formatFileSize(compressed.size),
      status: 'ready',
    };
  }

  if (!isComponentUnmounted && session === stageSessionId) {
    focusInput();
  }
};

const clearStagedFiles = () => {
  stageSessionId++;
  stagedFiles.value.forEach((staged) => {
    if (staged.preview) URL.revokeObjectURL(staged.preview);
  });
  stagedFiles.value = [];
};

const removeStagedFile = (id: string) => {
  const index = stagedFiles.value.findIndex((item) => item.id === id);
  if (index === -1) return;
  const [removed] = stagedFiles.value.splice(index, 1);
  if (removed?.preview) URL.revokeObjectURL(removed.preview);
};

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    addFilesToStage(Array.from(target.files));
  }
  target.value = '';
};

const handlePaste = (e: ClipboardEvent) => {
  if (props.disabled || isEditing.value || !props.allowAttachments) return;
  const files = e.clipboardData?.files;
  if (files && files.length > 0) {
    e.preventDefault();
    addFilesToStage(Array.from(files));
  }
};

// --- 4. LOGICĂ AUDIO (Cu protecție race condition pe permisiune & focus corect) ---
const isStartingAudio = ref(false);

const onAudioStop = (blob: Blob, duration: number, waveform: number[]) => {
  if (isComponentUnmounted || props.disabled || !props.allowAudio) return;
  emit('send', { type: 'audio', file: blob, duration, waveform });
};

const {
  start: startAudio,
  stop: stopAudio,
  cancel: cancelAudio,
  lock: lockAudio,
  isRecording,
  recordTime,
  audioFrequencies,
} = useAudioRecorder(onAudioStop);

const toggleAudioRecording = async () => {
  if (
    props.disabled ||
    props.isSending ||
    isEditing.value ||
    !props.allowAudio ||
    isRecording.value ||
    isStartingAudio.value
  ) {
    return;
  }

  showEmojiPicker.value = false;
  closeSuggestions();
  isStartingAudio.value = true;
  const startedChatId = props.chatId;

  try {
    await startAudio();
    // Dacă starea s-a schimbat cât dialogul de permisiune era deschis, anulăm imediat
    if (
      isComponentUnmounted ||
      props.disabled ||
      !props.allowAudio ||
      isEditing.value ||
      props.chatId !== startedChatId
    ) {
      if (isRecording.value) cancelAudio();
      return;
    }
    if (isRecording.value) {
      lockAudio();
    }
  } catch {
    if (!isComponentUnmounted) {
      showError(t.value.errorMicrophone);
    }
  } finally {
    isStartingAudio.value = false;
  }
};

const handleRecordingKeydown = (e: KeyboardEvent) => {
  if (!isRecording.value || e.defaultPrevented || e.repeat) return;
  if (
    typeof document !== 'undefined' &&
    document.querySelector('[aria-modal="true"], dialog[open]')
  ) {
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    cancelAudio();
    return;
  }

  if (e.key === 'Enter') {
    // Dacă focusul e pe un buton (ex. Cancel sau Send), lăsăm click-ul nativ al butonului
    if (e.target instanceof HTMLButtonElement) return;
    e.preventDefault();
    stopAudio();
  }
};

watch(isRecording, (recording, wasRecording) => {
  if (typeof document === 'undefined') return;
  if (recording) {
    document.addEventListener('keydown', handleRecordingKeydown);
    nextTick(() => sendRecordingBtnRef.value?.focus());
  } else {
    document.removeEventListener('keydown', handleRecordingKeydown);
    if (wasRecording && !isComponentUnmounted) {
      focusInput();
    }
  }
});

const formatTime = (secs: number) => {
  const safe = Number.isFinite(secs) && secs > 0 ? Math.floor(secs) : 0;
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
};

const clampFrequencyHeight = (freq: number) => {
  const safe = Number.isFinite(freq) ? Math.round(freq) : 4;
  return Math.min(36, Math.max(4, safe));
};

// --- 5. DRAFTS, SCHIMBARE CONVERSAȚIE, EDIT & DISABLED ---
let switchDepth = 0;

watch(
  () => props.chatId,
  async (newId, oldId) => {
    switchDepth++;
    // Salvăm sincron orice draft ne-scris pe conversația anterioară înainte de comutare
    if (!isEditing.value && oldId !== undefined) {
      flushPendingDraft(oldId);
    }

    stopTypingImmediately();
    if (isRecording.value) cancelAudio();
    clearStagedFiles();
    closeSuggestions();
    showEmojiPicker.value = false;
    clearError();

    if (!isEditing.value) {
      messageText.value = readDraft(newId);
    }

    await nextTick();
    adjustTextareaHeight();
    switchDepth = Math.max(0, switchDepth - 1);
  }
);

watch(
  () => props.editingTarget,
  (nextTarget, prevTarget) => {
    if (nextTarget) {
      if (!prevTarget) {
        flushPendingDraft();
      }
      stopTypingImmediately();
      if (isRecording.value) cancelAudio();
      clearStagedFiles();
      closeSuggestions();
      showEmojiPicker.value = false;
      messageText.value = nextTarget.text;
      nextTick(() => {
        adjustTextareaHeight();
        focusInput(true);
      });
    } else if (prevTarget) {
      // Restaurăm draft-ul nesalvat abia când părintele închide efectiv modul Edit
      switchDepth++;
      messageText.value = readDraft();
      nextTick(() => {
        if (messageText.value) adjustTextareaHeight();
        else resetTextareaHeight();
        switchDepth = Math.max(0, switchDepth - 1);
        focusInput(true);
      });
    }
  },
  { immediate: true }
);

watch(
  () => props.replyingTo,
  (nextReply) => {
    if (nextReply) focusInput();
  }
);

watch(
  () => props.disabled,
  (isDisabled) => {
    if (!isDisabled) return;
    stopTypingImmediately();
    if (isRecording.value) cancelAudio();
    closeSuggestions();
    showEmojiPicker.value = false;
  }
);

watch(messageText, (val) => {
  if (switchDepth > 0) return;
  if (!isEditing.value) {
    scheduleDraftWrite(val);
  }
  if (!val.trim()) {
    stopTypingImmediately();
  }
});

// --- 6. TRIMITERE & EDITARE MESAJE ---
const isEditUnchanged = computed(
  () => isEditing.value && trimmedText.value === (props.editingTarget?.text.trim() ?? '')
);

const canSend = computed(() => {
  if (props.disabled || props.isSending || isCompressing.value || isOverLimit.value) return false;
  if (isEditing.value) {
    return trimmedText.value.length > 0 && !isEditUnchanged.value;
  }
  return trimmedText.value.length > 0 || stagedFiles.value.length > 0;
});

const showSendButton = computed(
  () =>
    isEditing.value ||
    trimmedText.value.length > 0 ||
    stagedFiles.value.length > 0 ||
    !props.allowAudio
);

const isAttachDisabled = computed(
  () =>
    props.disabled ||
    props.isSending ||
    isEditing.value ||
    stagedFiles.value.length >= props.maxFiles
);

const attachTooltipText = computed(() => {
  if (isEditing.value) return t.value.attachDisabledEditing;
  if (stagedFiles.value.length >= props.maxFiles) {
    return t.value.attachLimitReached(props.maxFiles);
  }
  return t.value.attachFiles;
});

const sendTooltipText = computed(() => {
  if (isOverLimit.value) return t.value.messageOverLimit;
  if (isCompressing.value) return t.value.processingAttachments;
  if (isEditing.value) {
    return isEditUnchanged.value ? t.value.noChangesToSave : t.value.saveChanges;
  }
  return t.value.sendMessage;
});

const sendTooltipShortcut = computed(() => {
  if (!canSend.value || !shouldSendOnEnter.value) return '';
  return isEditing.value ? t.value.saveChangesShortcut : t.value.sendMessageShortcut;
});

const onAttachClick = () => {
  if (isAttachDisabled.value) return;
  fileInputRef.value?.click();
};

const handleSend = () => {
  if (!canSend.value) return;

  const text = trimmedText.value;
  stopTypingImmediately();
  showEmojiPicker.value = false;
  closeSuggestions();

  // În modul Edit NU resetăm textul preventiv — părintele închide editingTarget după succes
  if (isEditing.value && props.editingTarget) {
    emit('edit', {
      messageId: props.editingTarget.id,
      text,
    });
    return;
  }

  if (stagedFiles.value.length > 0) {
    const files: ChatAttachmentItem[] = stagedFiles.value.map((staged) => ({
      file: staged.file,
      kind: staged.kind,
    }));
    clearStagedFiles();
    emit('send', {
      type: 'attachments',
      files,
      text: text || undefined,
    });
  } else {
    emit('send', { type: 'text', text });
  }

  messageText.value = '';
  clearDraft();
  resetTextareaHeight();
  focusInput();
};

// --- 7. CLICK ÎN AFARĂ PENTRU POPUP-URI ---
const handleOutsidePointerDown = (event: PointerEvent) => {
  const target = event.target as Node | null;
  if (!target) return;

  if (
    showEmojiPicker.value &&
    !emojiContainerRef.value?.contains(target) &&
    !emojiButtonRef.value?.contains(target)
  ) {
    showEmojiPicker.value = false;
  }

  if (
    isSuggestionsOpen.value &&
    !suggestionsPopupRef.value?.contains(target) &&
    !textareaRef.value?.contains(target)
  ) {
    closeSuggestions();
  }
};

// --- 8. TEXTE DERIVATIVE PENTRU BANNER REPLY/EDIT ---
const replyPreviewText = computed(() => {
  if (!props.replyingTo) return '';
  const text = props.replyingTo.text?.trim();
  if (text) return text;
  const label = props.replyingTo.attachmentLabel?.trim();
  if (label) return label;

  switch (props.replyingTo.attachmentKind) {
    case 'image':
      return t.value.replyMediaImage;
    case 'audio':
      return t.value.replyMediaAudio;
    case 'file':
      return t.value.replyMediaFile;
    default:
      return t.value.replyMediaFallback;
  }
});

const actionBannerTitle = computed(() => {
  if (isEditing.value) return t.value.editingMessage;
  const author = props.replyingTo?.authorName?.trim();
  return author ? t.value.replyingToAuthor(author) : t.value.replyingToMessage;
});

const placeholderText = computed(() => {
  if (props.disabled) return t.value.disabledPlaceholder;
  if (isEditing.value) return t.value.editPlaceholder;
  return t.value.placeholder;
});

// --- LIFECYCLE & EXPOSE ---
onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    coarseMediaQuery = window.matchMedia('(pointer: coarse)');
    isCoarsePointer.value = coarseMediaQuery.matches;
    coarseMediaQuery.addEventListener?.('change', updateCoarsePointer);
  }

  if (!isEditing.value) {
    const savedDraft = readDraft();
    if (savedDraft) {
      switchDepth++;
      messageText.value = savedDraft;
      nextTick(() => {
        adjustTextareaHeight();
        switchDepth = Math.max(0, switchDepth - 1);
      });
    }
  }

  flushPendingDraft();
  document.addEventListener('pointerdown', handleOutsidePointerDown);
});

onUnmounted(() => {
  isComponentUnmounted = true;
  flushPendingDraft();
  stopTypingImmediately();
  clearStagedFiles();
  clearError();
  coarseMediaQuery?.removeEventListener?.('change', updateCoarsePointer);
  document.removeEventListener('pointerdown', handleOutsidePointerDown);
  document.removeEventListener('keydown', handleRecordingKeydown);
  if (isRecording.value) cancelAudio();
});

defineExpose({
  addFilesToStage,
  clearStagedFiles,
  insertText: insertTextAtCursor,
  focus: (moveCursorToEnd = true) => focusInput(moveCursorToEnd),
});
</script>

<template>
  <footer
    class="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 shrink-0 flex flex-col relative z-30"
  >
    <!-- Banner Eroare Validare / Microfon (rămâne vizibil inclusiv în timpul înregistrării) -->
    <transition name="fade">
      <div
        v-if="errorMessage"
        role="alert"
        class="px-4 py-2 bg-rose-500/15 border-b border-rose-500/25 flex items-center justify-between gap-2 text-xs text-rose-200"
      >
        <div class="flex items-center gap-2 min-w-0">
          <AlertCircle :size="15" class="text-rose-400 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ errorMessage }}</span>
        </div>
        <button
          type="button"
          @click="clearError"
          class="min-w-[44px] min-h-[44px] md:min-w-[28px] md:min-h-[28px] -my-2 -mr-2 md:my-0 md:mr-0 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-rose-300 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-400 shrink-0"
          :aria-label="t.dismissError"
        >
          <X :size="14" aria-hidden="true" />
        </button>
      </div>
    </transition>

    <!-- State Bar (Reply / Edit — rămâne vizibil inclusiv în timpul înregistrării) -->
    <transition name="fade">
      <div
        v-if="replyingTo || editingTarget"
        class="px-4 py-2 border-b border-white/5 bg-slate-800/50 flex justify-between items-center gap-2 relative overflow-hidden"
      >
        <div class="absolute left-0 top-0 bottom-0 w-1" :class="theme.bg" aria-hidden="true" />
        <div class="flex flex-col min-w-0 px-2">
          <span class="text-[11px] font-bold" :class="theme.text">
            {{ actionBannerTitle }}
          </span>
          <span class="text-xs text-slate-400 truncate">
            {{ editingTarget ? editingTarget.text : replyPreviewText }}
          </span>
        </div>
        <button
          type="button"
          @click="emit('cancel-action')"
          class="min-w-[44px] min-h-[44px] md:min-w-[32px] md:min-h-[32px] -my-1 -mr-2 md:my-0 md:mr-0 flex items-center justify-center rounded-full hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400 shrink-0"
          :aria-label="t.cancelAction"
          :title="`${t.cancelAction} (Esc)`"
        >
          <X :size="16" aria-hidden="true" />
        </button>
      </div>
    </transition>

    <!-- Staging Area (Pre-Upload cu sloturi rezervate sincron) -->
    <div
      v-if="stagedFiles.length > 0"
      class="px-4 pt-3 pb-2 flex gap-3 overflow-x-auto scrollbar-hide border-b border-white/5 items-center"
    >
      <div
        v-for="item in stagedFiles"
        :key="item.id"
        :title="`${item.file.name} (${item.sizeLabel})`"
        class="relative w-16 h-16 rounded-xl border border-slate-700 bg-slate-800 shrink-0 overflow-hidden group shadow-md"
      >
        <div
          v-if="item.status === 'compressing'"
          class="w-full h-full flex items-center justify-center bg-slate-800/90"
          :aria-label="t.processingAttachments"
        >
          <div class="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full motion-safe:animate-spin" />
        </div>

        <img
          v-else-if="item.kind === 'image'"
          :src="item.preview"
          :alt="item.file.name"
          class="w-full h-full object-cover"
          draggable="false"
        />

        <div
          v-else
          class="w-full h-full flex flex-col items-center justify-center text-slate-400 px-1"
        >
          <FileText :size="18" aria-hidden="true" />
          <span class="text-[8px] mt-1 font-mono truncate w-full text-center text-slate-300">
            {{
              item.file.name.includes('.')
                ? item.file.name.split('.').pop()?.toUpperCase()
                : 'FILE'
            }}
          </span>
          <span class="text-[8px] text-slate-500">{{ item.sizeLabel }}</span>
        </div>

        <button
          type="button"
          @click="removeStagedFile(item.id)"
          class="absolute top-1 right-1 p-1 bg-slate-900/85 hover:bg-rose-600 rounded-full text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white"
          :aria-label="t.removeFile(item.file.name)"
        >
          <X :size="10" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- UNIFIED SUGGESTIONS POPUP (Mentions / Slash Commands) -->
    <transition name="fade">
      <div
        v-if="isSuggestionsOpen"
        :id="suggestionsListboxId"
        ref="suggestionsPopupRef"
        role="listbox"
        :aria-label="
          suggestionMode === 'mentions' ? t.mentionsAriaLabel : t.commandsAriaLabel
        "
        class="absolute bottom-full mb-1.5 left-4 bg-slate-800/95 backdrop-blur-md border border-slate-700 shadow-xl rounded-xl py-1 max-h-56 overflow-y-auto z-50"
        :class="suggestionMode === 'mentions' ? 'w-56' : 'w-64'"
      >
        <template v-if="suggestionMode === 'mentions'">
          <div class="text-[10px] text-slate-400 font-bold mb-1 px-3 mt-1 uppercase tracking-wider">
            {{ t.mentionsHeading }}
          </div>
          <button
            v-for="(user, idx) in filteredUsers"
            :id="getSuggestionOptionId(idx)"
            :key="user.id"
            type="button"
            role="option"
            :aria-selected="selectedSuggestionIndex === idx"
            :data-active="selectedSuggestionIndex === idx"
            @mousedown.prevent="insertMention(user)"
            @pointermove="onOptionPointerMove(idx, $event)"
            class="w-full px-3 py-1.5 cursor-pointer text-sm flex items-center gap-2.5 text-left transition-colors outline-none"
            :class="selectedSuggestionIndex === idx ? 'bg-slate-700 text-white' : 'text-slate-300'"
          >
            <span
              class="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-semibold"
              :class="hasValidMentionAvatar(user) ? 'bg-slate-700' : getAvatarTone(user.label).surface"
            >
              <img
                v-if="hasValidMentionAvatar(user)"
                :src="user.avatarUrl ?? ''"
                referrerpolicy="no-referrer"
                @error="markMentionAvatarFailed(user)"
                alt=""
                class="w-full h-full object-cover"
              />
              <span v-else>{{ getAvatarInitials(user.label, 1) || '?' }}</span>
            </span>
            <span class="truncate flex-1">{{ user.label }}</span>
            <span v-if="user.label !== user.username" class="text-[11px] text-slate-400 truncate">
              @{{ user.username }}
            </span>
          </button>
        </template>

        <template v-else-if="suggestionMode === 'commands'">
          <div class="text-[10px] text-slate-400 font-bold mb-1 px-3 mt-1 uppercase tracking-wider">
            {{ t.commandsHeading }}
          </div>
          <button
            v-for="(item, idx) in filteredCommands"
            :id="getSuggestionOptionId(idx)"
            :key="item.command"
            type="button"
            role="option"
            :aria-selected="selectedSuggestionIndex === idx"
            :data-active="selectedSuggestionIndex === idx"
            @mousedown.prevent="insertCommand(item.command)"
            @pointermove="onOptionPointerMove(idx, $event)"
            class="w-full px-3 py-1.5 cursor-pointer flex flex-col text-left transition-colors outline-none"
            :class="selectedSuggestionIndex === idx ? 'bg-slate-700' : ''"
          >
            <span
              class="font-mono text-sm"
              :class="selectedSuggestionIndex === idx ? theme.text : 'text-white'"
            >
              {{ item.command }}
            </span>
            <span
              class="text-xs"
              :class="selectedSuggestionIndex === idx ? 'text-slate-300' : 'text-slate-400'"
            >
              {{ item.description }}
            </span>
          </button>
        </template>
      </div>
    </transition>

    <!-- LAZY EMOJI PICKER -->
    <transition name="fade">
      <div
        v-if="allowEmoji && showEmojiPicker"
        ref="emojiContainerRef"
        @keydown.esc="handleEmojiEscape"
        class="absolute bottom-full mb-2 left-4 md:left-12 z-50 shadow-2xl rounded-xl overflow-hidden border border-slate-700 max-w-[calc(100vw-2rem)]"
      >
        <LazyEmojiPicker :native="true" theme="dark" @select="onSelectEmoji" />
      </div>
    </transition>

    <!-- MAIN INPUT BAR WRAPPER (Overlay-ul de recording acoperă strict această zonă) -->
    <div class="relative w-full">
      <!-- RECORDING ACTIVE UI -->
      <div
        v-if="isRecording"
        class="absolute inset-0 bg-slate-900 z-40 flex items-center justify-between px-4 md:px-6 border-t border-rose-500/30 select-none"
      >
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="cancelAudio"
            class="min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center rounded-full bg-slate-800 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            :aria-label="t.cancelRecording"
            :title="t.cancelRecording"
          >
            <Trash2 :size="20" aria-hidden="true" />
          </button>
          <span
            class="font-mono text-sm font-bold text-rose-500 ml-1 tabular-nums"
            aria-live="off"
          >
            {{ formatTime(recordTime) }}
          </span>
        </div>

        <div
          class="flex-1 mx-4 flex items-center gap-[2px] h-10 overflow-hidden justify-center mask-image-gradient"
          aria-hidden="true"
        >
          <div
            v-for="(freq, i) in audioFrequencies"
            :key="i"
            class="w-1 bg-rose-500 rounded-full transition-all duration-75"
            :style="{ height: `${clampFrequencyHeight(freq)}px` }"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="hidden md:inline text-[11px] font-medium text-slate-400 mr-2">
            {{ t.recordingHint }}
          </span>
          <button
            ref="sendRecordingBtnRef"
            type="button"
            @click="stopAudio"
            class="w-11 h-11 md:w-10 md:h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            :aria-label="t.sendVoiceMessage"
          >
            <Send :size="16" class="ml-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- INPUT CONTROLS -->
      <div class="p-3 md:p-4 flex items-end gap-2 max-w-5xl mx-auto w-full">
        <input
          v-if="allowAttachments"
          ref="fileInputRef"
          type="file"
          :accept="accept"
          @change="handleFileUpload"
          class="hidden"
          multiple
        />

        <!-- Textarea Wrapper (include Attach + Emoji + Textarea + Counter) -->
        <div
          class="flex-1 bg-slate-800/50 border rounded-2xl md:rounded-[24px] flex items-end px-1.5 md:px-2 py-1 focus-within:bg-slate-800 transition-all relative"
          :class="[
            isOverLimit
              ? 'border-rose-500/70 focus-within:ring-1 focus-within:ring-rose-500'
              : 'border-slate-700/50 focus-within:ring-1 focus-within:ring-slate-500',
            disabled && 'opacity-60',
          ]"
        >
          <!-- Attach File -->
          <AppTooltip
            v-if="allowAttachments"
            class="shrink-0 mb-0.5"
            :text="attachTooltipText"
            placement="top"
            align="left"
            :disabled="disabled"
          >
            <button
              type="button"
              :aria-disabled="isAttachDisabled ? 'true' : undefined"
              @click="onAttachClick"
              class="min-w-[44px] min-h-[44px] md:min-w-[38px] md:min-h-[38px] flex items-center justify-center rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              :class="
                isAttachDisabled
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60 active:scale-95 cursor-pointer'
              "
              :aria-label="attachTooltipText"
            >
              <Paperclip :size="20" aria-hidden="true" />
            </button>
          </AppTooltip>

          <!-- Emoji Button -->
          <AppTooltip
            v-if="allowEmoji"
            class="shrink-0 mb-0.5"
            :text="t.insertEmoji"
            placement="top"
            align="center"
            :disabled="showEmojiPicker || disabled"
          >
            <button
              ref="emojiButtonRef"
              type="button"
              :disabled="disabled"
              @click="showEmojiPicker = !showEmojiPicker"
              @keydown.esc="handleEmojiEscape"
              :aria-expanded="showEmojiPicker"
              :aria-label="t.insertEmoji"
              class="min-w-[44px] min-h-[44px] md:min-w-[38px] md:min-h-[38px] flex items-center justify-center rounded-full hover:bg-slate-700/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500 cursor-pointer disabled:cursor-not-allowed"
              :class="showEmojiPicker ? theme.text : 'text-slate-400 hover:text-white'"
            >
              <Smile :size="20" aria-hidden="true" />
            </button>
          </AppTooltip>

          <textarea
            ref="textareaRef"
            v-model="messageText"
            :disabled="disabled"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="isSuggestionsOpen"
            :aria-controls="isSuggestionsOpen ? suggestionsListboxId : undefined"
            :aria-activedescendant="activeSuggestionOptionId"
            :aria-invalid="isOverLimit ? 'true' : undefined"
            @input="handleInput"
            @click="handleCursorMove"
            @select="handleCursorMove"
            @keyup="handleKeyUp"
            @keydown="handleKeyDown"
            @paste="handlePaste"
            rows="1"
            :placeholder="placeholderText"
            :aria-label="t.inputAriaLabel"
            class="flex-1 bg-transparent border-none text-[13px] md:text-sm text-white placeholder:text-slate-500 focus:ring-0 resize-none overflow-y-auto min-h-[40px] py-2.5 px-2 outline-none scrollbar-hide disabled:cursor-not-allowed"
          />

          <!-- Contor caractere (vizual; screen reader-ul anunță o singură dată la depășire) -->
          <span
            v-if="showCharCounter"
            class="text-[10px] font-mono tabular-nums pr-2 pb-2.5 shrink-0 select-none"
            :class="isOverLimit ? 'text-rose-400 font-semibold' : 'text-slate-400'"
            aria-hidden="true"
          >
            {{ maxLength - charCount }}
          </span>
          <span class="sr-only" aria-live="polite" aria-atomic="true">
            {{ limitAnnouncement }}
          </span>
        </div>

        <!-- Send / Save Edit Button -->
        <AppTooltip
          v-if="showSendButton"
          class="shrink-0 mb-1"
          :text="sendTooltipText"
          :shortcut="sendTooltipShortcut"
          placement="top"
          align="right"
          :disabled="disabled || isSending"
        >
          <button
            type="button"
            :aria-disabled="!canSend ? 'true' : undefined"
            @click="handleSend"
            class="w-11 h-11 rounded-full text-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex items-center justify-center transition-all"
            :class="[
              theme.bg,
              canSend
                ? 'cursor-pointer hover:scale-105 active:scale-95'
                : 'opacity-40 cursor-not-allowed',
            ]"
            :aria-label="sendTooltipText"
          >
            <Loader2
              v-if="isSending"
              :size="18"
              class="motion-safe:animate-spin"
              aria-hidden="true"
            />
            <Check v-else-if="isEditing" :size="18" aria-hidden="true" />
            <Send v-else :size="18" aria-hidden="true" />
          </button>
        </AppTooltip>

        <!-- Voice Record Button -->
        <AppTooltip
          v-else
          class="shrink-0 mb-1"
          :text="t.recordVoiceMessage"
          placement="top"
          align="right"
          :disabled="disabled || isStartingAudio"
        >
          <button
            type="button"
            :disabled="disabled || isSending || isStartingAudio"
            @click="toggleAudioRecording"
            class="w-11 h-11 rounded-full text-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex items-center justify-center transition-all duration-200 cursor-pointer select-none enabled:hover:scale-110 enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            :class="theme.bg"
            :aria-label="t.recordVoiceMessage"
          >
            <Loader2
              v-if="isStartingAudio"
              :size="18"
              class="motion-safe:animate-spin"
              aria-hidden="true"
            />
            <Mic v-else :size="18" aria-hidden="true" />
          </button>
        </AppTooltip>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
.mask-image-gradient {
  -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
}
</style>