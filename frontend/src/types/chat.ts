// src/types/chat.ts
export type ChatEntityId = string | number;
export type ChatLens = 'PRO' | 'SOCIAL' | 'DATE';
export type ChatPresenceStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatMessageType = 'text' | 'image' | 'audio' | 'file' | 'attachments';
export type ChatAttachmentKind = 'image' | 'file';

export interface ChatMessageAttachment {
  id?: ChatEntityId;
  url: string;
  kind: ChatAttachmentKind;
  fileName?: string;
  fileSize?: number | string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: ChatEntityId;
  text?: string;
  isMine: boolean;
  timestamp: Date | string | number;
  status: ChatMessageStatus;
  type: ChatMessageType;
  /** Mapă emoji -> lista de userId-uri care au reacționat */
  reactions?: Record<string, ChatEntityId | ChatEntityId[]>;
  /** Atașament unic (audio / imagine / fișier) */
  attachment?: string;
  /** Atașamente multiple (albume foto / loturi de fișiere din ChatInput) */
  attachments?: ChatMessageAttachment[];
  fileName?: string;
  fileSize?: number | string;
  /** Secunde (number din useAudioRecorder) sau string formatat ("0:14") */
  duration?: number | string;
  waveform?: number[];
  replyToId?: ChatEntityId;
  isEdited?: boolean;
  isDeleted?: boolean;
  // Câmpuri opționale pentru chat-uri de grup
  senderId?: ChatEntityId;
  senderName?: string;
  senderAvatar?: string | null;
}

export interface ChatTheme {
  text: string;
  bg: string;
  bgLight: string;
  border: string;
  hover: string;
  mark?: string;
}

export interface ChatUser {
  id?: ChatEntityId;
  name: string;
  username?: string;
  avatar?: string | null;
  status?: ChatPresenceStatus | string;
  isTyping?: boolean;
  lastSeenAt?: Date | string | number | null;
}