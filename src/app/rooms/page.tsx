import { RoomCard } from "@/components/room-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// This would be replaced with actual data from the database
const mockRooms = [
  {
    id: "1",
    name: "Tech Enthusiasts",
    description: "Discuss the latest in technology and innovation",
    topics: ["Technology", "Innovation", "Programming"],
    participantCount: 5,
    maxUsers: 10,
    isPublic: true,
  },
  {
    id: "2",
    name: "Art & Design",
    description: "Share and discuss art, design, and creativity",
    topics: ["Art", "Design", "Creativity"],
    participantCount: 3,
    maxUsers: 8,
    isPublic: true,
  },
  {
    id: "3",
    name: "Gaming Community",
    description: "Connect with fellow gamers and discuss gaming",
    topics: ["Gaming", "Esports", "Strategy"],
    participantCount: 7,
    maxUsers: 12,
    isPublic: true,
  },
]

export default function RoomsPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Discover Rooms</h1>
        <Link href="/rooms/create">
          <Button>Create Room</Button>
        </Link>
      </div>

      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search rooms by topic..."
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRooms.map((room) => (
          <RoomCard key={room.id} {...room} />
        ))}
      </div>
    </main>
  )
} 