'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/clerk-react';
import { useChat } from '@/hooks/use-chat';
import { MediasoupClient, Participant } from '@/lib/mediasoup';
import { AdminControls } from '@/components/admin-controls';
import { VideoContextMenu } from '@/components/context-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  X,
  MoreVertical,
  Volume2,
  VolumeX,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RoomProps {
  roomId: string;
}

interface RoomType {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  maxUsers: number;
  ownerId?: string;
  owner?: {
    id: string;
    clerkId: string;
    username: string;
  };
  topics?: string[];
}

export const Room = ({ roomId }: RoomProps) => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [room, setRoom] = useState<RoomType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mediasoup, setMediasoup] = useState<MediasoupClient | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    sendMessage, 
    isConnected,
    participants: chatParticipants,
    performAdminAction
  } = useChat(roomId);

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch room');
        }
        const data = await response.json();
        setRoom(data);
        
        // Check if current user is the room owner
        if (data.owner?.clerkId === userId) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId, userId]);

  // Initialize mediasoup client
  useEffect(() => {
    if (!roomId || !userId) return;

    const client = new MediasoupClient(roomId, userId);
    setMediasoup(client);

    // Set admin status
    if (isAdmin) {
      client.setAdmin(true);
    }

    // Initialize local stream
    const initializeStream = async () => {
      try {
        await client.initialize();
      } catch (error) {
        console.error('Error initializing mediasoup client:', error);
      }
    };

    initializeStream();

    return () => {
      client.close();
    };
  }, [roomId, userId, isAdmin]);

  // Update participants list
  useEffect(() => {
    if (mediasoup) {
      const handleParticipantsUpdate = (participants: Participant[]) => {
        setParticipants(participants);
      };

      mediasoup.on('participants-updated', handleParticipantsUpdate);

      return () => {
        mediasoup.off('participants-updated', handleParticipantsUpdate);
      };
    }
  }, [mediasoup]);

  // Handle admin actions
  const handleMuteParticipant = (participantId: string) => {
    if (isAdmin && mediasoup) {
      mediasoup.muteParticipant(participantId);
      performAdminAction(participantId, 'mute');
    }
  };

  const handleDisableVideo = (participantId: string) => {
    if (isAdmin && mediasoup) {
      mediasoup.disableParticipantVideo(participantId);
      performAdminAction(participantId, 'disable-video');
    }
  };

  const handleKickParticipant = (participantId: string) => {
    if (isAdmin && mediasoup) {
      mediasoup.kickParticipant(participantId);
      performAdminAction(participantId, 'kick');
    }
  };

  // Handle local media controls
  const toggleMute = () => {
    if (mediasoup) {
      mediasoup.toggleMute();
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (mediasoup) {
      mediasoup.toggleVideo();
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleDeafen = () => {
    if (mediasoup) {
      mediasoup.toggleDeafen();
      setIsDeafened(!isDeafened);
    }
  };

  const leaveRoom = () => {
    if (mediasoup) {
      mediasoup.close();
    }
    router.push('/rooms');
  };

  // Determine the grid layout based on participant count
  const getGridClass = () => {
    const totalParticipants = participants.length + 1; // +1 for local user
    
    if (totalParticipants === 1) {
      return 'grid-cols-1';
    } else if (totalParticipants === 2) {
      return 'grid-cols-2';
    } else if (totalParticipants <= 4) {
      return 'grid-cols-2';
    } else if (totalParticipants <= 9) {
      return 'grid-cols-3';
    } else {
      return 'grid-cols-4';
    }
  };

  if (!room) {
    return <div className="flex items-center justify-center h-screen">Loading room...</div>;
  }

  return (
    <div className="flex h-screen bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px] text-black dark:text-white">
      {/* Main Content */}
      <div className={`flex-1 p-6 ${isChatVisible ? 'pr-[400px]' : ''} transition-all duration-300`}>
        {/* Room Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold font-['Acme',sans-serif]">{room.name}</h1>
            {isAdmin && (
              <Badge variant="outline" className="bg-[#FFDC58] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">{room.description}</p>
          
          {/* Topics */}
          {room.topics && room.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {room.topics.map((topic, index) => (
                <div 
                  key={topic} 
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm text-black border-2 
                    ${index % 3 === 0 ? "bg-[#FFDC58]" : index % 3 === 1 ? "bg-[#88AAEE]" : "bg-[#A388EE]"} 
                    border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                >
                  {topic}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participants Count */}
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <Users className="h-4 w-4" />
          <span>{participants.length + 1} / {room.maxUsers} participants</span>
        </div>

        {/* Video Grid */}
        <ScrollArea className="h-[calc(100vh-220px)]" ref={videoContainerRef}>
          <div className={`grid ${getGridClass()} gap-4 auto-rows-fr`}>
            {/* Local Video */}
            <div className={`bg-white dark:bg-[#212121] rounded-xl overflow-hidden relative border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              ${participants.length === 0 ? 'col-span-full row-span-full aspect-video' : ''}`}
            >
              <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-full text-sm text-white z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                You {isAdmin && '(Admin)'}
              </div>
              
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30">
                  <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center text-white text-2xl">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                </div>
              )}
              
              <video
                id="local-video"
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              
              {isMuted && (
                <div className="absolute top-3 right-3 bg-red-500 p-1.5 rounded-full z-10">
                  <MicOff className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {participants.map((participant) => (
              <VideoContextMenu
                key={participant.id}
                participantId={participant.id}
                isAdmin={isAdmin}
                onMute={handleMuteParticipant}
                onDisableVideo={handleDisableVideo}
                onKick={handleKickParticipant}
              >
                <div className="bg-white dark:bg-[#212121] rounded-xl overflow-hidden relative border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-full text-sm text-white z-10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    {participant.name} {participant.isAdmin && '(Admin)'}
                  </div>
                  
                  {participant.isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800/30">
                      <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center text-white text-2xl">
                        {participant.name.charAt(0)}
                      </div>
                    </div>
                  )}
                  
                  <video
                    id={`remote-video-${participant.id}`}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${participant.isVideoOff ? 'hidden' : ''}`}
                  />
                  
                  {participant.isMuted && (
                    <div className="absolute top-3 right-3 bg-red-500 p-1.5 rounded-full z-10">
                      <MicOff className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </VideoContextMenu>
            ))}
          </div>
        </ScrollArea>

        {/* Floating Controls */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white dark:bg-[#212121] p-3 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className={`rounded-full ${isMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVideo}
            className={`rounded-full ${isVideoOff ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDeafen}
            className={`rounded-full ${isDeafened ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsChatVisible(!isChatVisible)}
            className={`rounded-full ${isChatVisible ? 'bg-[#FFDC58] text-black hover:bg-[#FFDC58]/80' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            onClick={leaveRoom}
            className="rounded-full"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Chat Panel */}
      <div 
        className={`fixed top-0 right-0 w-[400px] h-full bg-white dark:bg-[#212121] border-l-2 border-black shadow-[-4px_0px_10px_rgba(0,0,0,0.1)] transition-transform duration-300 z-40
          ${isChatVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b-2 border-black flex items-center justify-between">
          <h2 className="font-bold text-xl font-['Acme',sans-serif]">Chat</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatVisible(false)}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.sender.id === 'system'
                    ? 'items-center'
                    : message.sender.id === userId
                    ? 'items-end'
                    : 'items-start'
                }`}
              >
                {message.sender.id !== 'system' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {message.sender.name}
                  </span>
                )}
                <div
                  className={`rounded-xl px-4 py-2 max-w-[80%] ${
                    message.sender.id === 'system'
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs'
                      : message.sender.id === userId
                      ? 'bg-[#FFDC58] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-gray-100 dark:bg-gray-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {message.content}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t-2 border-black">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.elements.namedItem('message') as HTMLInputElement;
              if (input.value.trim()) {
                sendMessage(input.value);
                input.value = '';
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              name="message"
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFDC58]"
            />
            <Button 
              type="submit"
              className="rounded-full bg-[#FFDC58] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
