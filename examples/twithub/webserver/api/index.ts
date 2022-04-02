import type { WebServerArgs } from "../../../../src/types";

module.exports = ({ bot, database }: WebServerArgs) => {
    let express = require("express");
    let router = express.Router();

    router.get("/posts", async (req, res) => {
        let chatId = req.query.chatId;

        if (!chatId) { // all posts
            let posts = await database.collection_UserDataCollection.find({
                type: "post"
            }).sort({
                _id: -1
            }).limit(100).toArray();
            return res.send(posts);
        }

        // posts of user
        let posts = await database.collection_UserDataCollection.find({
            type: "post",
            chatId: Number(chatId)
        }).sort({
            _id: -1
        }).limit(5).toArray();
        return res.send(posts)
    });

    return router;
}