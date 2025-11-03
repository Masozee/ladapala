# Vercel Deployment Guide for Hotel Frontend

## Project Settings

When deploying this Next.js app to Vercel, configure the following settings:

### Framework Preset
- **Framework Preset**: Next.js

### Root Directory
- **Root Directory**: `hotel/frontend`

  ⚠️ **IMPORTANT**: This tells Vercel to use `hotel/frontend` as the root, not the repository root.

### Build & Development Settings
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Development Command**: `npm run dev` (default)

### Environment Variables
Add these in your Vercel project settings:

```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api
NEXT_PUBLIC_HOTEL_API_URL=https://your-backend-api.com/api/hotel
```

## Deployment Steps

1. **Import Project to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect it's a monorepo

2. **Configure Root Directory**
   - In "Configure Project" step
   - Set **Root Directory** to: `hotel/frontend`
   - Click "Continue"

3. **Set Environment Variables**
   - Add the environment variables listed above
   - Point them to your production backend API

4. **Deploy**
   - Click "Deploy"
   - Vercel will build from the `hotel/frontend` directory

## Troubleshooting

### Error: routes-manifest.json not found
- **Cause**: Root directory not set correctly
- **Solution**: In Project Settings → General → Root Directory, set to `hotel/frontend`

### Error: middleware.js.nft.json not found
- **Cause**: Next.js 16 file tracing issue
- **Solution**: Already fixed in next.config.ts (removed outputFileTracingRoot)

### Build fails with lockfile warnings
- **Cause**: Multiple lockfiles in monorepo
- **Solution**: Ignore the warning, build will still succeed

## Monorepo Structure

This project is part of a monorepo:
```
ladapala/
├── hotel/
│   ├── backend/     # Django API
│   └── frontend/    # Next.js (THIS APP)
└── resto/
    ├── backend/     # Django API
    └── frontend/    # Next.js
```

Only `hotel/frontend` should be deployed to this Vercel project.
