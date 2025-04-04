import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId: params.id,
      },
      orderBy: {
        id: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            clerkId: true,
          },
        },
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return new NextResponse("Content is required", { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        roomId: params.id,
        senderId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            clerkId: true,
          },
        },
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error creating message:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 