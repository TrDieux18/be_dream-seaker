# Real-time Message Backend

Backend API cho ứng dụng nhắn tin thời gian thực.

## Tech Stack

- **Node.js** + **Express.js** - RESTful API
- **TypeScript** - Type safety
- **MongoDB** + **Mongoose** - Database & ODM
- **Socket.io** - Real-time communication
- **Cloudinary** - Image storage & optimization
- **Passport.js** + **JWT** - Authentication
- **Zod** - Request validation

## Core Features

### Authentication

- User registration & login
- JWT-based authentication
- Session management with cookies

### Chat Management

- Create 1-on-1 & group chats
- Real-time message delivery
- Message history retrieval
- Group settings (name, image)
- Chat deletion

### Message Features

- Send text & image messages
- Reply to messages
- Edit messages (text only)
- Delete messages
- Clear chat history

### Real-time Updates

- New message notifications
- Online/offline status
- Group updates sync
- Message edit/delete sync

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── services/       # Business logic
├── models/         # Database schemas
├── routes/         # API routes
├── middleware/     # Custom middleware
├── validators/     # Zod schemas
├── lib/           # Socket.io setup
└── utils/         # Helper functions
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`

3. Start development server:

```bash
npm run dev
```

## API Endpoints

- `/api/auth/*` - Authentication routes
- `/api/user/*` - User management
- `/api/chat/*` - Chat & message operations
- `/api/post/*` - Social feed features
- `/api/comment/*` - Comment system

## Socket Events

- `chat:new` - New chat created
- `message:new` - New message received
- `message:edited` - Message updated
- `message:deleted` - Message removed
- `chat:group-updated` - Group settings changed
- `chat:deleted` - Chat removed
- `online:users` - Online users list
# be_dream-seaker
