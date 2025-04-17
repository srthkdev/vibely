'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Loader2 } from "lucide-react"
import { RoomCard } from "@/components/room-card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import io from "socket.io-client"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

interface Room {
  id: string
  name: string
  description: string
  topics: string[]
  participantCount: number
  maxUsers: number
  isPublic: boolean
  image?: string | null
  ownerId?: string
}

export default function RoomsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef<any>(null)
  const { user } = useUser()

  // Initialize socket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('Initializing socket connection for rooms page');
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      path: '/api/socket',
      addTrailingSlash: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Room management socket connected');
      setSocketConnected(true);
      
      // Join a special room for real-time room updates
      socket.emit('join-room-management');
    });

    socket.on('rooms-updated', () => {
      console.log('Received rooms-updated event, refreshing rooms');
      fetchRooms();
    });

    socket.on('room-participant-count', ({ roomId, count }) => {
      console.log(`Room ${roomId} participant count updated to ${count}`);
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { ...room, participantCount: count } : room
        )
      );
    });

    socket.on('room-deleted', ({ roomId }) => {
      console.log(`Room ${roomId} has been deleted`);
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

  // Fetch rooms from the API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms?query=${searchQuery}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchRooms()
  }, [searchQuery]);

  const handleDeleteRoom = async (roomId: string) => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove room from local state
        setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
        
        // Emit room-deleted event to all clients
        if (socketRef.current) {
          socketRef.current.emit('room-deleted', { roomId });
        }
        
        toast.success('Room deleted successfully');
      } else {
        throw new Error('Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  // Get all unique topics from rooms
  const allTopics = Array.from(
    new Set(rooms.flatMap(room => room.topics))
  )

  // Filter rooms based on selected topics
  const filteredRooms = rooms.filter(room => {
    const matchesTopics = selectedTopics.length === 0 ||
      selectedTopics.some(topic => room.topics.includes(topic))
    
    return matchesTopics
  })

  const handleTopicClick = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  const getTopicColorClass = (index: number) => {
    const colors = [
      "bg-[#FFDC58] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]", // Yellow
      "bg-[#88AAEE] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]", // Blue
      "bg-[#A388EE] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"  // Purple
    ]
    return colors[index % colors.length]
  }

  return (
    <main className="min-h-screen pt-24 pb-20 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px]">
      <div className="container mx-auto px-4">
        {/* Rooms heading with Acme font */}
        <div className="flex justify-center mb-16 pt-12">
          <div className="inline-block px-6 py-2 rounded-full bg-[#ffdc58] text-black font-medium text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="font-['Acme',sans-serif]">Browse Rooms</h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Search and Create Room */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-black h-12"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <Button
              onClick={() => router.push('/rooms/create')}
              variant="yellow"
              className="h-12 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Room
            </Button>
          </div>

          {/* Topics Filter */}
          {allTopics.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 font-['Acme',sans-serif]">Filter by Topics</h2>
              <div className="flex flex-wrap gap-3">
                {allTopics.map((topic, index) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                      selectedTopics.includes(topic)
                        ? getTopicColorClass(index)
                        : 'bg-white dark:bg-[#212121] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="w-full py-8">
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-black dark:text-white animate-spin mr-2" />
                <h3 className="text-xl font-bold text-black dark:text-white font-['Acme',sans-serif]">
                  Loading Rooms
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-white dark:bg-[#212121] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:translate-y-[-4px] transition-transform duration-200">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-4 bg-gray-200 dark:bg-gray-700" />
                        <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700" />
                        <Skeleton className="h-4 w-2/3 mb-6 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                          <Skeleton className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Rooms Grid */}
              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRooms.map((room) => (
                    <RoomCard 
                      key={room.id} 
                      {...room} 
                      isOwner={user?.id === room.ownerId}
                      onDelete={handleDeleteRoom}
                      onEdit={(id) => router.push(`/rooms/edit/${id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="max-w-2xl mx-auto mb-16">
                  <Alert className="bg-white dark:bg-[#212121] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <AlertTitle className="text-xl font-bold italic">
                      <span className="text-[#6366f1] dark:text-[#a5b4fc]">
                        {searchQuery || selectedTopics.length > 0 
                          ? "No Rooms Found"
                          : "No Rooms Available"}
                      </span>
                    </AlertTitle>
                    <AlertDescription>
                      {searchQuery || selectedTopics.length > 0 
                        ? "No rooms found matching your search criteria."
                        : "There are no rooms available at the moment. Be the first to create a room and start a conversation!"}
                    </AlertDescription>
                    <div className="mt-4">
                      <Button 
                        variant="yellow" 
                        size="sm"
                        onClick={() => router.push('/rooms/create')}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Room
                      </Button>
                    </div>
                  </Alert>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
} 