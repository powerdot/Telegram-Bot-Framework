import type { WebServerArgs } from "../../../../lib/types";

module.exports = ({ bot, db }: WebServerArgs) => {
    let express = require("express");
    let router = express.Router();

    router.all("/", (req, res) => {
        return res.send("api hi!")
    });

    router.get("/stats", async (req, res) => {


        return res.send({});
    });

    return router;
}