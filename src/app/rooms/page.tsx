'use client'

import { useState, useEffect } from "react"
import { RoomCard } from "@/components/room-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { FaPlus, FaSearch } from "react-icons/fa"

// Reference to the mock rooms (this would be replaced by a real API call in production)
// Import the mockRooms from the create page
import { mockRooms } from "./create/page"

export default function RoomsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [rooms, setRooms] = useState<any[]>([])
  
  // Effect to fetch and update rooms when the component mounts or when mockRooms changes
  useEffect(() => {
    // In a real app, this would be an API call
    setRooms(mockRooms)
  }, [])
  
  return (
    <main className="relative min-h-screen pt-24 pb-20 bg-bg dark:bg-secondaryBlack bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px]">
      <div className="container mx-auto px-4">
        {/* Discover Rooms heading with Acme font */}
        <div className="flex justify-center mb-16 pt-12">
          <div className="inline-block px-6 py-2 rounded-full bg-[#ffdc58] text-black font-medium text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="font-['Acme',sans-serif]">Discover Rooms</h1>
          </div>
        </div>
        
        {/* Search bar with 3D look */}
        <div className="max-w-2xl mx-auto mb-16 relative">
          <div className="flex">
            <div className="relative flex-grow">
              <Input
                type="search"
                placeholder="Search rooms by topic..."
                className="pl-12 pr-4 py-3 h-14 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#212121] rounded-lg focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Create Room Button */}
            <div className="ml-4">
              <Button
                variant="yellow"
                size="lg"
                className="flex items-center gap-2"
              >
                <Link href="/rooms/create" legacyBehavior passHref>
                  <a className="flex items-center gap-2">
                    <FaPlus className="h-4 w-4" />
                    Create Room
                  </a>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Display rooms or no rooms message */}
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {rooms
              .filter((room) => 
                room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.topics.some((topic: string) => 
                  topic.toLowerCase().includes(searchQuery.toLowerCase())
                )
              )
              .map((room) => (
                <RoomCard key={room.id} {...room} />
              ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mb-16">
            <Alert className="bg-white dark:bg-[#212121] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <AlertTitle className="text-xl font-bold italic">
                <span className="text-[#6366f1] dark:text-[#a5b4fc]">No Rooms Available</span>
              </AlertTitle>
              <AlertDescription>
                There are no rooms available at the moment. Be the first to create a room and start a conversation!
              </AlertDescription>
              <div className="mt-4">
                <Button 
                  variant="yellow" 
                  size="sm"
                >
                  <Link href="/rooms/create" legacyBehavior passHref>
                    <a>Create Room</a>
                  </Link>
                </Button>
              </div>
            </Alert>
          </div>
        )}
      </div>
    </main>
  )
} 