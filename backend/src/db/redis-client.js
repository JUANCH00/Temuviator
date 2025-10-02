import Redis from 'ioredis';
import { REDIS_CONFIG } from '../config/redis.js';
import { GAME_CHANNEL } from '../config/constants.js';

class RedisClient {
    constructor() {
        this.client = null;
        this.subscriber = null;
        this.messageHandlers = [];
    }

    connect() {
        this.client = new Redis(REDIS_CONFIG);
        this.subscriber = new Redis(REDIS_CONFIG);
        console.log('Conectado a Redis');
    }

    async subscribe(handler) {
        this.messageHandlers.push(handler);

        await this.subscriber.subscribe(GAME_CHANNEL, (err) => {
            if (err) {
                console.error('Error suscribiéndose a Redis:', err);
            } else {
                console.log(`Suscrito al canal '${GAME_CHANNEL}'`);
            }
        });

        this.subscriber.on('message', (channel, message) => {
            const data = JSON.parse(message);
            this.messageHandlers.forEach(h => h(data));
        });
    }

    async publish(data) {
        await this.client.publish(GAME_CHANNEL, JSON.stringify(data));
    }

    async hset(key, field, value) {
        return await this.client.hset(key, field, value);
    }

    async hget(key, field) {
        return await this.client.hget(key, field);
    }

    async hgetall(key) {
        return await this.client.hgetall(key);
    }

    async hexists(key, field) {
        return await this.client.hexists(key, field);
    }

    async del(key) {
        return await this.client.del(key);
    }

    disconnect() {
        if (this.client) this.client.disconnect();
        if (this.subscriber) this.subscriber.disconnect();
        console.log('Redis desconectado');
    }
}

export default new RedisClient();