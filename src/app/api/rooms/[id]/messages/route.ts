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

    const body = await req.json()
    const { content } = body

    const message = await prisma.message.create({
      data: {
        content,
        userId: user.id,
        roomId: params.id,
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("[ROOM_MESSAGE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        roomId: params.id,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("[ROOM_MESSAGE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 