import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getAuth } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"

const prisma = new PrismaClient()

// Get messages for a room
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roomId = params.id
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            username: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Limit to last 100 messages
    })

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.createdAt,
      senderId: message.author.clerkId,
      senderName: message.author.username,
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// Create a new message
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const roomId = params.id
    const { content } = await req.json()

    const user = await prisma.user.findUnique({ where: { clerkId: userId }})
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        roomId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            clerkId: true,
            username: true,
          }
        }
      }
    })

    const formattedMessage = {
      id: message.id,
      content: message.content,
      timestamp: message.createdAt,
      senderId: message.author.clerkId,
      senderName: message.author.username,
    }

    // Here you would typically broadcast the message via Socket.IO
    // For now, we just return the created message
    return NextResponse.json(formattedMessage)
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
} 