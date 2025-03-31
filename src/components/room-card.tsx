import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface RoomCardProps {
  id: string
  name: string
  description: string
  topics: string[]
  participantCount: number
  maxUsers: number
  isPublic: boolean
}

export function RoomCard({
  id,
  name,
  description,
  topics,
  participantCount,
  maxUsers,
  isPublic,
}: RoomCardProps) {
  return (
    <Card className="shadow-neobrutalism border-2 border-black">
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {topics.map((topic) => (
            <Badge key={topic} variant="secondary">
              {topic}
            </Badge>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {participantCount}/{maxUsers} participants
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/room/${id}`} className="w-full">
          <Button className="w-full" variant="default">
            Join Room
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
} 