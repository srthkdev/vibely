import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Room, CreateRoom, UpdateRoom } from '@/lib/schemas'

// Fetch all rooms
export function useRooms(searchQuery: string = '') {
  return useQuery({
    queryKey: ['rooms', searchQuery],
    queryFn: async (): Promise<Room[]> => {
      const response = await fetch(`/api/rooms?query=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch rooms')
      }
      return response.json()
    },
    staleTime: 1000 * 30, // 30 seconds for rooms (they update frequently)
  })
}

// Fetch single room
export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: async (): Promise<Room> => {
      const response = await fetch(`/api/rooms/${roomId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch room')
      }
      return response.json()
    },
    enabled: !!roomId,
  })
}

// Create room mutation
export function useCreateRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateRoom): Promise<Room> => {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create room')
      }
      
      return response.json()
    },
    onSuccess: (newRoom) => {
      // Invalidate rooms list to refresh
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success(`Room "${newRoom.name}" created successfully!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create room')
    },
  })
}

// Update room mutation
export function useUpdateRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ roomId, ...data }: UpdateRoom & { roomId: string }): Promise<Room> => {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update room')
      }
      
      return response.json()
    },
    onSuccess: (updatedRoom) => {
      // Update cache
      queryClient.setQueryData(['room', updatedRoom.id], updatedRoom)
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Room updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update room')
    },
  })
}

// Delete room mutation
export function useDeleteRoom() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string, userId: string }): Promise<void> => {
      const response = await fetch(`/api/rooms/${roomId}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete room')
      }
    },
    onSuccess: (_, { roomId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['room', roomId] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Room deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete room')
    },
  })
} 