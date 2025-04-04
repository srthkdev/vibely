'use client';

import { Device, Transport, Producer, Consumer } from 'mediasoup-client';
import { io, Socket } from 'socket.io-client';

export interface MediasoupState {
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isDeafened: boolean;
  isChatVisible: boolean;
  isAdmin: boolean;
}

export interface Participant {
  id: string;
  name: string;
  imageUrl: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isDeafened: boolean;
  isAdmin: boolean;
}

export class MediasoupClient {
  private socket: Socket;
  private device: Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private participants: Map<string, Participant> = new Map();
  private state: MediasoupState = {
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    isDeafened: false,
    isChatVisible: true,
    isAdmin: false,
  };
  private userId: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(private roomId: string, userId?: string) {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    if (userId) {
      this.userId = userId;
    }

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.state.isConnected = true;
      this.socket.emit('join-room', this.roomId, async (response: any) => {
        if (response.error) {
          console.error('Error joining room:', response.error);
          return;
        }

        await this.loadDevice(response.rtpCapabilities);
      });
    });
    
    // Listen for admin actions from other admins
    this.socket.on('admin-action', (data: { participantId: string, action: string, adminId: string }) => {
      const { participantId, action, adminId } = data;
      
      // If this client is the target of the admin action
      if (this.userId === participantId) {
        switch (action) {
          case 'mute':
            this.state.isMuted = true;
            if (this.localStream) {
              this.localStream.getAudioTracks().forEach(track => {
                track.enabled = false;
              });
            }
            break;
          case 'disable-video':
            this.state.isVideoOff = true;
            if (this.localStream) {
              this.localStream.getVideoTracks().forEach(track => {
                track.enabled = false;
              });
            }
            break;
          case 'kick':
            // Handle being kicked - close connection and redirect
            this.close();
            // We would typically redirect here, but that's handled by the component
            break;
        }
      }
      
      // Update participant state in our local map
      if (this.participants.has(participantId)) {
        const participant = this.participants.get(participantId)!;
        switch (action) {
          case 'mute':
            participant.isMuted = true;
            break;
          case 'unmute':
            participant.isMuted = false;
            break;
          case 'disable-video':
            participant.isVideoOff = true;
            break;
          case 'enable-video':
            participant.isVideoOff = false;
            break;
          case 'kick':
            this.participants.delete(participantId);
            break;
        }
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.state.isConnected = false;
    });
  }

  private async loadDevice(rtpCapabilities: any) {
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });
  }

  private async createSendTransport() {
    return new Promise<void>((resolve, reject) => {
      this.socket.emit('create-send-transport', {}, async (response: any) => {
        if (response.error) {
          reject(response.error);
          return;
        }

        const { id, iceParameters, iceCandidates, dtlsParameters } = response.params;

        this.sendTransport = this.device!.createSendTransport({
          id,
          iceParameters,
          iceCandidates,
          dtlsParameters,
        });

        this.setupTransportListeners(this.sendTransport);

        resolve();
      });
    });
  }

  private setupTransportListeners(transport: Transport) {
    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.socket.emit('connect-transport', {
        transportId: transport.id,
        dtlsParameters,
      }, (response: any) => {
        if (response.error) {
          errback(response.error);
          return;
        }
        callback();
      });
    });

    transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      this.socket.emit('produce', {
        transportId: transport.id,
        kind,
        rtpParameters,
      }, (response: any) => {
        if (response.error) {
          errback(response.error);
          return;
        }
        callback({ id: response.id });
      });
    });
  }

  public async getLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  public async produce(track: MediaStreamTrack) {
    if (!this.sendTransport) {
      await this.createSendTransport();
    }

    const producer = await this.sendTransport!.produce({ track });
    this.producers.set(producer.id, producer);

    producer.on('transportclose', () => {
      producer.close();
      this.producers.delete(producer.id);
    });

    return producer;
  }

  public async consume(producerId: string) {
    if (!this.recvTransport) {
      // Create receive transport if needed
      // Implementation similar to createSendTransport
    }

    const consumer = await this.recvTransport!.consume({
      producerId,
      rtpCapabilities: this.device!.rtpCapabilities,
    });

    this.consumers.set(consumer.id, consumer);

    consumer.on('transportclose', () => {
      consumer.close();
      this.consumers.delete(consumer.id);
    });

    return consumer;
  }

  public toggleMute() {
    this.state.isMuted = !this.state.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.state.isMuted;
      });
    }
  }

  public toggleVideo() {
    this.state.isVideoOff = !this.state.isVideoOff;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !this.state.isVideoOff;
      });
    }
  }

  public toggleDeafen() {
    this.state.isDeafened = !this.state.isDeafened;
  }

  public toggleChat() {
    this.state.isChatVisible = !this.state.isChatVisible;
  }

  public setAdmin(isAdmin: boolean) {
    this.state.isAdmin = isAdmin;
  }
  
  public setUserId(userId: string) {
    this.userId = userId;
  }
  
  // Admin functions to control other participants
  public muteParticipant(participantId: string) {
    if (!this.state.isAdmin || !this.userId) return;
    
    this.socket.emit('admin-action', {
      roomId: this.roomId,
      participantId,
      action: 'mute',
      userId: this.userId
    });
  }
  
  public disableParticipantVideo(participantId: string) {
    if (!this.state.isAdmin || !this.userId) return;
    
    this.socket.emit('admin-action', {
      roomId: this.roomId,
      participantId,
      action: 'disable-video',
      userId: this.userId
    });
  }
  
  public kickParticipant(participantId: string) {
    if (!this.state.isAdmin || !this.userId) return;
    
    this.socket.emit('admin-action', {
      roomId: this.roomId,
      participantId,
      action: 'kick',
      userId: this.userId
    });
  }

  public getState(): MediasoupState {
    return { ...this.state };
  }
  
  /**
   * Initialize the MediasoupClient by getting local media and connecting to the server
   */
  public async initialize(): Promise<void> {
    try {
      // Get local media stream
      await this.getLocalStream();
      
      // Connect to the mediasoup server
      if (this.socket && this.state.isConnected) {
        // Set up local tracks
        await this.setupLocalTracks();
        
        // Emit event that we're initialized
        this.emit('initialized', {});
      }
    } catch (error) {
      console.error('Error initializing MediasoupClient:', error);
      throw error;
    }
  }
  
  /**
   * Set up local tracks for sending to the server
   */
  private async setupLocalTracks(): Promise<void> {
    if (!this.localStream) return;
    
    try {
      // For now, just update the UI
      const videoTrack = this.localStream.getVideoTracks()[0];
      const audioTrack = this.localStream.getAudioTracks()[0];
      
      if (videoTrack) {
        videoTrack.enabled = !this.state.isVideoOff;
      }
      
      if (audioTrack) {
        audioTrack.enabled = !this.state.isMuted;
      }
      
      // In a real implementation, we would create producers for these tracks
      // Update participants list
      this.updateParticipantsList();
    } catch (error) {
      console.error('Error setting up local tracks:', error);
    }
  }
  
  /**
   * Update the participants list and emit an event
   */
  private updateParticipantsList(): void {
    const participantsList = Array.from(this.participants.values());
    this.emit('participants-updated', participantsList);
  }
  
  /**
   * Register an event listener
   * @param event Event name
   * @param callback Callback function
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function
   */
  public off(event: string, callback: Function): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.delete(callback);
    }
  }
  
  /**
   * Emit an event to all registered listeners
   * @param event Event name
   * @param data Event data
   */
  private emit(event: string, data: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }

  public getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  public close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    this.producers.forEach(producer => producer.close());
    this.consumers.forEach(consumer => consumer.close());

    if (this.sendTransport) {
      this.sendTransport.close();
    }

    if (this.recvTransport) {
      this.recvTransport.close();
    }

    this.socket.disconnect();
  }
} 