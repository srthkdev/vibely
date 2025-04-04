import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// Define simplified types for mediasoup components
interface MediasoupTransport {
  id: string;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
  connect: (options: any) => Promise<void>;
  produce: (options: any) => Promise<MediasoupProducer>;
  consume: (options: any) => Promise<MediasoupConsumer>;
  on: (event: string, callback: any) => void;
  close: () => void;
}

interface MediasoupProducer {
  id: string;
  kind: string;
  close: () => void;
  on: (event: string, callback: any) => void;
}

interface MediasoupConsumer {
  id: string;
  kind: string;
  rtpParameters: any;
  close: () => void;
  on: (event: string, callback: any) => void;
}

interface MediasoupRouter {
  rtpCapabilities: any;
  createWebRtcTransport: (options: any) => Promise<MediasoupTransport>;
}

interface MediasoupWorkerInstance {
  createRouter: (options: any) => Promise<MediasoupRouter>;
}

type DtlsState = 'new' | 'connecting' | 'connected' | 'failed' | 'closed';

interface MediasoupWorker {
  worker: MediasoupWorkerInstance;
  router: MediasoupRouter;
  transports: Map<string, MediasoupTransport>;
  producers: Map<string, MediasoupProducer>;
  consumers: Map<string, MediasoupConsumer>;
}

export class SocketServer {
  private io: SocketIOServer;
  private workers: MediasoupWorker[] = [];
  private currentWorkerIndex = 0;
  private prisma = new PrismaClient();

  constructor(server: NetServer) {
    this.io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
    });

    this.setupSocketHandlers();
  }

  private async setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-room', async (roomId: string, callback) => {
        try {
          const worker = await this.getNextWorker();
          const router = worker.router;

          const rtpCapabilities = router.rtpCapabilities;
          callback({ rtpCapabilities });
        } catch (error) {
          console.error('Error joining room:', error);
          callback({ error: 'Failed to join room' });
        }
      });

      socket.on('create-send-transport', async (data, callback) => {
        try {
          const worker = await this.getNextWorker();
          const transport = await worker.router.createWebRtcTransport({
            listenIps: [{ ip: '127.0.0.1', announcedIp: null }],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
          });

          worker.transports.set(transport.id, transport);

          transport.on('dtlsstatechange', (dtlsState: DtlsState) => {
            if (dtlsState === 'closed') {
              worker.transports.delete(transport.id);
            }
          });

          callback({
            params: {
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
            },
          });
        } catch (error) {
          console.error('Error creating send transport:', error);
          callback({ error: 'Failed to create send transport' });
        }
      });

      socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
        try {
          const worker = await this.getNextWorker();
          const transport = worker.transports.get(transportId);
          if (!transport) {
            throw new Error('Transport not found');
          }

          await transport.connect({ dtlsParameters });
          callback({ success: true });
        } catch (error) {
          console.error('Error connecting transport:', error);
          callback({ error: 'Failed to connect transport' });
        }
      });

      socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
        try {
          const worker = await this.getNextWorker();
          const transport = worker.transports.get(transportId);
          if (!transport) {
            throw new Error('Transport not found');
          }

          const producer = await transport.produce({ kind, rtpParameters });
          worker.producers.set(producer.id, producer);

          producer.on('transportclose', () => {
            producer.close();
            worker.producers.delete(producer.id);
          });

          callback({ id: producer.id });
        } catch (error) {
          console.error('Error producing:', error);
          callback({ error: 'Failed to produce' });
        }
      });

      socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
        try {
          const worker = await this.getNextWorker();
          const transport = worker.transports.get(transportId);
          if (!transport) {
            throw new Error('Transport not found');
          }

          const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
          });

          worker.consumers.set(consumer.id, consumer);

          consumer.on('transportclose', () => {
            consumer.close();
            worker.consumers.delete(consumer.id);
          });

          callback({
            id: consumer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          });
        } catch (error) {
          console.error('Error consuming:', error);
          callback({ error: 'Failed to consume' });
        }
      });

      // Handle admin actions
      socket.on('admin-action', async (data: { roomId: string, participantId: string, action: string, userId: string }) => {
        try {
          const { roomId, participantId, action, userId } = data;
          
          // Verify if the user is an admin (room owner)
          const isAdmin = await this.verifyAdmin(userId, roomId);
          
          if (!isAdmin) {
            socket.emit('error', { message: 'Unauthorized: Not an admin' });
            return;
          }
          
          // Broadcast the admin action to all clients in the room
          socket.to(roomId).emit('admin-action', {
            participantId,
            action,
            adminId: userId
          });
          
          console.log(`Admin action: ${action} on participant ${participantId} in room ${roomId}`);
        } catch (error) {
          console.error('Error handling admin action:', error);
          socket.emit('error', { message: 'Failed to process admin action' });
        }
      });
      
      // Handle room joining
      socket.on('join-room-chat', (roomId: string, userData: any) => {
        socket.join(roomId);
        console.log(`User ${userData.name} joined room ${roomId}`);
        
        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          id: userData.id,
          name: userData.name,
          imageUrl: userData.imageUrl
        });
      });
      
      // Handle room leaving
      socket.on('leave-room-chat', (roomId: string, userData: any) => {
        socket.leave(roomId);
        console.log(`User ${userData.name} left room ${roomId}`);
        
        // Notify others in the room
        socket.to(roomId).emit('user-left', {
          id: userData.id,
          name: userData.name
        });
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private async getNextWorker(): Promise<MediasoupWorker> {
    if (this.workers.length === 0) {
      // Create a mock worker for development
      const worker = this.createMockWorker();
      this.workers.push(worker);
    }

    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    return worker;
  }

  /**
   * Verifies if a user is an admin (room owner) for a specific room
   * @param userId The user ID to check
   * @param roomId The room ID to check against
   * @returns Promise<boolean> True if the user is an admin, false otherwise
   */
  private async verifyAdmin(userId: string, roomId: string): Promise<boolean> {
    try {
      // Find the room and check if the user is the owner
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: { ownerId: true }
      });
      
      if (!room) return false;
      
      // Find the user with the given clerkId
      const user = await this.prisma.user.findFirst({
        where: { clerkId: userId }
      });
      
      if (!user) return false;
      
      // Check if the user is the room owner
      return room.ownerId === user.id;
    } catch (error) {
      console.error('Error verifying admin status:', error);
      return false;
    }
  }
  
  private createMockWorker(): MediasoupWorker {
    // This is a simplified mock implementation for development
    // In production, you would use the actual mediasoup library
    const mockRouter: MediasoupRouter = {
      rtpCapabilities: { codecs: [], headerExtensions: [] },
      createWebRtcTransport: async (options) => {
        const mockTransport: MediasoupTransport = {
          id: `transport-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          iceParameters: { usernameFragment: 'mock', password: 'mock' },
          iceCandidates: [{ foundation: 'mock', priority: 1, ip: '127.0.0.1', port: 10000, type: 'host' }],
          dtlsParameters: { role: 'auto', fingerprints: [{ algorithm: 'sha-256', value: 'mock' }] },
          connect: async () => {},
          produce: async (options) => {
            const mockProducer: MediasoupProducer = {
              id: `producer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              kind: options.kind,
              close: () => {},
              on: (event, callback) => {}
            };
            return mockProducer;
          },
          consume: async (options) => {
            const mockConsumer: MediasoupConsumer = {
              id: `consumer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              kind: 'audio',
              rtpParameters: { codecs: [], headerExtensions: [] },
              close: () => {},
              on: (event, callback) => {}
            };
            return mockConsumer;
          },
          on: (event, callback) => {},
          close: () => {}
        };
        return mockTransport;
      }
    };

    const mockWorker: MediasoupWorkerInstance = {
      createRouter: async () => mockRouter
    };

    // Return the mock worker with empty maps for transports, producers, and consumers
    return {
      worker: mockWorker,
      router: mockRouter,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map()
    };
  }
} 