import type { WebServerArgs } from "../../../src/types";

module.exports = ({ bot, db, database, components }: WebServerArgs) => {
  let express = require("express");
  let router = express.Router();
  let path = require("path");

  router.use(express.json());
  router.use(express.urlencoded({
    extended: true
  }));

  router.use('/api', require('./api')({ bot, db, database, components } as WebServerArgs));

  router.use(express.static(path.resolve(__dirname, './public')));

  return router;
}

