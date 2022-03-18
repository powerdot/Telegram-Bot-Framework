import { MongoClient, Collection as MongoCollection } from 'mongodb/mongodb';
import { MongoDataBase } from '../types';

module.exports = function () {
    return new Promise(async resolve => {
        const { MongoClient } = require('mongodb');

        let url = process.env.MONGO_URL;
        let database_name = process.env.MONGO_DB;

        let client: MongoClient = new MongoClient(url);
        let collection_UserData: MongoCollection;
        let collection_BotMessageHistory: MongoCollection;
        let collection_UserMessageHistory: MongoCollection;
        let collection_Data: MongoCollection;
        let collection_Users: MongoCollection;

        console.log("ℹ️ ", `Database (${database_name}) url: ${url}`);

        try {
            await client.connect();
            collection_UserData = client.db(database_name).collection("user_data");
            collection_BotMessageHistory = client.db(database_name).collection("bot_message_history");
            collection_Data = client.db(database_name).collection("other_data");
            collection_Users = client.db(database_name).collection("users");
            collection_UserMessageHistory = client.db(database_name).collection("user_message_history");
            resolve({
                client,
                collection_UserData,
                collection_BotMessageHistory,
                collection_UserMessageHistory,
                collection_Data,
                collection_Users
            } as MongoDataBase);
            console.log("ℹ️ ", "Database connected");
        } catch (error) {
            console.error("💔 Error connecting to mongo:", error);
            process.exit(1);
        }
    })
}
