'use client';

import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import SimplePeer from 'simple-peer';

// Define WebRTC types
export interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
  imageUrl?: string;
  isAdmin?: boolean;
}

export interface WebRTCState {
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isDeafened: boolean;
  isChatVisible: boolean;
  isAdmin: boolean;
}

// Define a custom socket type with request method
interface WebRTCSocket extends Socket {
  request: (event: string, data?: any) => Promise<any>;
  connected: boolean;
  id: string;
}

// Peer connection with metadata
interface PeerConnection {
  peer: SimplePeer.Instance;
  stream?: MediaStream;
  userId: string;
}

export class WebRTCClient extends EventEmitter {
  private socket: WebRTCSocket;
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private roomId: string;
  private userId: string;
  private userName: string = 'Anonymous';
  private userImage: string = '';
  private isAdmin: boolean = false;
  private state: WebRTCState = {
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    isDeafened: false,
    isChatVisible: false,
    isAdmin: false,
  };
  private participants: Map<string, Participant> = new Map();
  private disconnecting: boolean = false;
  private clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  private lastDisconnectTime: number | null = null;

  constructor(options: { 
    roomId: string; 
    userId: string; 
    userName?: string; 
    userImage?: string; 
    isAdmin?: boolean 
  }) {
    super();
    this.roomId = options.roomId;
    this.userId = options.userId;
    this.userName = options.userName || 'Anonymous';
    this.userImage = options.userImage || '';
    this.isAdmin = options.isAdmin || false;
    
    // Initialize state
    this.state = {
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
      isDeafened: false,
      isChatVisible: false,
      isAdmin: this.isAdmin
    };
    
    // Initialize socket with parameters
    this.socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
      auth: {
        userId: this.userId,
        roomId: this.roomId,
        userName: this.userName,
        userImage: this.userImage
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      autoConnect: false,
      transports: ['websocket', 'polling']
    }) as WebRTCSocket;
    
    // Add request method to socket for promise-based requests
    this.socket.request = (event: string, data?: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!this.socket.connected) {
          reject(new Error('Socket not connected'));
          return;
        }
        
        this.socket.emit(event, data, (response: any) => {
          if (response && response.error) {
            reject(response.error);
          } else {
            resolve(response);
          }
        });
      });
    };
    
    // Set up basic socket event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.state.isConnected = true;
      this.emit('state-changed', {...this.state});
    });
    
    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected, reason:', reason);
      this.state.isConnected = false;
      this.emit('state-changed', {...this.state});
      
      // Close and clean up all peers
      this.peers.forEach((peerConnection) => {
        peerConnection.peer.destroy();
      });
      this.peers.clear();
      this.remoteStreams.clear();
    });
    
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Connection confirmation
    this.socket.on('connection-success', ({ id, isAdmin }: { id: string, isAdmin: boolean }) => {
      console.log('Socket connection confirmed by server, ID:', id);
      this.state.isAdmin = isAdmin;
      this.emit('state-changed', {...this.state});
    });
    
    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Socket connection error:', error);
      this.emit('error', new Error(error.message || 'Connection error'));
    });
    
    // Handle kicked from room
    this.socket.on('kicked-from-room', () => {
      console.log('You have been kicked from the room');
      this.emit('kicked');
      this.disconnect();
    });
    
    // Handle room deletion
    this.socket.on('room-deleted', () => {
      console.log('The room has been deleted');
      this.emit('room-deleted');
      this.disconnect();
    });
    
    // Force mute/video off from admin
    this.socket.on('force-mute', () => {
      this.toggleMute(true);
    });
    
    this.socket.on('force-disable-video', () => {
      this.toggleVideo(true);
    });
    
    // Handle new user joining
    this.socket.on('user-joined', (user: Participant) => {
      console.log('User joined:', user);
      
      // Add to participants
      this.participants.set(user.id, user);
      this.emit('participants-updated', Array.from(this.participants.values()));
      
      // Initialize peer connection with the new user
      this.createPeer(user.id, true);
    });
    
    // Handle user leaving
    this.socket.on('user-left', ({ userId }: { userId: string }) => {
      console.log('User left:', userId);
      
      // Remove from participants
      this.participants.delete(userId);
      this.emit('participants-updated', Array.from(this.participants.values()));
      
      // Close peer connection
      const peerConnection = this.peers.get(userId);
      if (peerConnection) {
        peerConnection.peer.destroy();
        this.peers.delete(userId);
      }
      
      // Remove remote stream
      if (this.remoteStreams.has(userId)) {
        this.remoteStreams.delete(userId);
        this.updateRemoteStreams();
      }
    });
    
    // Handle participants list update
    this.socket.on('participants', (participantsList: Participant[]) => {
      console.log('Received participants list:', participantsList);
      
      // Clear existing and add new ones
      this.participants.clear();
      participantsList.forEach(p => {
        this.participants.set(p.id, p);
      });
      
      this.emit('participants-updated', participantsList);
    });
    
    // Handle user status changes
    this.socket.on('user-status-changed', ({ userId, isMuted, isVideoOff }: { userId: string, isMuted: boolean, isVideoOff: boolean }) => {
      const participant = this.participants.get(userId);
      if (participant) {
        participant.isMuted = isMuted;
        participant.isVideoOff = isVideoOff;
        this.participants.set(userId, participant);
        this.emit('participants-updated', Array.from(this.participants.values()));
      }
    });
    
    // WebRTC signaling
    this.socket.on('signal', ({ from, signal }: { from: string, signal: SimplePeer.SignalData }) => {
      console.log('Received signal from:', from);
      
      try {
        // Check if we have an existing peer for this user
        let peerConnection = this.peers.get(from);
        
        // Determine if this is an offer or an answer
        const isOffer = signal.type === 'offer';
        
        // If this is an offer but we already have a peer connection, 
        // close the existing one to create a new one
        if (isOffer && peerConnection && !peerConnection.peer.destroyed) {
          console.log(`Received offer, destroying existing peer for ${from}`);
          peerConnection.peer.destroy();
          this.peers.delete(from);
          peerConnection = undefined;
        }
        
        // If we don't have a peer connection yet, create one
        if (!peerConnection) {
          // If we're receiving an offer, we need to create a non-initiator peer
          // If we're receiving an answer, something is wrong - we should have a peer already
          if (!isOffer) {
            console.log(`Received answer but no peer exists for ${from}, ignoring`);
            return;
          }
          
          console.log(`Creating non-initiator peer for ${from} in response to offer`);
          peerConnection = this.createPeer(from, false);
        }
        
        // If the peer is destroyed, recreate it
        if (peerConnection.peer.destroyed) {
          console.log(`Peer destroyed, recreating for ${from}`);
          peerConnection = this.createPeer(from, false);
        }
        
        // Apply the signal with try-catch
        try {
          console.log(`Applying ${signal.type} signal to peer for ${from}`);
          peerConnection.peer.signal(signal);
        } catch (err) {
          console.error(`Error applying signal to peer for ${from}:`, err);
          
          // Handle specific errors
          if (err instanceof Error) {
            const errorMessage = err.message.toLowerCase();
            
            // If state error, recreate the peer
            if (err.name === 'InvalidStateError' || 
                errorMessage.includes('wrong state') || 
                errorMessage.includes('invalid state')) {
              
              console.log(`Recreating peer for ${from} due to state error`);
              this.peers.delete(from);
              
              // Wait a bit before recreating
              setTimeout(() => {
                if (!this.disconnecting) {
                  const newPeer = this.createPeer(from, isOffer);
                  
                  // After a short delay, try to signal again if appropriate
                  if (isOffer) {
                    setTimeout(() => {
                      try {
                        if (!this.disconnecting && !newPeer.peer.destroyed) {
                          newPeer.peer.signal(signal);
                        }
                      } catch (e) {
                        console.error(`Error re-applying signal to new peer for ${from}:`, e);
                      }
                    }, 500);
                  }
                }
              }, 500);
            }
          }
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
    });
  }

  private createPeer(userId: string, initiator: boolean): PeerConnection {
    console.log(`Creating ${initiator ? 'initiator' : 'receiver'} peer for user ${userId}`);
    
    // Clean up any existing peer connection
    const existingPeer = this.peers.get(userId);
    if (existingPeer) {
      console.log(`Closing existing peer connection for ${userId}`);
      existingPeer.peer.destroy();
      this.peers.delete(userId);
    }
    
    // Create new peer with additional config options
    const peer = new SimplePeer({
      initiator,
      stream: this.localStream || undefined,
      trickle: true,
      sdpTransform: (sdp) => {
        // Add bandwidth restrictions to improve quality/stability
        return sdp.replace(/b=AS:.*\r\n/g, 'b=AS:1000\r\n');
      },
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { 
            urls: 'turn:numb.viagenie.ca',
            username: 'webrtc@live.com',
            credential: 'muazkh'
          }
        ]
      }
    });
    
    const peerConnection: PeerConnection = {
      peer,
      userId
    };
    
    // Handle peer signals (for WebRTC connection)
    peer.on('signal', (data) => {
      console.log(`Generated signal for peer: ${userId}`);
      
      try {
        // Don't send signals if we're disconnecting
        if (this.disconnecting) return;
        
        // Add a small delay to ensure ordering
        setTimeout(() => {
          if (!this.disconnecting && !peer.destroyed) {
            this.socket.emit('signal', {
              to: userId,
              signal: data
            });
          }
        }, 100);
      } catch (err) {
        console.error('Error sending signal:', err);
      }
    });
    
    // Handle stream from peer
    peer.on('stream', (stream) => {
      console.log(`Received stream from peer: ${userId}`);
      peerConnection.stream = stream;
      this.remoteStreams.set(userId, stream);
      this.updateRemoteStreams();
    });
    
    // Handle error
    peer.on('error', (err) => {
      console.error(`Peer connection error for ${userId}:`, err);
      
      // Don't emit errors if we're intentionally disconnecting
      if (!this.disconnecting) {
        this.emit('error', err);
      }
      
      // Try to recreate peer connection after a delay, but only under certain conditions
      if (!this.disconnecting && this.socket.connected && peer.destroyed) {
        // Check if we're not in an infinite reconnection loop
        const currentPeerCount = this.peers.size;
        
        setTimeout(() => {
          // Only recreate if:
          // 1. We're still connected
          // 2. The peer is still destroyed
          // 3. We haven't already recreated it (by checking if the peers map size hasn't increased)
          if (!this.disconnecting && 
              this.socket.connected && 
              peer.destroyed && 
              this.peers.size <= currentPeerCount) {
            console.log(`Recreating peer for ${userId} after error`);
            this.createPeer(userId, initiator);
          }
        }, 2000);
      }
    });
    
    // Handle peer connection closing
    peer.on('close', () => {
      console.log(`Peer connection closed: ${userId}`);
      this.peers.delete(userId);
      
      // Remove the stream
      if (this.remoteStreams.has(userId)) {
        this.remoteStreams.delete(userId);
        this.updateRemoteStreams();
      }
    });
    
    // Store peer
    this.peers.set(userId, peerConnection);
    return peerConnection;
  }

  public async initialize(options: { 
    userId: string;
    userName: string;
    userImage?: string;
    isAdmin?: boolean;
    roomId: string;
    enableAudio?: boolean;
    enableVideo?: boolean;
  }): Promise<boolean> {
    try {
      // Add a short delay before initialization to avoid rapid reconnection attempts
      if (this.lastDisconnectTime && (Date.now() - this.lastDisconnectTime < 2000)) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`Initializing WebRTC client for roomId: ${options.roomId} userId: ${options.userId} (instance: ${this.clientId})`);
      
      // Update properties with the latest values
      this.userId = options.userId;
      this.userName = options.userName;
      this.userImage = options.userImage || '';
      this.isAdmin = options.isAdmin || false;
      this.roomId = options.roomId;
      
      // Reset state
      this.state = {
        isConnected: false,
        isMuted: !options.enableAudio,
        isVideoOff: !options.enableVideo,
        isDeafened: false,
        isChatVisible: false,
        isAdmin: this.isAdmin
      };
      
      // Reset these in case of reinitialization
      this.disconnecting = false;
      this.peers.clear();
      this.remoteStreams.clear();
      this.updateRemoteStreams();
      
      // Disconnect existing socket if any
      if (this.socket.connected) {
        this.socket.disconnect();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Start local media
      try {
        await this.startLocalMedia(
          options.enableAudio !== false, 
          options.enableVideo !== false
        );
      } catch (mediaError) {
        console.error('Media access error:', mediaError);
        
        // If camera/mic permission is denied, try to proceed with just audio or no media
        if (mediaError instanceof Error && 
            (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError')) {
          
          console.log('Permission denied for media. Trying fallback options...');
          
          // Try with just audio
          if (options.enableVideo) {
            try {
              await this.startLocalMedia(options.enableAudio !== false, false);
              this.state.isVideoOff = true;
            } catch (audioError) {
              // If that also fails, proceed with no media
              console.error('Audio-only fallback failed:', audioError);
              this.localStream = null;
              this.state.isMuted = true;
              this.state.isVideoOff = true;
            }
          } else {
            // No media
            this.localStream = null;
            this.state.isMuted = true;
            this.state.isVideoOff = true;
          }
        } else {
          // For other errors, let the caller handle it
          throw mediaError;
        }
      }
      
      // Update socket auth data
      this.socket.auth = {
        userId: this.userId,
        roomId: this.roomId,
        userName: this.userName,
        userImage: this.userImage
      };
      
      // Connect to signaling server with timeout
      const connectPromise = new Promise<boolean>((resolve, reject) => {
        // Connection success handler
        const onConnect = () => {
          console.log('Socket connected successfully');
          this.socket.off('connect_error', onConnectError);
          resolve(true);
        };
        
        // Connection error handler
        const onConnectError = (err: Error) => {
          console.error('Socket connection error:', err);
          this.socket.off('connect', onConnect);
          reject(err);
        };
        
        // Register handlers
        this.socket.once('connect', onConnect);
        this.socket.once('connect_error', onConnectError);
        
        // Connect socket
        this.socket.connect();
        
        // Set a timeout
        setTimeout(() => {
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onConnectError);
          
          if (!this.socket.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout
      });
      
      // Wait for connection to complete
      await connectPromise;
      
      // Update connected state
      this.state.isConnected = true;
      this.emit('state-changed', {...this.state});
      
      return true;
    } catch (error) {
      console.error('Failed to initialize WebRTC client:', error);
      this.emit('error', error);
      
      // Ensure proper cleanup
      if (this.localStream) {
        try {
          this.localStream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.error('Error stopping tracks:', e);
        }
        this.localStream = null;
      }
      
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      
      return false;
    }
  }

  private async startLocalMedia(enableAudio: boolean, enableVideo: boolean): Promise<void> {
    try {
      if (this.localStream) {
        // Stop all tracks in the existing stream
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: enableAudio,
        video: enableVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      });
      
      // Store the local stream
      this.localStream = stream;
      
      // Set initial mute/video state based on options
      this.state.isMuted = !enableAudio;
      this.state.isVideoOff = !enableVideo;
      this.emit('state-changed', {...this.state});
      
      // Emit the local stream
      this.emit('local-stream-updated', stream);
      
      // Add the stream to existing peers
      this.peers.forEach(peerConnection => {
        if (stream) {
          stream.getTracks().forEach(track => {
            peerConnection.peer.addTrack(track, stream);
          });
        }
      });
      
      // Update user status
      this.socket.emit('user-status-change', {
        isMuted: this.state.isMuted,
        isVideoOff: this.state.isVideoOff
      });
    } catch (error) {
      console.error('Failed to get user media:', error);
      this.emit('error', error instanceof Error ? error : new Error('Failed to access camera/microphone'));
      
      // Set state correctly if media failed
      this.state.isMuted = true;
      this.state.isVideoOff = true;
      this.emit('state-changed', {...this.state});
    }
  }

  private updateRemoteStreams(): void {
    this.emit('remote-streams-updated', this.remoteStreams);
  }

  public getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  public toggleMute(forceMute?: boolean): void {
    if (!this.localStream) return;
    
    const newMutedState = forceMute !== undefined ? forceMute : !this.state.isMuted;
    
    // Toggle audio tracks
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !newMutedState;
    });
    
    // Update state
    this.state.isMuted = newMutedState;
    this.emit('state-changed', {...this.state});
    
    // Notify others about status change
    this.socket.emit('user-status-change', {
      isMuted: this.state.isMuted,
      isVideoOff: this.state.isVideoOff
    });
  }

  public toggleVideo(forceVideoOff?: boolean): void {
    if (!this.localStream) return;
    
    const newVideoOffState = forceVideoOff !== undefined ? forceVideoOff : !this.state.isVideoOff;
    
    // Toggle video tracks
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = !newVideoOffState;
    });
    
    // Update state
    this.state.isVideoOff = newVideoOffState;
    this.emit('state-changed', {...this.state});
    
    // Notify others about status change
    this.socket.emit('user-status-change', {
      isMuted: this.state.isMuted,
      isVideoOff: this.state.isVideoOff
    });
  }

  public toggleDeafen(): void {
    this.state.isDeafened = !this.state.isDeafened;
    this.emit('state-changed', {...this.state});
    
    // Mute all remote streams when deafened
    this.remoteStreams.forEach(stream => {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !this.state.isDeafened;
      });
    });
  }

  public toggleChat(): void {
    this.state.isChatVisible = !this.state.isChatVisible;
    this.emit('state-changed', {...this.state});
  }

  public setAdmin(isAdmin: boolean): void {
    this.isAdmin = isAdmin;
    this.state.isAdmin = isAdmin;
    this.emit('state-changed', {...this.state});
  }

  public muteParticipant(participantId: string): void {
    if (this.state.isAdmin) {
      this.socket.emit('admin-action', {
        targetUserId: participantId,
        action: 'mute'
      });
    }
  }

  public disableParticipantVideo(participantId: string): void {
    if (this.state.isAdmin) {
      this.socket.emit('admin-action', {
        targetUserId: participantId,
        action: 'disable-video'
      });
    }
  }

  public kickParticipant(participantId: string): void {
    if (this.state.isAdmin) {
      this.socket.emit('admin-action', {
        targetUserId: participantId,
        action: 'kick'
      });
    }
  }

  public deleteRoom(): void {
    if (this.state.isAdmin) {
      this.socket.emit('delete-room');
    }
  }

  public sendMessage(message: string): void {
    this.socket.emit('send-message', message);
  }

  public disconnect(): void {
    console.log(`Disconnecting WebRTC client (instance: ${this.clientId})`);
    
    // Set disconnecting flag to prevent reconnection attempts
    this.disconnecting = true;
    this.lastDisconnectTime = Date.now();
    
    // Close all peer connections
    for (const [userId, peerConnection] of this.peers.entries()) {
      console.log(`Closing peer connection with ${userId}`);
      try {
        peerConnection.peer.destroy();
      } catch (err) {
        console.error(`Error destroying peer for ${userId}:`, err);
      }
    }
    this.peers.clear();
    
    // Clear streams
    this.remoteStreams.clear();
    this.updateRemoteStreams();
    
    // Stop local stream tracks
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      tracks.forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.error('Error stopping track:', err);
        }
      });
      this.localStream = null;
    }
    
    // Disconnect socket
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
    
    // Reset state
    this.state = {
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
      isDeafened: false,
      isChatVisible: false,
      isAdmin: this.isAdmin
    };
    this.emit('state-changed', {...this.state});
    
    // Reset disconnecting flag (in case the object is reused)
    setTimeout(() => {
      this.disconnecting = false;
    }, 2000);
  }

  public debug(): void {
    console.log('WebRTC Client Debug:');
    console.log('- Room ID:', this.roomId);
    console.log('- User ID:', this.userId);
    console.log('- Socket connected:', this.socket.connected);
    console.log('- Socket ID:', this.socket.id);
    console.log('- Peer connections:', this.peers.size);
    console.log('- Remote streams:', this.remoteStreams.size);
    console.log('- Participants:', this.participants.size);
    console.log('- State:', this.state);
  }

  public onSocketEvent(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  public offSocketEvent(event: string, callback: (...args: any[]) => void): void {
    this.socket.off(event, callback);
  }

  public emitSocketEvent(event: string, data: any): void {
    if (this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getState(): WebRTCState {
    return {...this.state};
  }
} 