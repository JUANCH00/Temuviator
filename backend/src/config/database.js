import dotenv from 'dotenv';
dotenv.config();

export const MONGO_CONFIG = {
    URI: process.env.MONGO_URI,
    OPTIONS: {
        readPreference: 'primaryPreferred',
        w: 'majority',
        wtimeoutMS: 5000
    }
};