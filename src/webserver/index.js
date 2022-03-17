module.exports = ({ bot, db }) => {
  let express = require("express");
  let router = express.Router();
  let path = require("path");

  router.use(express.json());
  router.use(express.urlencoded({
    extended: true
  }));

  router.use('/api', require('./api')({ bot, db }));

  router.use(express.static(path.resolve(__dirname, './public')));

  return router;
}

