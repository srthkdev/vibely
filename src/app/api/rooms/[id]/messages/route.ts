import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Try both auth methods to ensure compatibility
    let userId;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (authError) {
      console.error("Auth error:", authError);
      // Try alternative auth method
      const user = await currentUser();
      userId = user?.id;
    }

    // If not authenticated, return empty messages array instead of error
    // This prevents breaking the UI when auth is still resolving
    if (!userId) {
      console.warn("User not authenticated, returning empty messages array");
      return NextResponse.json([]);
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId: params.id,
      },
      orderBy: {
        timestamp: "asc", // Order by timestamp
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

    // Transform to expected format by the client
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      sender: {
        id: message.sender.clerkId,
        name: message.sender.username || 'Anonymous',
      }
    }));

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    // Return empty array instead of error to prevent UI from breaking
    return NextResponse.json([])
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