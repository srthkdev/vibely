# Video Chat Room

A modern video chat application that allows users to create and join topic-based video chat rooms. Built with Next.js, Agora RTC, and Clerk authentication.

## Features

### Implemented ✅
- User Authentication (Clerk)
  - Sign up and sign in functionality
  - Protected routes and API endpoints
- Room Management
  - Create new rooms with name, description, topics, and max users
  - Public and private room options
  - Room search functionality
  - Room settings management
- Video Chat
  - Real-time video and audio streaming using Agora RTC
  - Basic controls (mute, video toggle, deafen)
  - Chat functionality within rooms
- UI/UX
  - Modern neobrutalism design
  - Responsive layout
  - Dark mode support
  - Loading states and error handling

### In Progress 🚧
- Room Features
  - Room password protection
  - Room moderation tools
- Video Chat Enhancements
  - Better video grid layout
  - User avatars and status indicators
- Chat Improvements
  - Real-time message updates
  - File sharing
  - Emoji support
  - Message reactions

### Planned 📋
- User Profiles
  - Profile customization
  - User preferences
- Room Features
  - Room categories and tags
  - Room scheduling
  - Room templates
- Advanced Features
  - AI-powered room recommendations
  - Content moderation
  - Analytics dashboard

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Authentication**: Clerk
- **Video Chat**: WebRTC, socket.io
- **Database**: Prisma with PostgreSQL
- **Styling**: shadcn/ui components
- **State Management**: React hooks
- **API**: Next.js API routes
- **Package Manager**: Bun (for faster installation and build times)

## Prerequisites

- Bun installed
- PostgreSQL database
- Clerk account and API keys
- Agora account and API keys

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Agora
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id

# Database
DATABASE_URL=your_postgresql_database_url
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/video-chat-room.git
cd video-chat-room
```

2. Install dependencies using Bun:
```bash
bun install
```

3. Set up the database:
```bash
bunx prisma generate
bunx prisma db push
```

4. Start the development server:
```bash
bun dev
```

The application will be available at `http://localhost:3000`.

## Using Bun

This project is configured to use Bun as the package manager and runtime for improved performance:

- **Package Management**: `bun install` instead of `npm install`
- **Development**: `bun dev` instead of `npm run dev`
- **Building**: `bun build` instead of `npm run build`
- **Running Scripts**: `bunx` instead of `npx`

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── room/              # Room pages
│   └── rooms/             # Rooms listing and creation
├── components/            # React components
│   ├── ui/               # UI components
│   └── room-card.tsx     # Room card component
├── lib/                   # Utility functions
└── middleware.ts         # Next.js middleware
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
