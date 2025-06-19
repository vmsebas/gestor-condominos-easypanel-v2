# 🚀 Gestor Condominos - EasyPanel Deployment Guide

This repository is pre-configured for EasyPanel deployment with Docker support.

## 📋 Prerequisites

- EasyPanel account
- Neon PostgreSQL database (or any PostgreSQL with SSL)
- GitHub account (for repository deployment)

## 🛠️ Quick Deploy Steps

### 1. Fork/Clone this Repository

```bash
git clone https://github.com/YOUR_USERNAME/gestor-condominos-easypanel.git
```

### 2. Configure Environment Variables in EasyPanel

Create these environment variables in your EasyPanel app settings:

```env
# Required
DATABASE_URL=postgresql://user:pass@host/database?sslmode=require
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=production
PORT=3002

# Optional
VITE_API_URL=https://your-domain.com
VITE_APP_URL=https://your-domain.com
```

### 3. Deploy in EasyPanel

1. **Create New App** in EasyPanel
2. **Connect GitHub Repository**
3. **Configure:**
   - Port: `3002`
   - Health Check Path: `/api/health`
   - Build Command: (auto-detected from Dockerfile)
   - Start Command: (auto-detected from Dockerfile)

4. **Add Volume** (for file uploads):
   - Mount Path: `/app/uploads`
   - Size: 5GB (or as needed)

5. **Deploy!**

## 🔍 Verify Deployment

1. Check health endpoint: `https://your-domain.com/api/health`
2. Access the app: `https://your-domain.com`
3. Check logs in EasyPanel for any issues

## 📁 Project Structure

```
.
├── Dockerfile          # Multi-stage build configuration
├── docker-compose.yml  # Local development setup
├── server/            # Backend (Express + PostgreSQL)
│   └── production-server.cjs  # Production server with static file serving
├── src/               # Frontend (React + TypeScript)
└── dist/              # Built frontend (created during Docker build)
```

## 🔧 Features

- **Full-stack TypeScript** application
- **PostgreSQL** database with Neon
- **Docker** optimized build
- **Health checks** for monitoring
- **Static file serving** in production
- **File upload** support with persistent volumes

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` includes `?sslmode=require`
- Check Neon dashboard for connection limits
- Verify database credentials

### Build Failures
- Check Node.js version compatibility (18.x required)
- Ensure all dependencies are in package.json
- Review EasyPanel build logs

### Runtime Errors
- Check environment variables are set correctly
- Verify port 3002 is exposed
- Review application logs in EasyPanel

## 📞 Support

For issues specific to:
- **This app**: Create an issue in this repository
- **EasyPanel**: Check their documentation at easypanel.io
- **Neon DB**: Visit neon.tech/docs

## 🔄 Updates

To update your deployment:

1. Push changes to your GitHub repository
2. EasyPanel will auto-deploy (if configured)
3. Or manually trigger deployment in EasyPanel dashboard

---

**Ready to deploy!** 🎉 This repository is fully configured for EasyPanel.