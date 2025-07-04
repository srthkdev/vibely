import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Users, MoreVertical, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface RoomCardProps {
  id: string
  name: string
  description: string | null
  topics: string[]
  participantCount?: number
  maxUsers: number
  isPublic: boolean
  image?: string | null
  isOwner?: boolean
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
}

export function RoomCard({
  id,
  name,
  description,
  topics,
  participantCount,
  maxUsers,
  isPublic,
  image,
  isOwner = false,
  onDelete,
  onEdit
}: RoomCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const getTopicColorClass = (index: number) => {
    const colors = [
      "bg-[#FFDC58] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", // Yellow
      "bg-[#88AAEE] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", // Blue
      "bg-[#A388EE] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"  // Purple
    ]
    return colors[index % colors.length]
  }

  return (
    <Card className="shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-black bg-[#fef2e8] dark:bg-[#212121] overflow-hidden hover:translate-y-[-4px] transition-transform duration-200">
      {/* Room Thumbnail */}
      <div className="relative w-full h-48 bg-gradient-to-r from-[#fef2e8] to-[#Ffdc58]">
        {image ? (
          <Image 
            src={image}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-white font-bold text-2xl font-['Acme',sans-serif]">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        
        {/* Three-dot menu for room actions */}
        {isOwner && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-black/20 hover:bg-black/40 text-white">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => onEdit?.(id)}
                >
                  <Edit className="h-4 w-4" />
                  Edit Room
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => {
                    if (onDelete) {
                      setIsDeleting(true);
                      onDelete(id);
                    }
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Room'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-['Acme',sans-serif]">{name}</CardTitle>
          <div className={`p-1.5 rounded-full border-2 border-black ${isPublic ? 'bg-[#88AAEE]' : 'bg-[#A388EE]'}`}>
            {isPublic ? (
              <Eye className="h-4 w-4 text-black" />
            ) : (
              <EyeOff className="h-4 w-4 text-black" />
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2">{description || 'No description provided'}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, index) => (
            <div 
              key={topic} 
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm text-black border-2 ${getTopicColorClass(index)}`}
            >
              {topic}
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" />
          <span>{participantCount || 0}/{maxUsers} participants</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all" 
          variant="yellow"
          onClick={() => router.push(`/rooms/${id}`)}
        >
          Join Room
        </Button>
      </CardFooter>
    </Card>
  )
} 