"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1({ url, dbName }) {
    return new Promise(async (resolve) => {
        const { MongoClient } = require('mongodb');
        let _url = url || 'mongodb://localhost:27017';
        let _database_name = dbName;
        try {
            let client = new MongoClient(_url);
            let collection_UserData;
            let collection_BotMessageHistory;
            let collection_UserMessageHistory;
            let collection_Data;
            let collection_Users;
            let collection_specialCommandsHistory;
            let collection_UserDataCollection;
            let collection_TempData;
            let collection_SharedData;
            console.log("ℹ️ ", `Database (${_database_name}) url: ${_url}`);
            await client.connect();
            collection_UserData = client.db(_database_name).collection("user_data");
            collection_BotMessageHistory = client.db(_database_name).collection("bot_message_history");
            collection_Data = client.db(_database_name).collection("other_data");
            collection_Users = client.db(_database_name).collection("users");
            collection_UserMessageHistory = client.db(_database_name).collection("user_message_history");
            collection_specialCommandsHistory = client.db(_database_name).collection("special_commands_history");
            collection_UserDataCollection = client.db(_database_name).collection("user_data_collection");
            collection_TempData = client.db(_database_name).collection("temp_data");
            collection_SharedData = client.db(_database_name).collection("shared_data");
            resolve({
                driver: "mongodb",
                client,
                collection_UserData,
                collection_BotMessageHistory,
                collection_UserMessageHistory,
                collection_Data,
                collection_Users,
                collection_specialCommandsHistory,
                collection_UserDataCollection,
                collection_TempData,
                collection_SharedData
            });
            console.log("ℹ️ ", "Database connected");
        }
        catch (error) {
            console.error("💔 Error connecting to mongo:", error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=database.js.map