# Real-time Message Backend

Backend API for a real-time chat and social feed application.

## Overview

The backend provides:

- User authentication (JWT + cookie).
- 1-1 chat and group chat management, including reply, edit, and delete message actions.
- Social feed features (posts, comments, follow, notifications).
- Real-time updates with Socket.IO for messages and online status.
- Image upload and management with Cloudinary.

## Related Deployment

- Frontend deployed at: https://fe-dream-seeker-gehw.vercel.app

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Socket.IO
- Passport JWT
- Zod
- Cloudinary

## Folder Structure

```text
src/
  config/         # env, database, cloudinary, passport, HTTP constants
  controllers/    # request handlers
  services/       # business logic
  models/         # mongoose models
  routes/         # grouped routes by module
  validators/     # zod schemas
  middleware/     # async handler + error handler
  lib/            # socket setup
  scripts/        # migration/maintenance scripts
  utils/          # shared helpers
```

## Environment Requirements

- Node.js 18+
- npm 9+
- MongoDB instance
- Cloudinary account

## Setup and Run Locally

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file in the backend folder

```env
NODE_ENV=development
PORT=3001
MONGO_URL=mongodb://localhost:27017/realtime-message
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173,https://fe-dream-seeker-gehw.vercel.app

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Run in development mode

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

5. Start production server

```bash
npm start
```

## Scripts

- npm run dev: run server with nodemon
- npm run dev:debug: run nodemon with inspect mode
- npm run build: compile TypeScript to `dist`
- npm start: run `dist/index.js`

## API and Health Check

- Health check: GET /health
- Base API: /api
- Route groups:
- /api/auth
- /api/user
- /api/chat
- /api/post
- /api/comment
- /api/follow
- /api/notification

## Real-time Socket

Main real-time events include:

- New messages
- Message edits/deletes
- Group chat create/update/delete
- Online users synchronization

## Post Image Migration

If legacy post images are stored as base64 in MongoDB, use the migration script to move them to Cloudinary.

Dry run (no DB writes):

```bash
npm run migrate:post-images:dry
```

Run migration:

```bash
npm run migrate:post-images
```

Optional flags:

- --limit=50
- --postId=<mongo_object_id>

## Notes

- Make sure `FRONTEND_ORIGIN` is set correctly so CORS allows the frontend deploy domain.
- The API uses cookies (`withCredentials`), so frontend and backend CORS settings must match.
