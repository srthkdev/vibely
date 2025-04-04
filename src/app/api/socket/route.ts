import { NextResponse } from 'next/server';
import { createServer } from 'http';
import { SocketServer } from '@/lib/socket-server';

const server = createServer();
const socketServer = new SocketServer(server);

server.listen(3001, () => {
  console.log('WebSocket server is running on port 3001');
});

export async function GET() {
  return NextResponse.json({ message: 'WebSocket server is running' });
} 