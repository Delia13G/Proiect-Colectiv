// src/types/chat.ts
export interface ChatMessage {
  id: number;
  text: string;
  isMine: boolean;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed'; // Am adăugat 'failed'
  type: 'text' | 'image' | 'audio' | 'file';
  reactions?: Record<string, string>;
  attachment?: string;
  duration?: string;
  waveform?: number[];
  replyToId?: number;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface ChatTheme {
  text: string;
  bg: string;
  bgLight: string;
  border: string;
  hover: string;
}

export interface ChatUser {
  name: string;
  avatar: string;
  status: string;
  isTyping: boolean;
}