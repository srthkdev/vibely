import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, isPublic, maxUsers, topics, password } = await req.json()

    const room = await prisma.room.create({
      data: {
        name,
        description,
        isPublic,
        maxUsers,
        userId,
        password,
        topics: {
          create: topics.map((topic: string) => ({
            name: topic
          }))
        }
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || ""
    
    const rooms = await prisma.room.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } }
        ]
      },
      include: {
        topics: true,
        participants: {
          select: {
            userId: true
          }
        }
      }
    })

    const roomsWithParticipantCount = rooms.map((room: any) => ({
      ...room,
      participantCount: room.participants.length,
      participants: undefined
    }))

    return NextResponse.json(roomsWithParticipantCount)
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
  }
} 