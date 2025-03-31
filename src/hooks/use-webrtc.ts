'use client';

import { useState, useEffect, useRef } from 'react';
import { WebRTCConnection, DEFAULT_CONFIG } from '@/lib/webrtc';
import * as socketService from '@/lib/socket';
import { useAuth } from '@clerk/nextjs';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isMuted: boolean;
  isVideoOff: boolean;
  isDeafened: boolean;
}

export function useWebRTC(roomId: string) {
  const { userId } = useAuth();
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoOff: false,
    isDeafened: false
  });
  const peerConnections = useRef<Map<string, WebRTCConnection>>(new Map());
  const socket = useRef<ReturnType<typeof socketService.initializeSocket> | null>(null);

  // Initialize WebRTC and socket connection
  useEffect(() => {
    if (!userId || !roomId) return;

    // Initialize socket
    socket.current = socketService.initializeSocket(roomId, userId);
    socketService.joinRoom(roomId);

    // Setup socket event listeners
    socketService.onUserJoined(({ userId: peerId }) => {
      if (peerId !== userId) {
        createPeerConnection(peerId, true);
      }
    });

    socketService.onUserLeft(({ userId: peerId }) => {
      closePeerConnection(peerId);
    });

    socketService.onSignal(({ from, signal }) => {
      handleSignal(from, signal);
    });

    // Initialize local stream
    const initLocalStream = async () => {
      try {
        const mainConnection = new WebRTCConnection(DEFAULT_CONFIG);
        const stream = await mainConnection.getLocalStream();
        setState(prev => ({ ...prev, localStream: stream }));
      } catch (error) {
        console.error('Error getting local stream:', error);
      }
    };

    initLocalStream();

    // Cleanup
    return () => {
      cleanupConnections();
      socketService.leaveRoom(roomId);
      socketService.closeSocket();
    };
  }, [userId, roomId]);

  // Create a peer connection for a new user
  const createPeerConnection = async (peerId: string, isInitiator: boolean) => {
    if (peerConnections.current.has(peerId)) return;

    const connection = new WebRTCConnection(DEFAULT_CONFIG);
    peerConnections.current.set(peerId, connection);

    // Handle local stream
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        if (state.localStream) {
          connection['peerConnection']?.addTrack(track, state.localStream);
        }
      });
    } else {
      try {
        const stream = await connection.getLocalStream();
        setState(prev => ({ ...prev, localStream: stream }));
        connection.addLocalStreamTracks();
      } catch (error) {
        console.error('Error getting local stream:', error);
        return;
      }
    }

    // Set remote stream handler
    connection.setOnRemoteStream((stream) => {
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams);
        newRemoteStreams.set(peerId, stream);
        return { ...prev, remoteStreams: newRemoteStreams };
      });
    });

    // Set ICE candidate handler
    connection.setOnIceCandidate((candidate) => {
      if (candidate) {
        socketService.sendSignal(peerId, {
          type: 'ice-candidate',
          payload: candidate
        });
      }
    });

    // Initiate connection if we're the initiator
    if (isInitiator) {
      try {
        const offer = await connection.createOffer();
        socketService.sendSignal(peerId, {
          type: 'offer',
          payload: offer
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }

    return connection;
  };

  // Handle incoming signals
  const handleSignal = async (from: string, signal: any) => {
    let connection = peerConnections.current.get(from);
    
    if (!connection) {
      connection = await createPeerConnection(from, false);
      if (!connection) return;
    }

    switch (signal.type) {
      case 'offer':
        try {
          await connection.setRemoteDescription(signal.payload);
          const answer = await connection.createAnswer();
          socketService.sendSignal(from, {
            type: 'answer',
            payload: answer
          });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
        break;
        
      case 'answer':
        try {
          await connection.setRemoteDescription(signal.payload);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
        break;
        
      case 'ice-candidate':
        try {
          await connection.addIceCandidate(signal.payload);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
        break;
    }
  };

  // Close a peer connection
  const closePeerConnection = (peerId: string) => {
    const connection = peerConnections.current.get(peerId);
    if (connection) {
      connection.close();
      peerConnections.current.delete(peerId);
      
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams);
        newRemoteStreams.delete(peerId);
        return { ...prev, remoteStreams: newRemoteStreams };
      });
    }
  };

  // Clean up all connections
  const cleanupConnections = () => {
    peerConnections.current.forEach(connection => {
      connection.close();
    });
    peerConnections.current.clear();
    
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    
    setState(prev => ({
      ...prev,
      localStream: null,
      remoteStreams: new Map()
    }));
  };

  // Toggle audio
  const toggleMute = () => {
    if (!state.localStream) return;
    
    const newIsMuted = !state.isMuted;
    state.localStream.getAudioTracks().forEach(track => {
      track.enabled = !newIsMuted;
    });
    
    setState(prev => ({ ...prev, isMuted: newIsMuted }));
  };

  // Toggle video
  const toggleVideo = () => {
    if (!state.localStream) return;
    
    const newIsVideoOff = !state.isVideoOff;
    state.localStream.getVideoTracks().forEach(track => {
      track.enabled = !newIsVideoOff;
    });
    
    setState(prev => ({ ...prev, isVideoOff: newIsVideoOff }));
  };

  // Toggle audio output (deafening)
  const toggleDeafen = () => {
    const newIsDeafened = !state.isDeafened;
    
    // This requires browser audio output devices API
    // For now, we'll just update the state
    setState(prev => ({ ...prev, isDeafened: newIsDeafened }));
    
    // In a real implementation, we would mute all audio elements
    // or use the browser's audio output devices API
  };

  return {
    ...state,
    toggleMute,
    toggleVideo,
    toggleDeafen
  };
} 