Real-Time Video Chat Room Application
=====================================

Project Overview
----------------

Create a modern, neobrutalism-styled real-time video chat application where users can discover, join, and create topic-based video chat rooms. The application should feature user authentication, public/private rooms, semantic search functionality, and real-time video/audio communication.

Key Features
------------

### Authentication & User Management

*   Landing page with sign up and sign in options
    
*   Clerk for authentication and user management
    
*   Custom username option during registration
    
*   Session management and authentication state
    

### Chat Room Discovery

*   Search bar for finding public chat rooms by topics
    
*   Semantic search that analyzes chat content to suggest relevant rooms
    
*   Scrollable feed of available public rooms with preview information
    
*   Trending topics section
    

### Chat Room Creation & Management

*   "Create Room" button/modal with options for:
    
    *   Room name and description
        
    *   Public/private visibility toggle
        
    *   Maximum user limit
        
    *   Topic tags for discoverability
        
    *   Optional password protection
        
*   Shareable invite links for private rooms
    
*   Admin controls (kick, mute, ban users)
    
*   Room moderation tools
    

### Video Chat Functionality

*   Real-time video and audio streaming using Agora SDK
    
*   User grid layout with dynamic resizing based on participant count
    
*   Audio/video controls (mute, deafen, video on/off)
    
*   Disconnection handling and reconnection attempts
    

### Text Chat Integration

*   Floating/collapsible text chat window alongside video
    
*   Rich text formatting options
    
*   Emoji and reaction support
    
*   Link preview functionality
    
*   File sharing capabilities
    
*   Message history persistence
    

### UI/UX

*   Neobrutalism design style (https://www.neobrutalism.dev/showcase)
    
*   Responsive design for mobile, tablet, and desktop
    
*   Accessibility features (keyboard navigation, screen reader support)
    
*   Dark/light theme support
    
*   Animated transitions and microinteractions
    

Tech Stack
----------

### Frontend

*   Next.js 14+ (App Router)
    
*   TypeScript
    
*   TailwindCSS
    
*   shadcn/ui components
    
*   Framer Motion for animations
    
*   Vercel for hosting
    

### Backend

*   Next.js API routes with Edge Runtime
    
*   WebSockets (Socket.io)
    
*   Agora SDK for WebRTC video streaming
    
*   Upstash Redis for real-time features
    
*   Prisma ORM
    
*   Supabase PostgreSQL database
    

### Authentication

*   Clerk for authentication and user management
    
*   Custom username configuration
    

### Search & Recommendations

*   Weaviate vector database for semantic search
    
*   OpenAI embeddings API for vector generation
    
*   Redis for caching search results
    

### Infrastructure

*   Vercel for deployment
    
*   Upstash for Redis (serverless)
    
*   Supabase for PostgreSQL

*   Bun for installation
    

Implementation Instructions
---------------------------

1.  Set up a Next.js 14+ project with TypeScript, TailwindCSS, and shadcn/ui
    
2.  Implement the neobrutalism design system with custom colors and components
    
3.  Set up authentication using Clerk with username customization
    
4.  Create the database schema with Prisma for users, rooms, and messages using Supabase PostgreSQL
    
5.  Set up Weaviate for semantic search capabilities
    
6.  Implement the WebSocket server for real-time chat capabilities
    
7.  Integrate Agora SDK for video streaming functionality
    
8.  Build the search functionality with vector embeddings for semantic search
    
9.  Create the room management system with admin controls
    
10.  Implement responsive UI with Framer Motion animations
    
11.  Add real-time notifications for room events
    
12.  Optimize for performance and implement error handling
    

Additional Requirements
-----------------------

*   Implement proper error handling and loading states
    
*   Ensure accessibility (WCAG 2.1 AA compliance)
    
*   Add comprehensive logging
    
*   Implement rate limiting and abuse prevention
    
*   Ensure data privacy compliance (GDPR, CCPA)