import mongoDB from '../db/mongodb.js';
import { DEFAULT_BALANCE } from '../config/constants.js';

class UserService {
    async registerOrUpdateUser(clientId) {
        const db = mongoDB.getDB();

        await db.collection('users').updateOne(
            { clientId },
            {
                $set: { lastConnection: new Date() },
                $setOnInsert: {
                    clientId,
                    balance: DEFAULT_BALANCE,
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );

        return await db.collection('users').findOne({ clientId });
    }

    async getUser(clientId) {
        const db = mongoDB.getDB();
        return await db.collection('users').findOne({ clientId });
    }

    async updateBalance(clientId, amount) {
        const db = mongoDB.getDB();
        await db.collection('users').updateOne(
            { clientId },
            { $inc: { balance: amount } }
        );
    }

    async getBalance(clientId) {
        const user = await this.getUser(clientId);
        return user ? user.balance : 0;
    }
}

export default new UserService();