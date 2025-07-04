# Vibely Video Chat Application

A real-time video chat application built with Next.js, WebRTC (via simple-peer), and Socket.io that allows users to create and join rooms, communicate via video/audio, and chat in real-time.

## 🌟 Features

- **User Authentication**: Secure user authentication using Clerk
- **Video & Audio Streaming**: Real-time video and audio communication using WebRTC
- **Text Chat**: In-room text messaging with real-time synchronization
- **Room Management**: Create and join public or private rooms with password protection
- **Room Administration**: Room owners have special privileges (muting participants, disabling video, kicking users)
- **Responsive Design**: Beautiful neobrutalist design that works on desktop and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes
- **Dynamic Video Grid**: Adaptive layout that adjusts to participant count
- **Admin Controls**: Comprehensive moderation tools for room owners

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with hooks
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework with neobrutalist design
- **Clerk** - Authentication and user management
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations and transitions
- **Socket.IO Client** - Real-time communication

### Backend
- **Express.js** - Node.js web framework
- **Socket.IO** - Real-time bidirectional communication
- **Prisma ORM** - Database toolkit and ORM
- **NeonDB** - Serverless PostgreSQL database
- **simple-peer** - WebRTC peer-to-peer connections

## 📋 Prerequisites

- Node.js (v18 or later)
- npm, yarn, or bun
- NeonDB account and database
- Clerk account for authentication

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/video-chat-app.git
cd video-chat-app
```

2. **Install dependencies**

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using bun (recommended)
bun install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# NeonDB Database (replace with your NeonDB connection string)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/your_database_name?sslmode=require"

# Socket.IO Server
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# Application URL (for production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your NeonDB database
npx prisma db push

# Optional: View your database in Prisma Studio
npx prisma studio
```

5. **Start the development servers**

```bash
# This starts both Next.js and Socket.IO server concurrently
npm run dev
# or
yarn dev
# or
bun dev
```

The application will be running at:
- **Frontend**: `http://localhost:3000`
- **Socket.IO Server**: `http://localhost:3001`

## 🗄️ Database Setup (NeonDB)

### Creating a NeonDB Database

1. Go to [NeonDB Console](https://console.neon.tech/)
2. Create a new project
3. Create a new database
4. Copy the connection string and add it to your `.env.local` file
5. The connection string format is:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/database_name?sslmode=require
   ```

### Database Schema

The application uses the following main models:
- **User**: Stores user information from Clerk
- **Room**: Video chat rooms with settings and metadata
- **RoomParticipant**: Tracks active participants in rooms
- **Message**: Chat messages within rooms

## 🎮 Usage

### For Regular Users

1. **Sign Up/Sign In**: Use the authentication system to create an account
2. **Browse Rooms**: View available public rooms on the home page
3. **Create a Room**: Click "Create Room" to start your own video chat room
4. **Join a Room**: Click on any room card to join an existing room
5. **In-Room Controls**:
   - 🎤 Toggle microphone mute/unmute
   - 📹 Toggle camera on/off
   - 🔇 Toggle deafen (mute all other participants)
   - 💬 Open/close chat panel
   - 🚪 Leave room

### For Room Administrators

Room owners have additional controls:
- **Mute Participants**: Force mute other users
- **Disable Video**: Turn off participant cameras
- **Kick Participants**: Remove users from the room
- **Delete Room**: Permanently delete the room
- **Edit Room Settings**: Modify room properties

## ⚠️ Known Issues & Status

### Current Issues

1. **WebRTC Connection Reliability** (Critical)
   - Peer-to-peer connections may fail intermittently
   - Video/audio streams sometimes don't establish properly
   - Working on implementing more robust WebRTC signaling

2. **Real-time Chat Synchronization** (Moderate)
   - Message delivery can be inconsistent
   - Chat state management needs improvement

3. **Admin Control Consistency** (Minor)
   - Some admin actions may need multiple attempts
   - Error feedback could be more descriptive

### Development Status

- ✅ **Authentication**: Fully functional
- ✅ **Room Management**: Working well
- ✅ **UI/UX**: Complete and responsive
- ⚠️ **WebRTC Video/Audio**: Under improvement
- ⚠️ **Real-time Chat**: Being optimized
- ✅ **Database Operations**: Stable

## 🌐 Production Deployment

For production deployment:

### Environment Variables for Production

```env
# Production Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxx
CLERK_SECRET_KEY=sk_live_xxxx

# Production NeonDB
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/prod_database?sslmode=require"

# Production URLs
NEXT_PUBLIC_SOCKET_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Optional: STUN/TURN servers for better WebRTC connectivity
NEXT_PUBLIC_STUN_SERVERS="stun:stun.l.google.com:19302"
NEXT_PUBLIC_TURN_SERVERS="turn:your-turn-server.com:3478"
NEXT_PUBLIC_TURN_USERNAME="your_turn_username"
NEXT_PUBLIC_TURN_CREDENTIAL="your_turn_credential"
```

### Deployment Steps

1. **Database**: Ensure your NeonDB is set up and accessible
2. **Environment**: Configure all production environment variables
3. **Build**: Run `npm run build` to create production build
4. **Deploy**: Deploy to your preferred platform (Vercel, Netlify, etc.)
5. **Socket.IO Server**: Deploy the Socket.IO server separately or use a service

### Recommended Platforms

- **Frontend**: Vercel, Netlify, or Railway
- **Socket.IO Server**: Railway, Render, or DigitalOcean
- **Database**: NeonDB (already serverless)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Development

### Project Structure

```
video-chat-app/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   └── types/           # TypeScript type definitions
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── server.js            # Socket.IO server
```

### Key Files

- `src/components/room.tsx` - Main video chat room component
- `src/lib/webrtc.ts` - WebRTC client implementation
- `src/hooks/use-webrtc.ts` - WebRTC React hook
- `server.js` - Socket.IO server for real-time communication
- `prisma/schema.prisma` - Database schema

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Known Issues](#-known-issues--status) section
2. Look through existing GitHub issues
3. Create a new issue with detailed information about the problem

---

Built with ❤️ by [Sarthak Jain](https://github.com/23f3000839)
