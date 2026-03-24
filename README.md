# Real-time Message Backend

Backend API cho he thong chat + social feed theo thoi gian thuc.

## Tong quan

Backend cung cap:

- Xac thuc nguoi dung (JWT + cookie).
- Quan ly chat 1-1, group chat, tin nhan, reply, edit/delete message.
- Social feed (post, comment, follow, notification).
- Realtime voi Socket.IO cho message va trang thai online.
- Upload/quan ly anh qua Cloudinary.

## Deploy lien quan

- Frontend da deploy: https://fe-dream-seeker-gehw.vercel.app

## Cong nghe su dung

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Socket.IO
- Passport JWT
- Zod
- Cloudinary

## Cau truc thu muc

```text
src/
	config/         # env, database, cloudinary, passport, http constants
	controllers/    # nhan request va tra response
	services/       # business logic
	models/         # mongoose models
	routes/         # route grouping theo module
	validators/     # zod schemas
	middleware/     # async handler + error handler
	lib/            # socket setup
	scripts/        # script migration/maintenance
	utils/          # helper chung
```

## Yeu cau moi truong

- Node.js 18+
- npm 9+
- MongoDB instance
- Tai khoan Cloudinary

## Cai dat va chay local

1. Cai dependency

```bash
npm install
```

2. Tao file .env trong thu muc backend

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

3. Chay development

```bash
npm run dev
```

4. Build production

```bash
npm run build
```

5. Chay production

```bash
npm start
```

## Scripts

- npm run dev: chay server voi nodemon
- npm run dev:debug: chay nodemon kem inspect
- npm run build: compile TypeScript ra dist
- npm start: chay dist/index.js

## API va health check

- Health check: GET /health
- Base API: /api
- Nhom route:
  - /api/auth
  - /api/user
  - /api/chat
  - /api/post
  - /api/comment
  - /api/follow
  - /api/notification

## Socket realtime

Su kien realtime chinh:

- Tin nhan moi
- Chinh sua/xoa tin nhan
- Tao/cap nhat/xoa group chat
- Dong bo danh sach nguoi dung online

## Migration anh bai viet

Neu du lieu cu luu anh post dang base64 trong MongoDB, dung script migration sang Cloudinary.

Dry run (khong ghi DB):

```bash
npm run migrate:post-images:dry
```

Thuc thi migration:

```bash
npm run migrate:post-images
```

Co the truyen them:

- --limit=50
- --postId=<mongo_object_id>

## Ghi chu

- Nho set dung FRONTEND_ORIGIN de CORS cho phep domain deploy frontend.
- API dang su dung cookie (withCredentials), can cau hinh dong bo voi frontend.
