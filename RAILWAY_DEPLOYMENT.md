# Railway Deployment Guide

This guide will help you deploy your video chat application to Railway.

## 🚀 Quick Deploy

1. **Fork/Clone this repository**
2. **Connect to Railway**
3. **Set Environment Variables**
4. **Deploy**

## 📋 Prerequisites

- [Railway Account](https://railway.app/)
- [NeonDB Database](https://neon.tech/) (for PostgreSQL)
- [Clerk Account](https://clerk.com/) (for authentication)

## 🔧 Environment Variables

Set these environment variables in your Railway project:

### Required Variables

```env
# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key

# Database (NeonDB)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/your_database_name?sslmode=require"

# Application URL (Railway will provide this)
NEXT_PUBLIC_APP_URL="https://your-app-name.railway.app"

# Node Environment
NODE_ENV=production
```

### Optional Variables (for better WebRTC connectivity)

```env
# STUN/TURN servers for better WebRTC connectivity
NEXT_PUBLIC_STUN_SERVERS="stun:stun.l.google.com:19302"
NEXT_PUBLIC_TURN_SERVERS="turn:your-turn-server.com:3478"
NEXT_PUBLIC_TURN_USERNAME="your_turn_username"
NEXT_PUBLIC_TURN_CREDENTIAL="your_turn_credential"
```

## 🗄️ Database Setup

### 1. Create NeonDB Database

1. Go to [NeonDB Console](https://console.neon.tech/)
2. Create a new project
3. Create a new database
4. Copy the connection string
5. Add it to Railway environment variables as `DATABASE_URL`

### 2. Run Database Migrations

After deployment, Railway will automatically run:
- `prisma generate` (via postinstall script)
- Database schema will be pushed on first run

## 🔐 Clerk Setup

### 1. Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Get your production keys
4. Add them to Railway environment variables

### 2. Configure Clerk Settings

In your Clerk dashboard, add these URLs:
- **Home URL**: `https://your-app-name.railway.app`
- **Sign-in URL**: `https://your-app-name.railway.app/sign-in`
- **Sign-up URL**: `https://your-app-name.railway.app/sign-up`
- **After sign-in URL**: `https://your-app-name.railway.app`
- **After sign-up URL**: `https://your-app-name.railway.app`

## 🚀 Deployment Steps

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

1. In your Railway project, go to "Variables" tab
2. Add all the environment variables listed above
3. Make sure `NEXT_PUBLIC_APP_URL` matches your Railway deployment URL

### 3. Deploy

1. Railway will automatically build and deploy your application
2. The build process will:
   - Install dependencies
   - Run `prisma generate` (postinstall script)
   - Build the Next.js application
   - Start the combined server

### 4. Verify Deployment

1. Check the deployment logs for any errors
2. Visit your Railway URL
3. Test the health endpoint: `https://your-app-name.railway.app/api/health`

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your `DATABASE_URL` is correct
   - Ensure NeonDB is accessible from Railway
   - Check if the database exists

2. **Clerk Authentication Issues**
   - Verify your Clerk keys are production keys (not test keys)
   - Check that your Railway URL is added to Clerk's allowed origins

3. **Socket.IO Connection Issues**
   - Ensure `NEXT_PUBLIC_APP_URL` matches your Railway URL exactly
   - Check that the health endpoint returns socket connection info

4. **Build Failures**
   - Check Railway build logs
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

### Health Check

Your application includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "socketConnections": 0,
  "activeRooms": 0
}
```

## 📊 Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Deployments**: Automatic deployments on git push
- **Health Checks**: Automatic health monitoring

## 🔄 Updates

To update your application:
1. Push changes to your GitHub repository
2. Railway will automatically redeploy
3. Monitor the deployment logs for any issues

## 💰 Costs

Railway pricing:
- **Free Tier**: $5 credit monthly
- **Pro Plan**: Pay-as-you-go
- **Team Plan**: Shared billing

## 🆘 Support

If you encounter issues:
1. Check Railway logs
2. Verify environment variables
3. Test locally with the same configuration
4. Check the [Known Issues](#-known-issues--status) section in README.md

---

Your video chat application is now ready for production deployment on Railway! 🎉 