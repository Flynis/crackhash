import 'dotenv/config';
import { MongoClient } from 'mongodb'

export default class DbController {
    mongoClient = new MongoClient(process.env.DB_CONN_STR);

    async fetchRequests() {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db("crackdb");
            const collection = db.collection("requests");

            const results = await collection.find().toArray();
            console.log(`Fetched ${results.length} requests`);

            return results;
        } catch(err) {
            console.log("Failed to fetch requests", err);
            return [];
        } finally {
            await this.mongoClient.close();
        }
    }

    async saveRequest(request) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db("crackdb");
            const collection = db.collection("requests");

            const result = await collection.insertOne(request);
            if (result.acknowledged) {
                console.log("Request saved");
            }
            
            return result.acknowledged;
        } catch(err) {
            console.log("Failed to save request", err);
            return false;
        } finally {
            await this.mongoClient.close();
        }
    }

    async updateRequest(req) {
        try {
            await this.mongoClient.connect();
            const db = this.mongoClient.db("crackdb");
            const collection = db.collection("requests");

            const ret = await collection.replaceOne({_id: req._id}, req);
            if (!ret.acknowledged) {
                throw ret;
            }
        } catch(err) {
            console.log("Failed to update request", err);
        } finally {
            await this.mongoClient.close();
        }
    }

};