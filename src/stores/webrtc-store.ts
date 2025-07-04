import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { WebRTCState } from '@/lib/schemas'

interface WebRTCStore extends WebRTCState {
  // Media streams
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  
  // Connection management
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed'
  initError: Error | null
  reconnectAttempts: number
  
  // Actions
  setLocalStream: (stream: MediaStream | null) => void
  setRemoteStream: (participantId: string, stream: MediaStream) => void
  removeRemoteStream: (participantId: string) => void
  clearRemoteStreams: () => void
  
  setState: (updates: Partial<WebRTCState>) => void
  setConnectionStatus: (status: WebRTCStore['connectionStatus']) => void
  setInitError: (error: Error | null) => void
  
  toggleMute: () => void
  toggleVideo: () => void
  toggleDeafen: () => void
  toggleChat: () => void
  setAdmin: (isAdmin: boolean) => void
  
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  
  // Reset everything
  reset: () => void
}

const initialState: WebRTCState = {
  isConnected: false,
  isMuted: false,
  isVideoOff: false,
  isDeafened: false,
  isChatVisible: false,
  isAdmin: false,
}

const initialStoreState = {
  ...initialState,
  localStream: null,
  remoteStreams: new Map<string, MediaStream>(),
  connectionStatus: 'disconnected' as const,
  initError: null,
  reconnectAttempts: 0,
}

export const useWebRTCStore = create<WebRTCStore>()(
  devtools(
    (set, get) => ({
      ...initialStoreState,
      
      setLocalStream: (stream) => set({ localStream: stream }),
      
      setRemoteStream: (participantId, stream) =>
        set((state) => {
          const newStreams = new Map(state.remoteStreams)
          newStreams.set(participantId, stream)
          return { remoteStreams: newStreams }
        }),
      
      removeRemoteStream: (participantId) =>
        set((state) => {
          const newStreams = new Map(state.remoteStreams)
          newStreams.delete(participantId)
          return { remoteStreams: newStreams }
        }),
      
      clearRemoteStreams: () =>
        set({ remoteStreams: new Map() }),
      
      setState: (updates) => set(updates),
      
      setConnectionStatus: (status) => 
        set({ 
          connectionStatus: status,
          isConnected: status === 'connected'
        }),
      
      setInitError: (error) => set({ initError: error }),
      
      toggleMute: () =>
        set((state) => ({ isMuted: !state.isMuted })),
      
      toggleVideo: () =>
        set((state) => ({ isVideoOff: !state.isVideoOff })),
      
      toggleDeafen: () =>
        set((state) => ({ isDeafened: !state.isDeafened })),
      
      toggleChat: () =>
        set((state) => ({ isChatVisible: !state.isChatVisible })),
      
      setAdmin: (isAdmin) => set({ isAdmin }),
      
      incrementReconnectAttempts: () =>
        set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
      
      resetReconnectAttempts: () =>
        set({ reconnectAttempts: 0 }),
      
      reset: () => set(initialStoreState),
    }),
    {
      name: 'webrtc-store',
    }
  )
) 