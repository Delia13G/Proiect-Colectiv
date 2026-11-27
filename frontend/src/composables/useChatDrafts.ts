// src/composables/useChatDrafts.ts
import { ref, readonly } from 'vue';

const DRAFT_PREFIX = 'chat_draft_';
const DRAFT_DEBOUNCE_MS = 250;

interface PendingWrite {
  value: string;
  timer: ReturnType<typeof setTimeout>;
}

const draftsState = ref<Record<string, string>>({});
const pendingWrites = new Map<string, PendingWrite>();

let isInitialized = false;

const toKey = (chatId: string | number) => String(chatId);
const toStorageKey = (id: string) => `${DRAFT_PREFIX}${id}`;

const commitToStorage = (id: string, value: string) => {
  if (typeof localStorage === 'undefined') return;
  const storageKey = toStorageKey(id);
  try {
    if (value.trim().length > 0) {
      localStorage.setItem(storageKey, value);
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // Ignoră erorile de cotă sau mod privat
  }
};

const flushDraft = (chatId?: string | number) => {
  if (chatId !== undefined) {
    const id = toKey(chatId);
    const pending = pendingWrites.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingWrites.delete(id);
    commitToStorage(id, pending.value);
    return;
  }

  for (const [id, pending] of pendingWrites.entries()) {
    clearTimeout(pending.timer);
    commitToStorage(id, pending.value);
  }
  pendingWrites.clear();
};

const handleStorageEvent = (event: StorageEvent) => {
  if (event.storageArea && typeof localStorage !== 'undefined' && event.storageArea !== localStorage) {
    return;
  }

  if (event.key === null) {
    draftsState.value = {};
    return;
  }

  if (!event.key.startsWith(DRAFT_PREFIX)) return;

  const id = event.key.slice(DRAFT_PREFIX.length);
  const pending = pendingWrites.get(id);
  if (pending) {
    clearTimeout(pending.timer);
    pendingWrites.delete(id);
  }

  const next = { ...draftsState.value };
  if (event.newValue && event.newValue.trim().length > 0) {
    next[id] = event.newValue;
  } else {
    delete next[id];
  }
  draftsState.value = next;
};

const ensureInitialized = () => {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  try {
    const hydrated: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(DRAFT_PREFIX)) continue;
      const value = localStorage.getItem(key);
      if (value && value.trim().length > 0) {
        hydrated[key.slice(DRAFT_PREFIX.length)] = value;
      }
    }
    draftsState.value = hydrated;
  } catch {
    // Ignoră restricțiile de storage
  }

  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('pagehide', () => flushDraft());
};

const getDraft = (chatId: string | number): string => {
  ensureInitialized();
  return draftsState.value[toKey(chatId)] ?? '';
};

const setDraft = (chatId: string | number, value: string) => {
  ensureInitialized();
  const id = toKey(chatId);
  const hasContent = value.trim().length > 0;

  if (hasContent) {
    if (draftsState.value[id] !== value) {
      draftsState.value = { ...draftsState.value, [id]: value };
    }
  } else if (id in draftsState.value) {
    const next = { ...draftsState.value };
    delete next[id];
    draftsState.value = next;
  }

  const existing = pendingWrites.get(id);
  if (existing) clearTimeout(existing.timer);

  const normalized = hasContent ? value : '';
  const timer = setTimeout(() => {
    pendingWrites.delete(id);
    commitToStorage(id, normalized);
  }, DRAFT_DEBOUNCE_MS);

  pendingWrites.set(id, { value: normalized, timer });
};

const clearDraft = (chatId: string | number) => {
  ensureInitialized();
  const id = toKey(chatId);

  const pending = pendingWrites.get(id);
  if (pending) {
    clearTimeout(pending.timer);
    pendingWrites.delete(id);
  }

  if (id in draftsState.value) {
    const next = { ...draftsState.value };
    delete next[id];
    draftsState.value = next;
  }

  commitToStorage(id, '');
};

export function useChatDrafts() {
  ensureInitialized();
  return {
    drafts: readonly(draftsState),
    getDraft,
    setDraft,
    clearDraft,
    flushDraft,
  };
}