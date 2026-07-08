import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Message } from '@/lib/types';

export function useChat(channelId?: string, dmId?: string) {
  const queryClient = useQueryClient();
  const queryKey = channelId ? ['messages', 'channel', channelId] : ['messages', 'dm', dmId];

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey,
    queryFn: async () => {
      if (!channelId && !dmId) return [];
      const res = await fetch(`/api/messages?${channelId ? `channelId=${channelId}` : `dmId=${dmId}`}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();

      return data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.createdAt,
        senderId: msg.author.id,
        senderName: msg.author.name,
        senderAvatar: msg.author.imageUrl ? msg.author.imageUrl.substring(0,2).toUpperCase() : msg.author.name.substring(0,2).toUpperCase(),
        reactions: [],
      }));
    },
    enabled: !!channelId || !!dmId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!channelId && !dmId) return;

    const params = new URLSearchParams();
    if (channelId) params.set('channelId', channelId);
    if (dmId) params.set('dmId', dmId);

    const eventSource = new EventSource(`/api/messages/subscribe?${params}`);

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const formattedMessage: Message = {
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar || msg.senderName.substring(0, 2).toUpperCase(),
          reactions: [],
        };

        queryClient.setQueryData(queryKey, (old: Message[] = []) => {
          if (old.some((m) => m.id === formattedMessage.id)) return old;
          return [...old, formattedMessage];
        });
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      eventSource.close();
    };
  }, [channelId, dmId, queryClient, queryKey]);

  const sendMessage = async (content: string) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, channelId, dmId }),
    });
    if (res.ok) {
      const data = await res.json();
      const formatted: Message = {
        id: data.message.id,
        content: data.message.content,
        timestamp: data.message.timestamp,
        senderId: data.message.senderId,
        senderName: data.message.senderName,
        senderAvatar: data.message.senderAvatar || data.message.senderName.substring(0, 2).toUpperCase(),
        reactions: [],
      };
      queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, formatted]);
    }
  };

  return { messages, isLoading, sendMessage };
}
