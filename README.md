# Video Chat Room Application

A real-time video chat application built with Next.js, Mediasoup, and Socket.IO. The application features a modern UI with a retro-inspired design, supporting multiple participants in video rooms with chat functionality.

## Features

- Real-time video and audio communication
- Text chat with message history
- Room creation with customizable settings
- User authentication via Clerk
- Admin controls for room management
- Participant management (mute, video toggle, kick)
- Dark mode support
- Modern UI with retro-inspired design

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Node.js, Socket.IO
- **WebRTC**: Mediasoup
- **Authentication**: Clerk
- **Package Manager**: Bun
- **Database**: Prisma with your preferred database
- **UI Components**: Custom components with shadcn/ui

## Prerequisites

- [Bun](https://bun.sh) (v1.2.5 or higher)
- Node.js (v18 or higher)
- A Clerk account for authentication
- A database supported by Prisma

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd video-chat-app
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# Database
DATABASE_URL=your_database_url

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
SOCKET_SERVER_PORT=3001
```

4. Set up the database:
```bash
bunx prisma generate
bunx prisma db push
```

## Development

Run the development server:
```bash
bun run dev
```

This will start both the Next.js frontend (port 3000) and Socket.IO server (port 3001).

## Building for Production

```bash
bun run build
```

## Deployment

1. Build the application
2. Set up environment variables on your hosting platform
3. Deploy the frontend and backend servers
4. Configure your hosting platform to run both servers

## Project Structure

- `/src/app` - Next.js pages and API routes
- `/src/components` - React components
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utility functions and configurations
- `/src/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details
