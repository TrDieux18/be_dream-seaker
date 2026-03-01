import { getEnv } from "../utils/get-env";

export const Env = {
   NODE_ENV: getEnv('NODE_ENV', 'development'),
   PORT: parseInt(getEnv('PORT', '3000')),
   DATABASE_URL: getEnv('MONGO_URL'),
   JWT_SECRET: getEnv('JWT_SECRET'),
   JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
   FRONTEND_ORIGIN: getEnv('FRONTEND_ORIGIN', 'https://fe-dream-seeker-gehw.vercel.app,http://localhost:5173/'),

   CLOUDINARY_CLOUD_NAME: getEnv('CLOUDINARY_CLOUD_NAME'),
   CLOUDINARY_API_KEY: getEnv('CLOUDINARY_API_KEY'),
   CLOUDINARY_API_SECRET: getEnv('CLOUDINARY_API_SECRET'),
} as const;