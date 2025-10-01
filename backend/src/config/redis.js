import dotenv from 'dotenv';
dotenv.config();

export const REDIS_CONFIG = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retryStrategy: (times) => Math.min(times * 50, 2000)
};