'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/clerk-react';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useChat } from '@/hooks/use-chat';
import { Chat } from '@/components/Chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Mic, MicOff, Video, VideoOff, PhoneOff, X, MoreVertical, Volume2, VolumeX, Users 
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

const generateRoomKey = (roomId: string) => `room-${roomId}-${Date.now()}`;

export const Room = ({ roomId }: RoomProps) => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [room, setRoom] = useState<RoomType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const participantVideosRef = useRef<{ [id: string]: HTMLVideoElement | null }>({});
  const componentKey = useRef<string>(generateRoomKey(roomId));
  const reconnectAttempts = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const componentMounted = useRef(true);

  const {
    localStream,
    participants,
    state,
    isInitialized,
    initError,
    toggleMute,
    toggleVideo,
    toggleDeafen,
    toggleChat,
    muteParticipant,
    disableParticipantVideo,
    kickParticipant,
    deleteRoom,
    getRemoteStream,
    attemptReconnect,
    webrtcClient
  } = useWebRTC(
    roomId,
    userId || '',
    user?.fullName || user?.username || 'Unknown user',
    user?.imageUrl || '',
    isAdmin
  );

  const {
    messages,
    sendMessage,
    isConnected: isChatConnected,
    performAdminAction
  } = useChat(
    {
      localStream, 
      participants, 
      state, 
      isInitialized, 
      initError, 
      toggleMute, 
      toggleVideo, 
      toggleDeafen, 
      toggleChat, 
      muteParticipant, 
      disableParticipantVideo, 
      kickParticipant, 
      deleteRoom, 
      getRemoteStream, 
      attemptReconnect, 
      webrtcClient,
      sendMessage: webrtcClient?.sendMessage.bind(webrtcClient) || (() => {})
    }
  );

  const isAuthLoading = userId === undefined;
  const isAuthenticated = userId !== null && userId !== undefined;

  useEffect(() => {
    componentMounted.current = true;
    return () => {
      componentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to signup');
      router.push('/signup');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch room');
        }
        const data = await response.json();
        if (componentMounted.current) {
          setRoom(data);
          
          if (data.owner?.clerkId === userId) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        if (componentMounted.current) {
          // If we can't fetch the room data from the server, use a fallback
          const fallbackRoom: RoomType = {
            id: roomId,
            name: "Video Chat Room",
            description: "Unable to fetch room details from server. Using fallback data.",
            isPublic: true,
            maxUsers: 10,
            owner: {
              id: userId || '',
              clerkId: userId || '',
              username: 'Unknown User'
            }
          };
          setRoom(fallbackRoom);
          
          // Check if current user is likely the creator of the room
          if (userId) {
            setIsAdmin(true);
          }
        }
      }
    };

    if (roomId && userId) {
      fetchRoom();
    }
  }, [roomId, userId, router]);

  useEffect(() => {
    setParticipantCount(participants.length);
  }, [participants]);

  useEffect(() => {
    if (localVideoRef.current && localStream && !localVideoRef.current.srcObject) {
      console.log('Attaching local stream to video element');
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play()
        .then(() => console.log('Local video playing successfully'))
        .catch(e => console.error('Error playing local video:', e));
    }
  }, [localStream]);

  const setVideoRef = (el: HTMLVideoElement | null, participantId: string) => {
    if (el) {
      participantVideosRef.current[participantId] = el;
      
      const stream = getRemoteStream(participantId);
      if (stream && !el.srcObject) {
        console.log(`Attaching stream to video element for participant ${participantId}`);
        el.srcObject = stream;
        
        const tryPlay = () => {
          el.play()
            .then(() => {
              console.log(`Video playing for participant ${participantId}`);
            })
            .catch(err => {
              console.error(`Error playing video for ${participantId}:`, err);
              if (err.name === 'NotAllowedError') {
                setTimeout(tryPlay, 1000);
              }
            });
        };
        
        tryPlay();
      }
    } else {
      delete participantVideosRef.current[participantId];
    }
  };

  const handleMuteParticipant = (participantId: string) => {
    muteParticipant(participantId);
  };

  const handleDisableVideo = (participantId: string) => {
    disableParticipantVideo(participantId);
  };

  const handleKickParticipant = (participantId: string) => {
    kickParticipant(participantId);
  };

  const leaveRoom = () => {
    if (webrtcClient) {
      webrtcClient.disconnect();
    }
    router.push('/rooms');
  };

  const getGridClass = () => {
    const count = participants.length + 1;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  if (isAuthLoading || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg dark:bg-secondaryBlack">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFDC58]"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          {isAuthLoading ? 'Verifying authentication...' : 'Loading room...'}
        </p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg dark:bg-secondaryBlack">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded max-w-md" role="alert">
          <p className="font-bold">Media Connection Error</p>
          <p>{initError.message || 'Failed to connect to media server'}</p>
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={attemptReconnect} 
              variant="default"
              disabled={reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS}
            >
              {reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS ? 
                'Too Many Attempts' : 
                `Try Again (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`
              }
            </Button>
            <Button onClick={() => router.push('/rooms')} variant="secondary">
              Return to Rooms
            </Button>
          </div>
          {reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS && (
            <p className="text-xs mt-2">
              Maximum reconnect attempts reached. Please try joining again from the rooms list.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div key={componentKey.current} className="flex h-screen bg-bg dark:bg-secondaryBlack">
      <div className={`flex-1 p-6 ${state.isChatVisible ? 'pr-[400px]' : ''} transition-all duration-300`}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">{room.name}</h1>
              <div className="ml-4 bg-[#FFDC58] text-black text-xs px-2 py-1 rounded-full flex items-center">
                <Users className="h-3 w-3 mr-1" />
                <span className="font-bold">{participantCount || participants.length + 1} participants</span>
              </div>
            </div>
            {isAdmin && (
              <Badge variant="outline" className="bg-[#FFDC58] text-black">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2">{room.description}</p>
          
          {room.topics && room.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {room.topics.map((topic, i) => (
                <Badge key={i} variant="outline" className="bg-white text-black">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className={`grid ${getGridClass()} gap-4 mb-6`}>
          <div className="relative bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden aspect-video">
            {state.isVideoOff ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-[#FFDC58] rounded-full p-3 mb-2">
                  <Users className="w-8 h-8 text-black" />
                </div>
                <p className="font-bold text-sm">{user?.fullName || 'You'}</p>
                <p className="text-xs text-gray-500">Camera Off</p>
              </div>
            ) : (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Badge className={`${state.isMuted ? 'bg-red-600' : 'bg-green-600'} text-white text-xs px-1 py-0.5`}>
                {state.isMuted ? 'Muted' : 'Mic On'}
              </Badge>
              <Badge className={`${state.isVideoOff ? 'bg-red-600' : 'bg-green-600'} text-white text-xs px-1 py-0.5`}>
                {state.isVideoOff ? 'Video Off' : 'Video On'}
              </Badge>
            </div>
            
            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-0.5 rounded-md text-xs">
              {user?.fullName || 'You'} (You)
            </div>
          </div>
          
          {participants
            .filter(p => p.id !== userId)
            .map((participant) => (
              <div 
                key={participant.id} 
                className="relative bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden aspect-video"
              >
                {!participant.isVideoOff ? (
                  <video 
                    ref={(el) => setVideoRef(el, participant.id)}
                    id={`video-${participant.id}`}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-[#FFDC58] rounded-full p-3 mb-2">
                      <Users className="w-8 h-8 text-black" />
                    </div>
                    <p className="font-bold text-sm">{participant.name || 'Participant'}</p>
                    <p className="text-xs text-gray-500">Camera Off</p>
                  </div>
                )}
                
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-0.5 rounded-md text-xs flex items-center gap-1">
                  <span>{participant.name || 'Participant'}</span>
                  {!participant.isMuted && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full bg-black/50 hover:bg-black/70 text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={() => handleMuteParticipant(participant.id)} 
                          className="flex items-center gap-2"
                        >
                          <MicOff className="h-4 w-4" />
                          {participant.isMuted ? 'Unmute' : 'Mute'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDisableVideo(participant.id)} 
                          className="flex items-center gap-2"
                        >
                          <VideoOff className="h-4 w-4" />
                          {participant.isVideoOff ? 'Enable Camera' : 'Disable Camera'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleKickParticipant(participant.id)} 
                          className="flex items-center gap-2 text-red-600"
                        >
                          <X className="h-4 w-4" />
                          Kick
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <Badge className={`${!participant.isMuted ? 'bg-green-600' : 'bg-red-600'} text-white text-xs px-1 py-0.5`}>
                    {!participant.isMuted ? 'Mic On' : 'Muted'}
                  </Badge>
                  <Badge className={`${!participant.isVideoOff ? 'bg-green-600' : 'bg-red-600'} text-white text-xs px-1 py-0.5`}>
                    {!participant.isVideoOff ? 'Video On' : 'Video Off'}
                  </Badge>
                </div>
              </div>
            ))}
        </div>

        <div className="fixed left-1/2 bottom-6 transform -translate-x-1/2 flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <Button
            onClick={toggleMute}
            variant={state.isMuted ? "default" : "default"}
            size="icon"
            className="rounded-full"
          >
            {state.isMuted ? <MicOff /> : <Mic />}
          </Button>
          
          <Button
            onClick={toggleVideo}
            variant={state.isVideoOff ? "default" : "default"}
            size="icon"
            className="rounded-full"
          >
            {state.isVideoOff ? <VideoOff /> : <Video />}
          </Button>
          
          <Button
            onClick={toggleDeafen}
            variant={state.isDeafened ? "default" : "default"}
            size="icon"
            className="rounded-full"
          >
            {state.isDeafened ? <VolumeX /> : <Volume2 />}
          </Button>
          
          <Button
            onClick={toggleChat}
            variant={state.isChatVisible ? "default" : "default"}
            size="icon"
            className="rounded-full"
          >
            <MessageSquare />
          </Button>
          
          <Button
            onClick={leaveRoom}
            variant="destructive"
            size="icon"
            className="rounded-full"
          >
            <PhoneOff />
          </Button>
        </div>
      </div>

      {state.isChatVisible && (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-hidden z-10">
          <div className="flex justify-end p-2 absolute top-2 right-2 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleChat}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Chat 
            webrtcHook={{
              localStream, 
              participants, 
              state, 
              isInitialized, 
              initError, 
              toggleMute, 
              toggleVideo, 
              toggleDeafen, 
              toggleChat, 
              muteParticipant, 
              disableParticipantVideo, 
              kickParticipant, 
              deleteRoom, 
              sendMessage, 
              getRemoteStream, 
              attemptReconnect, 
              webrtcClient
            }}
          />
        </div>
      )}
    </div>
  );
};