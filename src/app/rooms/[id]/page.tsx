'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, 
  Settings, Users, Share2, Loader2, MoreVertical, UserX, ArrowLeft 
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useRoom } from '@/hooks/api/use-rooms'
import { useRoomStore } from '@/stores/room-store'
import { useWebRTCStore } from '@/stores/webrtc-store'
import { webrtcService } from '@/lib/webrtc-service'
import { toast } from 'sonner'
import type { Message } from '@/lib/schemas'

interface VideoGridProps {
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  participants: any[]
  isAdmin: boolean
  onAdminAction: (participantId: string, action: string) => void
}

function VideoGrid({ localStream, remoteStreams, participants, isAdmin, onAdminAction }: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const { user } = useUser()
  const [adminMenuOpen, setAdminMenuOpen] = useState<string | null>(null)
  const { isMuted, isVideoOff } = useWebRTCStore()

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Update remote video elements
  useEffect(() => {
    remoteStreams.forEach((stream, participantId) => {
      const videoElement = remoteVideoRefs.current[participantId]
      if (videoElement) {
        videoElement.srcObject = stream
      }
    })
  }, [remoteStreams])

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuOpen) {
        setAdminMenuOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [adminMenuOpen])
  
  const allParticipants = participants.map(p => {
    const isLocal = p.id === user?.id
    return {
      ...p,
      isLocal,
      isMuted: isLocal ? isMuted : p.isMuted,
      isVideoOff: isLocal ? isVideoOff : p.isVideoOff,
    }
  })

  const getGridCols = () => {
    const totalParticipants = allParticipants.length
    if (totalParticipants === 0) return 'grid-cols-1'
    if (totalParticipants <= 2) return 'grid-cols-1 md:grid-cols-2'
    if (totalParticipants <= 4) return 'grid-cols-2'
    if (totalParticipants <= 9) return 'grid-cols-3'
    return 'grid-cols-4'
  }

  const handleAdminAction = (participantId: string, action: string) => {
    onAdminAction(participantId, action)
    setAdminMenuOpen(null)
  }

  return (
    <div className={`grid ${getGridCols()} gap-4 p-4 h-full`}>
      {allParticipants.map((participant) => (
        <Card key={participant.id} className="relative overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black">
          <video
            ref={participant.isLocal ? localVideoRef : (el) => {
              remoteVideoRefs.current[participant.id] = el
            }}
            autoPlay
            muted={participant.isLocal}
            playsInline
            className="w-full h-full object-cover"
          />
          {participant.isVideoOff && (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-black ${
                participant.isLocal ? 'bg-[#FFDC58]' : 'bg-[#88AAEE]'
              }`}>
                <span className={`text-xl font-bold ${participant.isLocal ? 'text-black' : 'text-white'}`}>
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          {/* User name and status */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {participant.name} 
            {participant.isAdmin && ' (Admin)'}
            {participant.isMuted && ' (Muted)'}
          </div>

          {/* Admin controls - only show for non-local participants when user is admin */}
          {isAdmin && !participant.isLocal && (
            <div className="absolute top-2 right-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-black/70 text-white hover:bg-black/90 border border-white/20"
                  onClick={() => setAdminMenuOpen(adminMenuOpen === participant.id ? null : participant.id)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {adminMenuOpen === participant.id && (
                  <div className="absolute top-full right-0 mt-1 min-w-[160px] bg-white dark:bg-[#212121] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-md overflow-hidden z-50">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => handleAdminAction(participant.id, 'mute')}
                    >
                      <MicOff className="h-4 w-4" />
                      Mute Participant
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => handleAdminAction(participant.id, 'disable-video')}
                    >
                      <VideoOff className="h-4 w-4" />
                      Disable Video
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500 transition-colors"
                      onClick={() => handleAdminAction(participant.id, 'kick')}
                    >
                      <UserX className="h-4 w-4" />
                      Kick Participant
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isVisible: boolean
}

function ChatPanel({ messages, onSendMessage, isVisible }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage)
      setNewMessage('')
    }
  }

  if (!isVisible) return null

  return (
    <Card className="h-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#212121] flex flex-col">
      <div className="p-4 border-b-2 border-black">
        <h3 className="font-['Acme',sans-serif] text-xl">Chat</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div key={index} className="break-words">
              <div className="text-sm font-semibold text-[#6366f1] dark:text-[#a5b4fc]">
                {message.senderName}
              </div>
              <div className="text-sm">{message.content}</div>
              <div className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <Separator className="border-black" />
      
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="border-2 border-black"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage}
            variant="yellow"
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const roomId = params.id as string

  // Stores
  const roomStore = useRoomStore()
  const webrtcStore = useWebRTCStore()

  // Data fetching
  const { data: room, isLoading, error } = useRoom(roomId)

  // Local state
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)

  // Join room effect
  useEffect(() => {
    if (!room || !user) return

    let isCleanedUp = false

    const joinRoom = async () => {
      if (isConnecting || isCleanedUp || hasJoined) return
      
      setIsConnecting(true)
      setConnectionError(null)

      try {
        const success = await webrtcService.initialize({
          roomId: room.id,
          userId: user.id,
          userName: user.fullName || user.username || 'Anonymous',
          userImage: user.imageUrl,
          enableAudio: true,
          enableVideo: true,
        })

        if (!success || isCleanedUp) {
          throw new Error('Failed to join room')
        }

        if (!isCleanedUp) {
          roomStore.setCurrentRoom(room)
          setHasJoined(true)
          toast.success(`Joined room: ${room.name}`)
        }
      } catch (error) {
        if (!isCleanedUp) {
          console.error('Failed to join room:', error)
          setConnectionError(error instanceof Error ? error.message : 'Failed to join room')
          toast.error('Failed to join room')
        }
      } finally {
        if (!isCleanedUp) {
          setIsConnecting(false)
        }
      }
    }

    joinRoom()

    return () => {
      isCleanedUp = true
      setHasJoined(false)
      webrtcService.disconnect()
      roomStore.reset()
    }
  }, [room?.id, user?.id]) // Remove roomStore from dependencies

  // Handle admin actions
  const handleAdminAction = (participantId: string, action: string) => {
    switch (action) {
      case 'mute':
        webrtcService.muteParticipant(participantId)
        break
      case 'disable-video':
        webrtcService.disableParticipantVideo(participantId)
        break
      case 'kick':
        webrtcService.kickParticipant(participantId)
        break
    }
  }

  // Handle media controls
  const toggleMute = () => webrtcService.toggleMute()
  const toggleVideo = () => webrtcService.toggleVideo()
  const toggleChat = () => {
    webrtcStore.toggleChat()
    roomStore.toggleChat()
  }
  const leaveRoom = () => {
    webrtcService.disconnect()
    router.push('/rooms')
  }

  const handleSendMessage = (content: string) => {
    webrtcService.sendMessage(content)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] flex items-center justify-center">
        <Card className="p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#212121]">
          <div className="flex items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div>
              <h2 className="text-xl font-['Acme',sans-serif]">Loading Room</h2>
              <p className="text-gray-600 dark:text-gray-300">Please wait...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !room) {
    return (
      <div className="min-h-screen pt-24 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] flex items-center justify-center">
        <Card className="p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#212121] max-w-md">
          <Alert className="border-red-500">
            <AlertDescription>
              Room not found or failed to load. Please check the room ID and try again.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.push('/rooms')} 
            className="w-full mt-4"
            variant="yellow"
          >
            Back to Rooms
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px]">
      {/* Room Header */}
      <div className="p-4 border-b-2 border-black bg-white dark:bg-[#212121]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button and Logo */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/rooms')}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              
              {/* Vibely Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FFDC58] rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-black font-bold text-sm">V</span>
                </div>
                <span className="font-['Acme',sans-serif] text-lg font-bold">Vibely</span>
              </div>
            </div>
            
            <div className="h-6 w-px bg-black"></div>
            
            {/* Room Info */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-['Acme',sans-serif]">{room.name}</h1>
              <div className="flex gap-2">
                {room.topics.map((topic, index) => (
                  <Badge 
                    key={topic} 
                    className={cn(
                      "border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                      index % 3 === 0 && "bg-[#FFDC58]",
                      index % 3 === 1 && "bg-[#88AAEE]",
                      index % 3 === 2 && "bg-[#A388EE]"
                    )}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-[#f8f9fa] dark:bg-[#2a2a2a] px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{roomStore.participants.length}/{room.maxUsers}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast.success('Room link copied to clipboard!')
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {connectionError && (
        <Alert className="m-4 border-red-500">
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Video Area */}
        <div className="flex-1 relative">
          {isConnecting ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#212121]">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <div>
                    <h2 className="text-xl font-['Acme',sans-serif]">Connecting...</h2>
                    <p className="text-gray-600 dark:text-gray-300">Setting up video and audio</p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <VideoGrid
              localStream={webrtcStore.localStream}
              remoteStreams={webrtcStore.remoteStreams}
              participants={roomStore.participants}
              isAdmin={!!user && !!room.owner && user.id === room.owner.clerkId}
              onAdminAction={handleAdminAction}
            />
          )}
        </div>

        {/* Chat Panel */}
        {webrtcStore.isChatVisible && (
          <div className="w-80 border-l-2 border-black">
            <ChatPanel
              messages={roomStore.messages}
              onSendMessage={handleSendMessage}
              isVisible={webrtcStore.isChatVisible}
            />
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <Card className="p-4 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#212121]">
          <div className="flex items-center gap-4">
            <Button
              variant={webrtcStore.isMuted ? "destructive" : "outline"}
              size="icon"
              onClick={toggleMute}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {webrtcStore.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              variant={webrtcStore.isVideoOff ? "destructive" : "outline"}
              size="icon"
              onClick={toggleVideo}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {webrtcStore.isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>

            <Button
              variant={webrtcStore.isChatVisible ? "yellow" : "outline"}
              size="icon"
              onClick={toggleChat}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-8 border-black" />

            <Button
              variant="destructive"
              onClick={leaveRoom}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
