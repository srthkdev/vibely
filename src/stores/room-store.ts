import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { Room, Participant, Message } from '@/lib/schemas'

interface RoomState {
  // Current room data
  currentRoom: Room | null
  participants: Participant[]
  messages: Message[]
  
  // Connection state
  isConnected: boolean
  isLoading: boolean
  error: string | null
  
  // UI state
  isChatVisible: boolean
  isVideoGridExpanded: boolean
  
  // Actions
  setCurrentRoom: (room: Room | null) => void
  setParticipants: (participants: Participant[]) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (participantId: string) => void
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void
  
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  
  setConnectionState: (isConnected: boolean) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  
  toggleChat: () => void
  toggleVideoGrid: () => void
  
  // Reset store
  reset: () => void
}

const initialState = {
  currentRoom: null,
  participants: [],
  messages: [],
  isConnected: false,
  isLoading: false,
  error: null,
  isChatVisible: false,
  isVideoGridExpanded: false,
}

export const useRoomStore = create<RoomState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      setCurrentRoom: (room) => set({ currentRoom: room }),
      
      setParticipants: (participants) => set({ participants }),
      
      addParticipant: (participant) => 
        set((state) => ({
          participants: [...state.participants.filter(p => p.id !== participant.id), participant]
        })),
      
      removeParticipant: (participantId) =>
        set((state) => ({
          participants: state.participants.filter(p => p.id !== participantId)
        })),
      
      updateParticipant: (participantId, updates) =>
        set((state) => ({
          participants: state.participants.map(p =>
            p.id === participantId ? { ...p, ...updates } : p
          )
        })),
      
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),
      
      clearMessages: () => set({ messages: [] }),
      
      setConnectionState: (isConnected) => set({ isConnected }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      toggleChat: () =>
        set((state) => ({
          isChatVisible: !state.isChatVisible
        })),
      
      toggleVideoGrid: () =>
        set((state) => ({
          isVideoGridExpanded: !state.isVideoGridExpanded
        })),
      
      reset: () => set(initialState),
    })),
    {
      name: 'room-store',
    }
  )
) 