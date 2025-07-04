import { z } from 'zod'

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  username: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const CreateUserSchema = z.object({
  clerkId: z.string().min(1, 'Clerk ID is required'),
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
})

// Room schemas
export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  maxUsers: z.number().int().min(2).max(50),
  password: z.string().nullable(),
  topics: z.array(z.string()),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  ownerId: z.string(),
  owner: UserSchema.optional(),
  participantCount: z.number().int().default(0),
  participants: z.array(z.any()).optional(),
})

export const CreateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().default(true),
  maxUsers: z.number().int().min(2, 'At least 2 users required').max(50, 'Max 50 users allowed').default(10),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  topics: z.array(z.string()).max(10, 'Max 10 topics allowed'),
  userId: z.string().min(1, 'User ID is required'),
})

export const UpdateRoomSchema = CreateRoomSchema.partial().extend({
  id: z.string(),
})

// Participant schemas
export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().optional(),
  isMuted: z.boolean().default(false),
  isVideoOff: z.boolean().default(false),
  isDeafened: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  joinedAt: z.date().optional(),
})

export const RoomParticipantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roomId: z.string(),
  isMuted: z.boolean(),
  isDeafen: z.boolean(),
  hasVideo: z.boolean(),
  joinedAt: z.date(),
  user: UserSchema.optional(),
})

// Message schemas
export const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  roomId: z.string().optional(),
  timestamp: z.string().or(z.date()),
})

export const CreateMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  roomId: z.string(),
  senderId: z.string(),
})

// WebRTC state schemas
export const WebRTCStateSchema = z.object({
  isConnected: z.boolean(),
  isMuted: z.boolean(),
  isVideoOff: z.boolean(),
  isDeafened: z.boolean(),
  isChatVisible: z.boolean(),
  isAdmin: z.boolean(),
})

export const ConnectionOptionsSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userImage: z.string().optional(),
  roomId: z.string(),
  enableAudio: z.boolean().default(true),
  enableVideo: z.boolean().default(true),
  isAdmin: z.boolean().default(false),
})

// Socket event schemas
export const SocketEventSchema = z.object({
  event: z.string(),
  data: z.any(),
  timestamp: z.date().default(() => new Date()),
})

// API response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

// Export types
export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type Room = z.infer<typeof RoomSchema>
export type CreateRoom = z.infer<typeof CreateRoomSchema>
export type UpdateRoom = z.infer<typeof UpdateRoomSchema>
export type Participant = z.infer<typeof ParticipantSchema>
export type RoomParticipant = z.infer<typeof RoomParticipantSchema>
export type Message = z.infer<typeof MessageSchema>
export type CreateMessage = z.infer<typeof CreateMessageSchema>
export type WebRTCState = z.infer<typeof WebRTCStateSchema>
export type ConnectionOptions = z.infer<typeof ConnectionOptionsSchema>
export type SocketEvent = z.infer<typeof SocketEventSchema>
export type ApiResponse = z.infer<typeof ApiResponseSchema> 