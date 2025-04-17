import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    JSON.stringify({ message: 'WebRTC signaling service is running' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs'; 