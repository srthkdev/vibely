# Vibely Video Chat Application

A real-time video chat application built with Next.js, WebRTC (via MediaSoup), and Socket.io that allows users to create and join rooms, communicate via video/audio, and chat in real-time.

## Features

- **User Authentication**: Secure user authentication using Clerk
- **Video & Audio Streaming**: Real-time video and audio communication
- **Text Chat**: In-room text messaging
- **Room Management**: Create and join public or private rooms
- **Room Administration**: Room owners have special privileges (muting participants, disabling video, kicking users)
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL database (for Prisma)

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/video-chat-app.git
cd video-chat-app
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/video_chat?schema=public"

# Socket
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# MediaSoup
MEDIASOUP_MIN_PORT=10000
MEDIASOUP_MAX_PORT=10100
MEDIASOUP_ANNOUNCED_IP=localhost
```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your database
npx prisma db push

# Optional: Seed the database with initial data
npx prisma db seed
```

5. **Start the development server**

```bash
npm run dev
# or
yarn dev
```

The application should now be running at `http://localhost:3000`.

## Environment Variables Explained

- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Your Clerk public key (from the Clerk dashboard)
- **CLERK_SECRET_KEY**: Your Clerk secret key (from the Clerk dashboard)
- **DATABASE_URL**: Connection string for your PostgreSQL database
- **NEXT_PUBLIC_SOCKET_URL**: URL for the Socket.io server
- **MEDIASOUP_MIN_PORT**: Minimum port for MediaSoup WebRTC connections
- **MEDIASOUP_MAX_PORT**: Maximum port for MediaSoup WebRTC connections
- **MEDIASOUP_ANNOUNCED_IP**: Your server's public IP address for WebRTC connections

## Production Deployment

For production deployment, you'll need to:

1. Set up a production database
2. Configure proper CORS settings for Socket.io
3. Use a proper public IP address for MediaSoup (not localhost)
4. Set up TURN/STUN servers for NAT traversal in WebRTC
5. Deploy both the Next.js application and Socket.io server

Example production environment variables:

```env
# Production environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL="postgresql://username:password@production-db-host:5432/video_chat?schema=public"
NEXT_PUBLIC_SOCKET_URL="https://your-socket-server.com"
MEDIASOUP_MIN_PORT=10000
MEDIASOUP_MAX_PORT=10100
MEDIASOUP_ANNOUNCED_IP=your.server.ip.address
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
NEXT_PUBLIC_TURN_SERVERS=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=your_turn_username
NEXT_PUBLIC_TURN_CREDENTIAL=your_turn_credential
```

## WebRTC Implementation

This application uses WebRTC with `simple-peer` for real-time video, audio, and data communication. We've implemented a custom WebRTC client that handles:

- Peer-to-peer connections between participants
- Video and audio streaming
- Real-time chat
- Room management
- Admin controls (mute, disable video, kick participants)

The WebRTC implementation provides several advantages over the previous MediaSoup approach:

1. Simplified architecture with direct peer-to-peer connections
2. Reduced server load as media doesn't need to be routed through the server
3. Lower latency for real-time communications
4. Better performance on mobile devices
5. More robust connection management

### Key Features

- **Video and Audio Streaming**: Users can share their camera and microphone with other participants
- **Real-time Chat**: Text chat with all participants in the room
- **Room Management**: Create, join, and leave rooms
- **Admin Controls**: Room admins can mute, disable video, or kick other participants
- **Dynamic UI**: Video grid layout adjusts based on the number of participants
- **User Status**: See when users are muted or have video disabled

## Usage

1. **Authentication**: Sign up or sign in using the authentication form
2. **Browse Rooms**: View available public rooms on the home page
3. **Create a Room**: Click the "Create Room" button to create a new room
4. **Join a Room**: Click on a room card to join an existing room
5. **In-Room Controls**:
   - Toggle microphone mute/unmute
   - Toggle camera on/off
   - Toggle deafen (mute all other participants)
   - Open/close chat panel
   - Leave room

## License

This project is licensed under the MIT License - see the LICENSE file for details.
