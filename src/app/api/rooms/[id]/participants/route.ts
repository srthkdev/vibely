import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Find or create the user in our database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })
    
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          username: user.username || `user-${user.id.substring(0, 8)}`,
        }
      })
    }

    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    if (!room) {
      return new NextResponse("Room not found", { status: 404 })
    }

    if (room._count.participants >= room.maxUsers) {
      return new NextResponse("Room is full", { status: 400 })
    }
    
    // Check if participant already exists
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: {
          userId: dbUser.id,
          roomId: params.id,
        },
      },
    })
    
    if (existingParticipant) {
      return NextResponse.json(existingParticipant)
    }

    const participant = await prisma.roomParticipant.create({
      data: {
        userId: dbUser.id,
        roomId: params.id,
        isMuted: false,
        isDeafen: false,
        hasVideo: true,
      },
    })

    return NextResponse.json(participant)
  } catch (error) {
    console.error("[ROOM_PARTICIPANT_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })
    
    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 })
    }

    await prisma.roomParticipant.delete({
      where: {
        userId_roomId: {
          userId: dbUser.id,
          roomId: params.id,
        },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ROOM_PARTICIPANT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Admin actions for managing participants
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })
    
    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 })
    }
    
    // Get the room to check if the user is the admin
    const room = await prisma.room.findUnique({
      where: { id: params.id }
    })
    
    if (!room) {
      return new NextResponse("Room not found", { status: 404 })
    }
    
    // Check if the user is the room owner/admin
    if (room.ownerId !== dbUser.id) {
      return new NextResponse("Not authorized to manage participants", { status: 403 })
    }
    
    const { participantId, action } = await req.json()
    
    if (!participantId || !action) {
      return new NextResponse("Missing required fields", { status: 400 })
    }
    
    // Get the participant to update
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        id: participantId,
      },
    })
    
    if (!participant) {
      return new NextResponse("Participant not found", { status: 404 })
    }
    
    // Perform the requested action
    switch (action) {
      case 'mute':
        await prisma.roomParticipant.update({
          where: { id: participantId },
          data: { isMuted: true }
        })
        break
      case 'unmute':
        await prisma.roomParticipant.update({
          where: { id: participantId },
          data: { isMuted: false }
        })
        break
      case 'disable-video':
        await prisma.roomParticipant.update({
          where: { id: participantId },
          data: { hasVideo: false }
        })
        break
      case 'enable-video':
        await prisma.roomParticipant.update({
          where: { id: participantId },
          data: { hasVideo: true }
        })
        break
      case 'kick':
        await prisma.roomParticipant.delete({
          where: { id: participantId }
        })
        break
      default:
        return new NextResponse("Invalid action", { status: 400 })
    }
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ROOM_PARTICIPANT_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 