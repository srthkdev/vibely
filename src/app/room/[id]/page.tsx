'use client'

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useChat, Message } from "@/hooks/use-chat"
import {
  MicrophoneIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import {
  MicrophoneIcon as MicrophoneOffIcon,
  VideoCameraIcon as VideoCameraOffIcon,
  SpeakerWaveIcon as SpeakerOffIcon,
} from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

interface Room {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  maxUsers: number;
  createdAt: string;
  userId: string;
}

export default function RoomPage() {
  const { id } = useParams()
  const { userId, isLoaded, isSignedIn } = useAuth()
  const [newMessage, setNewMessage] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const roomId = Array.isArray(id) ? id[0] : (id as string)
  
  // Use our custom hooks
  const { 
    localStream, 
    remoteStreams, 
    isMuted, 
    isVideoOff, 
    isDeafened,
    toggleMute, 
    toggleVideo, 
    toggleDeafen 
  } = useWebRTC(roomId)
  
  const { messages, sendMessage, isConnected } = useChat(roomId)

  // Fetch room data
  const { data: room, error, isLoading } = useQuery<Room>({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room data');
      }
      return response.json();
    },
    enabled: !!roomId && isLoaded && isSignedIn,
  })

  // Set up video elements
  const localVideoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream])

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-500">Error: Failed to load room</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">{room?.name || 'Video Chat Room'}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Video section */}
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/20">
              <CardTitle>Video Chat</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative bg-black aspect-video">
                {/* Local video */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute bottom-4 right-4 w-1/4 h-auto rounded-lg border-2 border-primary z-10 ${
                    isVideoOff ? 'hidden' : ''
                  }`}
                />
                
                {/* Remote videos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 h-full">
                  {Array.from(remoteStreams).map(([peerId, stream]) => (
                    <RemoteVideo key={peerId} stream={stream} />
                  ))}
                  
                  {remoteStreams.size === 0 && (
                    <div className="flex items-center justify-center col-span-full h-full">
                      <p className="text-white text-center">
                        {isConnected ? 'Waiting for others to join...' : 'Connecting...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Video controls */}
              <div className="flex justify-center p-4 space-x-4 bg-muted/10">
                <Button
                  onClick={toggleMute}
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  {isMuted ? (
                    <MicrophoneOffIcon className="h-6 w-6" />
                  ) : (
                    <MicrophoneIcon className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  onClick={toggleVideo}
                  variant={isVideoOff ? "destructive" : "secondary"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  {isVideoOff ? (
                    <VideoCameraOffIcon className="h-6 w-6" />
                  ) : (
                    <VideoCameraIcon className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  onClick={toggleDeafen}
                  variant={isDeafened ? "destructive" : "secondary"}
                  size="icon"
                  className="rounded-full h-12 w-12"
                >
                  {isDeafened ? (
                    <SpeakerOffIcon className="h-6 w-6" />
                  ) : (
                    <SpeakerWaveIcon className="h-6 w-6" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-12 w-12"
                  onClick={() => window.history.back()}
                >
                  <XMarkIcon className="h-6 w-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat section */}
        <div className="md:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="bg-muted/20">
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
              {/* Messages */}
              <div 
                ref={chatContainerRef} 
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <ChatMessage key={message.id} message={message} isCurrentUser={message.sender.id === userId} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center my-4">
                    No messages yet. Start the conversation!
                  </p>
                )}
              </div>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!isConnected}>
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  return (
    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full" />
    </div>
  );
}

function ChatMessage({ message, isCurrentUser }: { message: Message, isCurrentUser: boolean }) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[75%] px-4 py-2 rounded-lg
          ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}
        `}
      >
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm">
            {message.sender.name}
          </span>
          <span className="text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-1">{message.content}</p>
      </div>
    </div>
  );
} 