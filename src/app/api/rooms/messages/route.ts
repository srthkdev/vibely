import { NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await getAuth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { content } = body

    const message = await prisma.message.create({
      data: {
        content,
        userId,
        roomId: params.id,
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("[ROOM_MESSAGE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 