import { NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import type { NextRequest } from "next/server"

const prisma = new PrismaClient()

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { content } = await req.json()

    const user = await prisma.user.findUnique({ where: { clerkId: userId }})
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        authorId: user.id,
        roomId: params.id,
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

    return NextResponse.json(formattedMessage)
  } catch (error) {
    console.error("[ROOM_MESSAGE_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
} 