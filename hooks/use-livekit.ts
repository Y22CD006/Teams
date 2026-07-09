"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  ConnectionState,
  DisconnectReason,
  VideoPresets,
} from "livekit-client";

interface UseLiveKitOptions {
  url: string;
  token: string;
  roomName: string;
  onLeave?: () => void;
}

interface UseLiveKitReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  participants: RemoteParticipant[];
  activeSpeakers: Participant[];
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  localParticipant: LocalParticipant | null;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  disconnect: () => void;
  room: React.MutableRefObject<Room | null>;
}

export function useLiveKit({
  url,
  token,
  roomName,
  onLeave,
}: UseLiveKitOptions): UseLiveKitReturn {
  const roomRef = useRef<Room | null>(null);
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;
  const connectPromiseRef = useRef<Promise<void> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);

  const updateParticipants = useCallback((room: Room) => {
    setParticipants(Array.from(room.remoteParticipants.values()));
  }, []);

  const refreshLocalState = useCallback((room: Room) => {
    const lp = room.localParticipant;
    if (!lp) return;
    setIsMicEnabled(lp.isMicrophoneEnabled);
    setIsCameraEnabled(lp.isCameraEnabled);
    setIsScreenSharing(lp.isScreenShareEnabled);
  }, []);

  useEffect(() => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720,
      },
    });

    roomRef.current = room;

    const handleConnected = () => {
      if (roomRef.current !== room) return;
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      setLocalParticipant(room.localParticipant);
      updateParticipants(room);
      refreshLocalState(room);
    };

    const handleDisconnected = (reason?: DisconnectReason) => {
      setIsConnected(false);
      setIsConnecting(false);
      setParticipants([]);
      setActiveSpeakers([]);
      setLocalParticipant(null);
      if (reason === DisconnectReason.ROOM_CLOSED) {
        onLeaveRef.current?.();
      }
    };

    const handleParticipantConnected = () => {
      updateParticipants(room);
    };

    const handleParticipantDisconnected = () => {
      updateParticipants(room);
    };

    const handleActiveSpeakersChanged = (speakers: Participant[]) => {
      setActiveSpeakers(speakers as RemoteParticipant[]);
    };

    const handleTrackPublished = () => {
      refreshLocalState(room);
    };

    const handleTrackUnpublished = () => {
      refreshLocalState(room);
    };

    const handleTrackSubscribed = () => {
      updateParticipants(room);
    };

    const handleTrackUnsubscribed = () => {
      updateParticipants(room);
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
    room.on(RoomEvent.LocalTrackPublished, handleTrackPublished);
    room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
      room.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
      room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);

      if (room.state !== ConnectionState.Disconnected) {
        try {
          room.disconnect();
        } catch (e) {
          console.warn("[useLiveKit] disconnect error:", e);
        }
      }

      if (roomRef.current === room) {
        roomRef.current = null;
        connectPromiseRef.current = null;
      }
    };
  }, [updateParticipants, refreshLocalState]);

  useEffect(() => {
    if (!url || !token || !roomName) return;
    if (isConnected) return;
    if (connectPromiseRef.current) return;

    const room = roomRef.current;
    if (!room) return;

    setIsConnecting(true);
    setError(null);

    connectPromiseRef.current = room.connect(url, token);
    connectPromiseRef.current
      .catch((err) => {
        if (roomRef.current !== room) return;
        setIsConnecting(false);
        setError(err instanceof Error ? err.message : "Failed to connect to room");
      })
      .finally(() => {
        if (roomRef.current === room) {
          connectPromiseRef.current = null;
        }
      });
  }, [url, token, roomName, isConnected]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room?.localParticipant) return;
    const enabled = !room.localParticipant.isMicrophoneEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(enabled);
      setIsMicEnabled(enabled);
    } catch (err) {
      console.warn("toggleMic failed:", err);
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (!room?.localParticipant) return;
    const enabled = !room.localParticipant.isCameraEnabled;
    try {
      await room.localParticipant.setCameraEnabled(enabled);
      setIsCameraEnabled(enabled);
    } catch (err) {
      console.warn("toggleCamera failed:", err);
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room?.localParticipant) return;
    const enabled = !room.localParticipant.isScreenShareEnabled;
    try {
      await room.localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);
    } catch (err) {
      console.warn("toggleScreenShare failed:", err);
    }
  }, []);

  const disconnect = useCallback(() => {
    const room = roomRef.current;
    if (room) {
      room.disconnect();
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    participants,
    activeSpeakers,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    localParticipant,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    disconnect,
    room: roomRef,
  };
}
