import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // Auth isn't required for viewing a room
    
    const room = await prisma.room.findUnique({
      where: {
        id
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
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse the request body to get userId and room data
    const requestData = await req.json()
    const { userId } = requestData
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const room = await prisma.room.findUnique({
      where: { id: params.id }
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.ownerId !== dbUser.id) {
      return NextResponse.json({ error: "Not authorized to update this room" }, { status: 403 })
    }

    // Extract room data from the request
    const { name, description, isPublic, maxUsers, password } = requestData

    const updatedRoom = await prisma.room.update({
      where: { id: params.id },
      data: {
        name,
        description,
        isPublic,
        maxUsers,
        password
      }
    })

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error("Error updating room:", error)
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get userId from URL or request body
    const url = new URL(req.url)
    const userIdParam = url.searchParams.get('userId')
    
    if (!userIdParam) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userIdParam }
    })
    
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const room = await prisma.room.findUnique({
      where: { id: params.id }
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.ownerId !== dbUser.id) {
      return NextResponse.json({ error: "Not authorized to delete this room" }, { status: 403 })
    }

    await prisma.room.delete({
      where: { id: params.id }
    })

    return NextResponse.json({}, { status: 204 })
  } catch (error) {
    console.error("Error deleting room:", error)
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
  }
} 