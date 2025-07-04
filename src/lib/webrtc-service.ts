import { io, Socket } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import { useWebRTCStore } from '@/stores/webrtc-store'
import { useRoomStore } from '@/stores/room-store'
import type { Participant, Message } from '@/lib/schemas'

interface PeerConnection {
  peer: SimplePeer.Instance
  userId: string
  stream?: MediaStream
}

class WebRTCService {
  private socket: Socket | null = null
  private peers: Map<string, PeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private roomId: string | null = null
  private userId: string | null = null
  private userName: string | null = null
  private userImage: string | null = null
  private isInitialized = false

  async initialize(options: {
    roomId: string
    userId: string
    userName: string
    userImage?: string
    enableAudio?: boolean
    enableVideo?: boolean
  }): Promise<boolean> {
    try {
      const webrtcStore = useWebRTCStore.getState()
      const roomStore = useRoomStore.getState()
      
      webrtcStore.setConnectionStatus('connecting')
      webrtcStore.setInitError(null)
      
      // Store connection info
      this.roomId = options.roomId
      this.userId = options.userId
      this.userName = options.userName
      this.userImage = options.userImage || ''
      
      // Initialize media first
      await this.initializeMedia(options.enableAudio !== false, options.enableVideo !== false)
      
      // Initialize socket connection
      await this.initializeSocket()
      
      this.isInitialized = true
      webrtcStore.setConnectionStatus('connected')
      
      return true
    } catch (error) {
      console.error('WebRTC initialization failed:', error)
      const webrtcStore = useWebRTCStore.getState()
      webrtcStore.setConnectionStatus('failed')
      webrtcStore.setInitError(error instanceof Error ? error : new Error('Initialization failed'))
      return false
    }
  }

  private async initializeMedia(enableAudio: boolean, enableVideo: boolean): Promise<void> {
    try {
      const webrtcStore = useWebRTCStore.getState()
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: enableAudio,
        video: enableVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      })
      
      this.localStream = stream
      webrtcStore.setLocalStream(stream)
      
      // Set initial mute/video state
      webrtcStore.setState({
        isMuted: !enableAudio,
        isVideoOff: !enableVideo
      })
      
    } catch (error) {
      console.error('Media initialization failed:', error)
      
      // Try with more permissive constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: enableAudio,
          video: false // Fallback to audio only
        })
        
        this.localStream = stream
        const webrtcStore = useWebRTCStore.getState()
        webrtcStore.setLocalStream(stream)
        webrtcStore.setState({
          isMuted: !enableAudio,
          isVideoOff: true
        })
      } catch (fallbackError) {
        console.error('Fallback media initialization failed:', fallbackError)
        throw new Error('Camera and microphone access denied')
      }
    }
  }

  private async initializeSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const webrtcStore = useWebRTCStore.getState()
      const roomStore = useRoomStore.getState()
      
      // Disconnect existing socket
      if (this.socket) {
        this.socket.disconnect()
      }
      
      // Create new socket connection
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        path: '/api/socket',
        auth: {
          userId: this.userId,
          roomId: this.roomId,
          userName: this.userName,
          userImage: this.userImage
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      })
      
      // Connection success
      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id)
        roomStore.setConnectionState(true)
        resolve()
      })
      
      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        roomStore.setConnectionState(false)
        reject(error)
      })
      
      // Setup event listeners
      this.setupSocketListeners()
    })
  }

  private setupSocketListeners(): void {
    if (!this.socket) return
    
    const webrtcStore = useWebRTCStore.getState()
    const roomStore = useRoomStore.getState()
    
    // User joined
    this.socket.on('user-joined', (participant: Participant) => {
      console.log('User joined:', participant)
      roomStore.addParticipant(participant)
      this.createPeerConnection(participant.id, true)
    })
    
    // User left
    this.socket.on('user-left', ({ userId }: { userId: string }) => {
      console.log('User left:', userId)
      roomStore.removeParticipant(userId)
      this.removePeerConnection(userId)
    })
    
    // Participants list
    this.socket.on('participants', (participants: Participant[]) => {
      console.log('Received participants:', participants)
      roomStore.setParticipants(participants)
      
      // Create peer connections for existing participants
      participants.forEach(participant => {
        if (participant.id !== this.userId) {
          this.createPeerConnection(participant.id, false)
        }
      })
    })
    
    // WebRTC signaling
    this.socket.on('signal', ({ from, signal }: { from: string, signal: any }) => {
      const peer = this.peers.get(from)
      if (peer) {
        peer.peer.signal(signal)
      }
    })
    
    // Chat messages
    this.socket.on('new-message', (message: Message) => {
      roomStore.addMessage(message)
    })
    
    // User status changes
    this.socket.on('user-status-changed', ({ userId, isMuted, isVideoOff }: {
      userId: string
      isMuted: boolean
      isVideoOff: boolean
    }) => {
      roomStore.updateParticipant(userId, { isMuted, isVideoOff })
    })
    
    // Admin actions
    this.socket.on('force-mute', () => {
      this.toggleMute(true)
    })
    
    this.socket.on('force-disable-video', () => {
      this.toggleVideo(true)
    })
    
    this.socket.on('kicked-from-room', () => {
      roomStore.setError('You have been kicked from the room')
      this.disconnect()
    })
    
    this.socket.on('room-deleted', () => {
      roomStore.setError('The room has been deleted')
      this.disconnect()
    })
  }

  private createPeerConnection(userId: string, initiator: boolean): void {
    try {
      const webrtcStore = useWebRTCStore.getState()
      
      // Remove existing peer if any
      this.removePeerConnection(userId)
      
      const peer = new SimplePeer({
        initiator,
        trickle: false,
        stream: this.localStream || undefined,
      })
      
      const peerConnection: PeerConnection = {
        peer,
        userId,
      }
      
      // Handle signaling
      peer.on('signal', (signal) => {
        if (this.socket) {
          this.socket.emit('signal', { to: userId, signal })
        }
      })
      
      // Handle incoming stream
      peer.on('stream', (stream) => {
        console.log('Received stream from:', userId)
        peerConnection.stream = stream
        webrtcStore.setRemoteStream(userId, stream)
      })
      
      // Handle errors
      peer.on('error', (error) => {
        console.error('Peer error:', error)
        this.removePeerConnection(userId)
      })
      
      // Handle connection close
      peer.on('close', () => {
        console.log('Peer connection closed:', userId)
        this.removePeerConnection(userId)
      })
      
      this.peers.set(userId, peerConnection)
      
    } catch (error) {
      console.error('Failed to create peer connection:', error)
    }
  }

  private removePeerConnection(userId: string): void {
    const peerConnection = this.peers.get(userId)
    if (peerConnection) {
      try {
        peerConnection.peer.destroy()
      } catch (error) {
        console.error('Error destroying peer:', error)
      }
      this.peers.delete(userId)
      
      const webrtcStore = useWebRTCStore.getState()
      webrtcStore.removeRemoteStream(userId)
    }
  }

  // Public methods
  toggleMute(forceMute?: boolean): void {
    if (!this.localStream) return
    
    const webrtcStore = useWebRTCStore.getState()
    const newMutedState = forceMute !== undefined ? forceMute : !webrtcStore.isMuted
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !newMutedState
    })
    
    webrtcStore.setState({ isMuted: newMutedState })
    
    // Notify others
    if (this.socket) {
      this.socket.emit('user-status-change', {
        isMuted: newMutedState,
        isVideoOff: webrtcStore.isVideoOff
      })
    }
  }

  toggleVideo(forceVideoOff?: boolean): void {
    if (!this.localStream) return
    
    const webrtcStore = useWebRTCStore.getState()
    const newVideoOffState = forceVideoOff !== undefined ? forceVideoOff : !webrtcStore.isVideoOff
    
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = !newVideoOffState
    })
    
    webrtcStore.setState({ isVideoOff: newVideoOffState })
    
    // Notify others
    if (this.socket) {
      this.socket.emit('user-status-change', {
        isMuted: webrtcStore.isMuted,
        isVideoOff: newVideoOffState
      })
    }
  }

  toggleDeafen(): void {
    const webrtcStore = useWebRTCStore.getState()
    webrtcStore.toggleDeafen()
  }

  toggleChat(): void {
    const webrtcStore = useWebRTCStore.getState()
    const roomStore = useRoomStore.getState()
    
    webrtcStore.toggleChat()
    roomStore.toggleChat()
  }

  sendMessage(content: string): void {
    if (!this.socket || !content.trim()) return
    
    this.socket.emit('send-message', content)
  }

  // Admin actions
  muteParticipant(participantId: string): void {
    if (!this.socket) return
    
    this.socket.emit('admin-action', {
      targetUserId: participantId,
      action: 'mute'
    })
  }

  disableParticipantVideo(participantId: string): void {
    if (!this.socket) return
    
    this.socket.emit('admin-action', {
      targetUserId: participantId,
      action: 'disable-video'
    })
  }

  kickParticipant(participantId: string): void {
    if (!this.socket) return
    
    this.socket.emit('admin-action', {
      targetUserId: participantId,
      action: 'kick'
    })
  }

  disconnect(): void {
    console.log('Disconnecting WebRTC service')
    
    // Close all peer connections
    this.peers.forEach((peerConnection) => {
      try {
        peerConnection.peer.destroy()
      } catch (error) {
        console.error('Error destroying peer:', error)
      }
    })
    this.peers.clear()
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    // Reset stores
    const webrtcStore = useWebRTCStore.getState()
    const roomStore = useRoomStore.getState()
    
    webrtcStore.reset()
    roomStore.setConnectionState(false)
    
    this.isInitialized = false
  }

  getRemoteStream(participantId: string): MediaStream | null {
    const webrtcStore = useWebRTCStore.getState()
    return webrtcStore.remoteStreams.get(participantId) || null
  }

  isReady(): boolean {
    return this.isInitialized && this.socket?.connected === true
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService() 