import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
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

    const participant = await prisma.participant.create({
      data: {
        userId: user.id,
        roomId: params.id,
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

    await prisma.participant.delete({
      where: {
        userId_roomId: {
          userId: user.id,
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