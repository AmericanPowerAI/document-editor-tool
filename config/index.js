import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiUrl: process.env.API_BASE_URL,
    frontendUrl: process.env.FRONTEND_URL
  },
  security: {
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || []
    },
    rateLimit: {
      window: parseInt(process.env.RATE_LIMIT_WINDOW, 10) * 60 * 1000 || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
    },
    helmet: process.env.HELMET_ENABLED === 'true'
  },
  uploads: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE_MB, 10) * 1024 * 1024 || 10 * 1024 * 1024,
    directory: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    cleanup: process.env.CLEANUP_UPLOADS === 'true'
  },
  youtube: {
    userAgent: process.env.YTDL_USER_AGENT || 'Mozilla/5.0',
    timeout: parseInt(process.env.YTDL_TIMEOUT, 10) || 30000
  }
};

export default config;
