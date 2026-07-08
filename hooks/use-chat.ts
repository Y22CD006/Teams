import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPusherClient } from '@/lib/pusher';
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
      
      // Map prisma author model to frontend expected format
      return       data.messages.map((msg: any) => ({
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
  });

  useEffect(() => {
    if (!channelId && !dmId) return;

    const pusherChannelName = channelId ? `channel-${channelId}` : `dm-${dmId}`;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(pusherChannelName);

    channel.bind('new-message', (msg: any) => {
      const formattedMessage: Message = {
        id: msg.id,
        content: msg.content,
        timestamp: msg.createdAt,
        senderId: msg.author.id,
        senderName: msg.author.name,
        senderAvatar: msg.author.imageUrl ? msg.author.imageUrl.substring(0,2).toUpperCase() : msg.author.name.substring(0,2).toUpperCase(),
        reactions: [],
      };

      queryClient.setQueryData(queryKey, (oldMessages: Message[] = []) => {
        if (oldMessages.some((m) => m.id === formattedMessage.id)) {
          return oldMessages;
        }
        return [...oldMessages, formattedMessage];
      });
    });

    return () => {
      channel.unbind('new-message');
      pusher.unsubscribe(pusherChannelName);
    };
  }, [channelId, dmId, queryClient, queryKey]);

  const sendMessage = async (content: string) => {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, channelId, dmId }),
    });
  };

  return { messages, isLoading, sendMessage };
}
