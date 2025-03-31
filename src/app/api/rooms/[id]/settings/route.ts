import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, description, isPublic, maxUsers, topics, password } = body

    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
      },
      include: {
        owner: true,
      },
    })

    if (!room) {
      return new NextResponse("Room not found", { status: 404 })
    }

    if (room.ownerId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const updatedRoom = await prisma.room.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        isPublic,
        maxUsers,
        topics,
        password,
      },
    })

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error("[ROOM_SETTINGS_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
      },
      include: {
        owner: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!room) {
      return new NextResponse("Room not found", { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error("[ROOM_SETTINGS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 