module.exports = function () {
    return new Promise(async resolve => {
        const MongoClient = require("mongodb").MongoClient;

        let client;
        let collection_UserData;
        let collection_BotMessageHistory;
        let collection_UserMessageHistory;
        let collection_Data;
        let collection_Users;

        let url = process.env.MONGO_URL;
        let database_name = process.env.MONGO_DB;

        console.log("ℹ️ ", `Database (${database_name}) url: ${url}`);

        try {
            client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
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
            });
            console.log("ℹ️ ", "Database connected");
        } catch (error) {
            console.error("💔 Error connecting to mongo:", error);
            process.exit(1);
        }
    })
}
