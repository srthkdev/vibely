'use client';

import { useState, useEffect } from 'react';
import { MediasoupClient, Participant, MediasoupState } from '@/lib/mediasoup';

export function useMediasoup(roomId: string) {
  const [mediasoupClient] = useState(() => new MediasoupClient(roomId));
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [state, setState] = useState<MediasoupState>({
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    isDeafened: false,
    isChatVisible: true,
    isAdmin: false,
  });

  // Initialize local stream
  useEffect(() => {
    mediasoupClient.getLocalStream()
      .then(stream => {
        setLocalStream(stream);
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
      });
  }, [mediasoupClient]);

  // Update state and participants
  useEffect(() => {
    const updateState = () => {
      setState(mediasoupClient.getState());
      setParticipants(mediasoupClient.getParticipants());
    };

    // Initial update
    updateState();

    // Set up interval for updates
    const interval = setInterval(updateState, 1000);

    return () => clearInterval(interval);
  }, [mediasoupClient]);

  const toggleMute = () => {
    mediasoupClient.toggleMute();
    setState(mediasoupClient.getState());
  };

  const toggleVideo = () => {
    mediasoupClient.toggleVideo();
    setState(mediasoupClient.getState());
  };

  const toggleDeafen = () => {
    mediasoupClient.toggleDeafen();
    setState(mediasoupClient.getState());
  };

  const toggleChat = () => {
    mediasoupClient.toggleChat();
    setState(mediasoupClient.getState());
  };

  const setAdmin = (isAdmin: boolean) => {
    mediasoupClient.setAdmin(isAdmin);
    setState(mediasoupClient.getState());
  };

  return {
    localStream,
    participants,
    state,
    toggleMute,
    toggleVideo,
    toggleDeafen,
    toggleChat,
    setAdmin,
  };
} 