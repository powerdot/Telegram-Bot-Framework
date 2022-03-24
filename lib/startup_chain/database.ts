import { MongoClient, Collection as MongoCollection } from 'mongodb/mongodb';
import { MongoDataBase } from '../types';

module.exports = function ({
    url,
    dbName
}) {
    return new Promise(async resolve => {
        const { MongoClient } = require('mongodb');

        let _url = url;
        let _database_name = dbName;

        try {
            let client: MongoClient = new MongoClient(_url);
            let collection_UserData: MongoCollection;
            let collection_BotMessageHistory: MongoCollection;
            let collection_UserMessageHistory: MongoCollection;
            let collection_Data: MongoCollection;
            let collection_Users: MongoCollection;
            let collection_specialCommandsHistory: MongoCollection;
            let collection_UserDataCollection: MongoCollection;

            console.log("ℹ️ ", `Database (${_database_name}) url: ${_url}`);

            await client.connect();
            collection_UserData = client.db(_database_name).collection("user_data");
            collection_BotMessageHistory = client.db(_database_name).collection("bot_message_history");
            collection_Data = client.db(_database_name).collection("other_data");
            collection_Users = client.db(_database_name).collection("users");
            collection_UserMessageHistory = client.db(_database_name).collection("user_message_history");
            collection_specialCommandsHistory = client.db(_database_name).collection("special_commands_history");
            collection_UserDataCollection = client.db(_database_name).collection("user_data_collection");
            resolve({
                client,
                collection_UserData,
                collection_BotMessageHistory,
                collection_UserMessageHistory,
                collection_Data,
                collection_Users,
                collection_specialCommandsHistory,
                collection_UserDataCollection,
            } as MongoDataBase);
            console.log("ℹ️ ", "Database connected");
        } catch (error) {
            console.error("💔 Error connecting to mongo:", error);
            process.exit(1);
        }
    })
}
