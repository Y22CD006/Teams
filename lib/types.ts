export type UserStatus = 'online' | 'busy' | 'away' | 'offline';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: UserStatus;
  email: string;
  customStatus?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  reactions: Reaction[];
  attachments?: Attachment[];
  replyCount?: number;
  isPinned?: boolean;
  isCallNotification?: boolean;
  callDuration?: string;
}

export interface ThreadReply {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  reactions: Reaction[];
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  unreadCount: number;
  messages: Message[];
}

export interface Team {
  id: string;
  name: string;
  avatar: string;
  channels: Channel[];
  membersCount: number;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: User[];
  unreadCount: number;
  messages: Message[];
}

export interface CalendarMeeting {
  id: string;
  title: string;
  organizer: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  attendees: string[];
  isLive?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'xls' | 'ppt' | 'image' | 'zip' | 'code';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  teamId?: string;
  channelId?: string;
}
