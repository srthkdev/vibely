import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { name, description, isPublic, maxUsers, topics, password, userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Find the user in our database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    
    if (!dbUser) {
      // Create a new user if they don't exist
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          username: `user-${userId.substring(0, 8)}`,
        }
      })
      
      if (!dbUser) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }
    }

    // Create the room with the authenticated user as owner
    const room = await prisma.room.create({
      data: {
        name,
        description,
        isPublic,
        maxUsers,
        ownerId: dbUser.id,
        password: password || undefined,
        topics,
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || ""
    
    // Get rooms from database with owner information
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } }
        ]
      },
      include: {
        participants: true,
        owner: {
          select: {
            id: true,
            username: true,
            clerkId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the response with participant count and owner info
    const roomsWithParticipantCount = rooms.map((room) => ({
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