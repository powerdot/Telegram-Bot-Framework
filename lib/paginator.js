let config = require('../config.js');
let fs = require("fs");
let path = require("path");

module.exports = function ({ db }) {
    return {
        list: function () {
            config.pages.path = config.pages.path[config.pages.path.length - 1] == '/' ? config.pages.path : (config.pages.path + "/");
            let normalizedPath = path.join(__dirname, '../src', config.pages.path);
            let csstts = [];
            fs.readdirSync(normalizedPath).forEach(function (file) {
                let page_path = normalizedPath + file;
                csstts.push({ module: require(page_path), path: page_path });
            });
            return csstts;
        }
    }
}

