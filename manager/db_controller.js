import 'dotenv/config';
import { MongoClient } from 'mongodb';

export default class DbController {

    async init() {
        this.client = new MongoClient(`${process.env.DB_CONN_STR}`, {
            w: "majority",
        });
        try {
            await this.client.connect();
            this.db = this.client.db("crackdb");
            console.log("Db controller initialized");
        } catch(err) {
            console.log("Failed to init db cnotroller");
        }
    }

    async fetchRequests() {
        try {
            const collection = this.db.collection("requests");

            const results = await collection.find({}).toArray();
            console.log(`Fetched ${results.length} requests`);

            return results;
        } catch(err) {
            console.log("Failed to fetch requests", err);
            return [];
        }
    }

    async saveRequest(request) {
        try {
            const collection = this.db.collection("requests");

            const result = await collection.insertOne(request);
            if (result.acknowledged) {
                console.log("Request saved");
            }
            
            return result.acknowledged;
        } catch(err) {
            console.log("Failed to save request", err);
            return false;
        }
    }

    async fetchState() {
        try {
            const collection = this.db.collection("state");

            const state = await collection.findOne({});
            console.log(`Fetched state`);

            return state;
        } catch(err) {
            console.log("Failed to fetch state", err);
            return [];
        }
    }

    async updateState(state) {
        try {
            const collection = this.db.collection("state");

            const ret = await collection.replaceOne({_id: 0}, state, {upsert: true});
            if (ret.acknowledged) {
                console.log("State updated");
            } else {
                throw ret;
            }

        } catch(err) {
            console.log("Failed to update state", err);
        }
    }

    async updateRequestAndState(req, state) {
        const requests = this.db.collection("requests");
        const stateCollection = this.db.collection("state");
        const session = this.client.startSession();

        try {
            const transactionResult = await session.withTransaction(async () => {
                const ret = await requests.replaceOne({_id: req._id}, req);
                if (!ret.acknowledged) {
                    throw ret;
                }
                const ret1 = await stateCollection.replaceOne({_id: 0}, state);
                if (!ret1.acknowledged) {
                    throw ret1;
                }
            });
            if (transactionResult) {
                console.log("State and request updated");
            }
        } catch(err) {
            console.log("Failed to update request", err);
        } finally {
            await session.endSession();
        }
    }

    async deleteRequests(ids) {
        try {
            const collection = this.db.collection("requests");

            const ret = await collection.deleteMany({_id: {$in: ids}});
            if (!ret.acknowledged) {
                throw ret;
            }

        } catch(err) {
            console.log("Failed to delete requests", err);
        }
    }

};