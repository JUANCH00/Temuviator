import { MongoClient } from 'mongodb';
import { MONGO_CONFIG } from '../config/database.js';
import { DB_NAME } from '../config/constants.js';

class MongoDB {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            this.client = new MongoClient(MONGO_CONFIG.URI, MONGO_CONFIG.OPTIONS);
            await this.client.connect();
            this.db = this.client.db(DB_NAME);
            console.log(`✅ Conectado a MongoDB Cluster`);
            await this.initializeCollections();
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error);
            throw error;
        }
    }

    async initializeCollections() {
        const collections = await this.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('users')) {
            await this.db.createCollection('users');
            await this.db.collection('users').createIndex({ clientId: 1 }, { unique: true });
        }

        if (!collectionNames.includes('rounds')) {
            await this.db.createCollection('rounds');
            await this.db.collection('rounds').createIndex({ roundId: 1 }, { unique: true });
        }

        if (!collectionNames.includes('bets')) {
            await this.db.createCollection('bets');
            await this.db.collection('bets').createIndex({ roundId: 1, clientId: 1 });
        }

        if (!collectionNames.includes('transactions')) {
            await this.db.createCollection('transactions');
            await this.db.collection('transactions').createIndex({ clientId: 1, timestamp: -1 });
        }
    }

    getDB() {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db;
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 MongoDB desconectado');
        }
    }
}

export default new MongoDB();