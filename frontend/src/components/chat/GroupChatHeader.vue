<!-- src/components/chat/GroupChatHeader.vue -->
<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { Users } from 'lucide-vue-next';
import ChatHeader, {
  type BackButtonVisibility,
  type ChatHeaderCallControls,
  type ChatHeaderLabelOverrides,
  type ChatHeaderPanelsState,
  type ChatHeaderSubject,
  type ConnectionStatus,
  type DisclosurePanelState,
} from './ChatHeader.vue';
import AppTooltip from '../ui/AppTooltip.vue';
import { getAvatarInitials, getAvatarTone } from '../../utils/avatar';
import type { ChatTheme } from '../../types/chat';

export interface GroupAvatarMember {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

/** Date de prezentare pentru un grup — decuplate de modelul complet din store/backend */
export interface GroupHeaderSubject {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
  membersCount?: number;
  onlineCount?: number;
  members?: GroupAvatarMember[];
  typingUsers?: string[];
  isMuted?: boolean;
}

export interface GroupChatHeaderPanelsState extends ChatHeaderPanelsState {
  members?: DisclosurePanelState;
}

export interface GroupChatHeaderLabels {
  viewGroupInfo: string;
  unnamedGroup: string;
  membersCount: (count: number, formatted: string) => string;
  onlineCount: (count: number, formatted: string) => string;
  membersButton: (count: number | null, formatted: string | null) => string;
  typingSingle: (first: string) => string;
  typingDouble: (first: string, second: string) => string;
  typingMultiple: (first: string, othersCount: number, formattedOthers: string) => string;
}

const DEFAULT_GROUP_LABELS: GroupChatHeaderLabels = {
  viewGroupInfo: 'View group info',
  unnamedGroup: 'Unnamed group',
  membersCount: (count, formatted) => (count === 1 ? '1 member' : `${formatted} members`),
  onlineCount: (_count, formatted) => `${formatted} online`,
  membersButton: (_count, formatted) => (formatted !== null ? `Members (${formatted})` : 'Members'),
  typingSingle: (first) => `${first} is typing`,
  typingDouble: (first, second) => `${first} and ${second} are typing`,
  typingMultiple: (first, _othersCount, formattedOthers) =>
    `${first} and ${formattedOthers} others are typing`,
};

export interface GroupChatHeaderProps {
  theme: ChatTheme;
  group: GroupHeaderSubject | null;
  isLoading?: boolean;
  connectionStatus?: ConnectionStatus;
  calls?: ChatHeaderCallControls;
  panels?: GroupChatHeaderPanelsState;
  showSearch?: boolean;
  showMembersButton?: boolean;
  highlightOnlineSubtitle?: boolean;
  backButton?: BackButtonVisibility;
  unreadChatsCount?: number;
  enableShortcuts?: boolean;
  sticky?: boolean;
  locale?: string;
  labels?: ChatHeaderLabelOverrides;
  groupLabels?: Partial<GroupChatHeaderLabels>;
}

const props = withDefaults(defineProps<GroupChatHeaderProps>(), {
  isLoading: false,
  connectionStatus: 'connected',
  calls: () => ({}),
  panels: () => ({}),
  showSearch: true,
  showMembersButton: true,
  highlightOnlineSubtitle: false,
  backButton: 'auto',
  unreadChatsCount: 0,
  enableShortcuts: true,
  sticky: true,
  locale: undefined,
  labels: () => ({}),
  groupLabels: () => ({}),
});

const emit = defineEmits<{
  back: [];
  openProfile: [];
  openMembers: [];
  search: [];
  voiceCall: [];
  videoCall: [];
  options: [];
}>();

// Focus management combinat (ChatHeader + butonul Members)
const chatHeaderRef = ref<InstanceType<typeof ChatHeader> | null>(null);
const membersBtnRef = ref<HTMLButtonElement | null>(null);

defineExpose({
  focusBackButton: () => chatHeaderRef.value?.focusBackButton(),
  focusProfileButton: () => chatHeaderRef.value?.focusProfileButton(),
  focusSearchButton: () => chatHeaderRef.value?.focusSearchButton(),
  focusOptionsButton: () => chatHeaderRef.value?.focusOptionsButton(),
  focusMembersButton: () => membersBtnRef.value?.focus(),
});

const gt = computed<GroupChatHeaderLabels>(() => ({
  ...DEFAULT_GROUP_LABELS,
  ...props.groupLabels,
}));

// Protecție împotriva locale-urilor invalide (ex. "ro_RO" sau "")
const numberFormatter = computed(() => {
  try {
    return new Intl.NumberFormat(props.locale || undefined);
  } catch {
    return new Intl.NumberFormat();
  }
});

const formatCount = (value: number) => numberFormatter.value.format(value);

const sanitizeCount = (value: number | undefined): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value > 0 ? Math.floor(value) : 0;
};

const getNormalizedAvatarUrl = (url?: string | null): string | null => {
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
};

const getAvatarKey = (member: GroupAvatarMember) =>
  `${member.id}:${getNormalizedAvatarUrl(member.avatarUrl) ?? ''}`;

// Evidență încărcare + erori per (member.id + avatarUrl), cu sincronizare cache
const loadedAvatarKeys = ref<Set<string>>(new Set());
const failedAvatarKeys = ref<Set<string>>(new Set());
const stackedImgRefs = new Map<string, HTMLImageElement>();

const setStackedImgRef = (key: string, el: unknown) => {
  if (el instanceof HTMLImageElement) {
    stackedImgRefs.set(key, el);
  } else {
    stackedImgRefs.delete(key);
  }
};

const markAvatarLoaded = (key: string) => {
  if (loadedAvatarKeys.value.has(key)) return;
  const next = new Set(loadedAvatarKeys.value);
  next.add(key);
  loadedAvatarKeys.value = next;
};

const markAvatarFailed = (key: string) => {
  if (failedAvatarKeys.value.has(key)) return;
  const next = new Set(failedAvatarKeys.value);
  next.add(key);
  failedAvatarKeys.value = next;
};

const syncCachedStackedImages = async () => {
  await nextTick();
  for (const [key, img] of stackedImgRefs.entries()) {
    if (!img.complete) continue;
    if (img.naturalWidth > 0) {
      markAvatarLoaded(key);
    } else {
      markAvatarFailed(key);
    }
  }
};

const hasValidMemberAvatar = (member: GroupAvatarMember) => {
  const url = getNormalizedAvatarUrl(member.avatarUrl);
  return Boolean(url) && !failedAvatarKeys.value.has(getAvatarKey(member));
};

const isMemberAvatarLoaded = (member: GroupAvatarMember) =>
  loadedAvatarKeys.value.has(getAvatarKey(member));

// Deduplicare după member.id pentru a preveni duplicate keys și numărare falsă din WebSocket
const uniqueMembers = computed<GroupAvatarMember[]>(() => {
  const list = props.group?.members ?? [];
  const seen = new Set<string>();
  const result: GroupAvatarMember[] = [];

  for (const member of list) {
    if (!member.id || seen.has(member.id)) continue;
    seen.add(member.id);
    result.push(member);
  }

  return result;
});

const stackedMembers = computed(() => uniqueMembers.value.slice(0, 3));
const groupAvatarUrl = computed(() => getNormalizedAvatarUrl(props.group?.avatarUrl));
const useStackedAvatars = computed(
  () => !groupAvatarUrl.value && stackedMembers.value.length >= 2
);

watch(
  () => props.group?.id,
  () => {
    loadedAvatarKeys.value = new Set();
    failedAvatarKeys.value = new Set();
    syncCachedStackedImages();
  }
);

watch(
  () => props.connectionStatus,
  (nextStatus, prevStatus) => {
    if (nextStatus === 'connected' && prevStatus && prevStatus !== 'connected') {
      failedAvatarKeys.value = new Set();
      syncCachedStackedImages();
    }
  }
);

watch(
  () => stackedMembers.value.map(getAvatarKey).join('|'),
  () => {
    syncCachedStackedImages();
  }
);

onMounted(() => {
  syncCachedStackedImages();
});

// Poziționare diagonală pentru 2 membri, triunghi echilibrat pentru 3 membri
const getStackItemClass = (index: number) => {
  if (stackedMembers.value.length === 2) {
    return index === 0 ? 'w-7 h-7 top-0 left-0 z-20' : 'w-7 h-7 bottom-0 right-0 z-10';
  }
  switch (index) {
    case 0:
      return 'w-6 h-6 top-0 left-1/2 -translate-x-1/2 z-30';
    case 1:
      return 'w-6 h-6 bottom-0 left-0 z-20';
    default:
      return 'w-6 h-6 bottom-0 right-0 z-10';
  }
};

// Titlu cu fallback pe numele membrilor pentru grupuri fără nume custom
const resolvedGroupTitle = computed(() => {
  const explicitName = props.group?.name?.trim();
  if (explicitName) return explicitName;

  const memberNames = uniqueMembers.value
    .map((member) => member.name.trim())
    .filter(Boolean)
    .slice(0, 3);

  return memberNames.length > 0 ? memberNames.join(', ') : gt.value.unnamedGroup;
});

// Distinge explicit între necunoscut (null) și 0 membri
const safeMembersCount = computed<number | null>(() => {
  if (!props.group) return null;
  const explicit = sanitizeCount(props.group.membersCount);
  if (explicit !== null) return explicit;
  if (props.group.members !== undefined) return uniqueMembers.value.length;
  return null;
});

const safeOnlineCount = computed(() => {
  const raw = sanitizeCount(props.group?.onlineCount) ?? 0;
  if (safeMembersCount.value === null) return raw;
  return Math.min(raw, safeMembersCount.value);
});

const subtitle = computed(() => {
  if (!props.group) return '';
  if (safeMembersCount.value === null) {
    return safeOnlineCount.value > 0
      ? gt.value.onlineCount(safeOnlineCount.value, formatCount(safeOnlineCount.value))
      : '';
  }

  const total = safeMembersCount.value;
  const membersPart = gt.value.membersCount(total, formatCount(total));

  if (safeOnlineCount.value <= 0) return membersPart;

  const onlinePart = gt.value.onlineCount(
    safeOnlineCount.value,
    formatCount(safeOnlineCount.value)
  );
  return `${membersPart} · ${onlinePart}`;
});

const typingText = computed<string | null>(() => {
  const seen = new Set<string>();
  const uniqueTypers: string[] = [];

  for (const rawName of props.group?.typingUsers ?? []) {
    const trimmed = rawName.trim();
    if (!trimmed) continue;
    const dedupKey = trimmed.toLowerCase();
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    uniqueTypers.push(trimmed);
  }

  if (uniqueTypers.length === 0) return null;
  if (uniqueTypers.length === 1) {
    return gt.value.typingSingle(uniqueTypers[0]);
  }
  if (uniqueTypers.length === 2) {
    return gt.value.typingDouble(uniqueTypers[0], uniqueTypers[1]);
  }

  const othersCount = uniqueTypers.length - 1;
  return gt.value.typingMultiple(uniqueTypers[0], othersCount, formatCount(othersCount));
});

const headerSubject = computed<ChatHeaderSubject | null>(() => {
  if (!props.group) return null;
  return {
    title: resolvedGroupTitle.value,
    subtitle: subtitle.value,
    avatarUrl: groupAvatarUrl.value,
    typingText: typingText.value,
    isMuted: props.group.isMuted,
    highlightSubtitle: props.highlightOnlineSubtitle && safeOnlineCount.value > 0,
  };
});

const headerPanels = computed<ChatHeaderPanelsState>(() => ({
  profile: props.panels.profile,
  search: props.panels.search,
  options: props.panels.options,
}));

const membersPanel = computed(() => props.panels.members);

const membersButtonText = computed(() => {
  const count = safeMembersCount.value;
  return gt.value.membersButton(count, count !== null ? formatCount(count) : null);
});

const mergedLabels = computed<ChatHeaderLabelOverrides>(() => ({
  viewProfileDetails: gt.value.viewGroupInfo,
  ...props.labels,
}));
</script>

<template>
  <ChatHeader
    ref="chatHeaderRef"
    :theme="theme"
    :subject="headerSubject"
    :is-loading="isLoading"
    :connection-status="connectionStatus"
    :calls="calls"
    :panels="headerPanels"
    :show-search="showSearch"
    :back-button="backButton"
    :unread-chats-count="unreadChatsCount"
    :enable-shortcuts="enableShortcuts"
    :sticky="sticky"
    :labels="mergedLabels"
    @back="emit('back')"
    @open-profile="emit('openProfile')"
    @search="emit('search')"
    @voice-call="emit('voiceCall')"
    @video-call="emit('videoCall')"
    @options="emit('options')"
  >
    <!-- Avatare suprapuse (inițiale vizibile până la @load, fără cerc gol pe rețele lente) -->
    <template v-if="$slots.avatar || useStackedAvatars" #avatar>
      <slot name="avatar">
        <span class="relative block w-10 h-10 shrink-0" aria-hidden="true">
          <span
            v-for="(member, index) in stackedMembers"
            :key="member.id"
            class="absolute rounded-full overflow-hidden border-2 border-slate-900 bg-slate-900 shadow-sm"
            :class="getStackItemClass(index)"
          >
            <span
              v-if="!hasValidMemberAvatar(member) || !isMemberAvatarLoaded(member)"
              class="absolute inset-0 flex items-center justify-center text-[10px] font-semibold"
              :class="getAvatarTone(member.name).surface"
            >
              {{ getAvatarInitials(member.name, 1) || '?' }}
            </span>

            <img
              v-if="hasValidMemberAvatar(member)"
              :key="getAvatarKey(member)"
              :ref="(el) => setStackedImgRef(getAvatarKey(member), el)"
              :src="getNormalizedAvatarUrl(member.avatarUrl) ?? ''"
              referrerpolicy="no-referrer"
              @load="markAvatarLoaded(getAvatarKey(member))"
              @error="markAvatarFailed(getAvatarKey(member))"
              alt=""
              decoding="async"
              draggable="false"
              class="relative w-full h-full object-cover transition-opacity duration-200"
              :class="isMemberAvatarLoaded(member) ? 'opacity-100' : 'opacity-0'"
            />
          </span>
        </span>
      </slot>
    </template>

    <template v-if="$slots.badge" #badge>
      <slot name="badge" />
    </template>

    <template v-if="showMembersButton || $slots.actions" #actions>
      <!-- Pe < sm lista de membri se accesează din meniul MoreOptions sau click pe header -->
      <AppTooltip
        v-if="showMembersButton"
        class="hidden sm:block"
        :text="membersButtonText"
        align="right"
        :disabled="Boolean(membersPanel?.isOpen)"
      >
        <button
          ref="membersBtnRef"
          type="button"
          @click="emit('openMembers')"
          :aria-expanded="Boolean(membersPanel?.isOpen)"
          :aria-controls="membersPanel?.controlsId || undefined"
          class="flex min-w-[44px] min-h-[44px] md:min-w-[40px] md:min-h-[40px] rounded-xl active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500 justify-center items-center cursor-pointer"
          :class="
            membersPanel?.isOpen
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          "
          :aria-label="membersButtonText"
        >
          <Users :size="18" aria-hidden="true" />
        </button>
      </AppTooltip>

      <slot name="actions" />
    </template>

    <template v-if="$slots['sub-header']" #sub-header>
      <slot name="sub-header" />
    </template>
  </ChatHeader>
</template>