let config = require('../config.js');
let fs = require("fs");
let path = require("path");

module.exports = function ({ db }) {
    let _requirements_pages = {
        "home_place": "SELECT_HOMEPLACE",
        "phone": "INPUT_PHONE"
    }
    return {
        check_requirements: async (ctx, requirements, page_id) => {
            for (let requirement of requirements) {
                let r = await db.getValue(ctx, requirement);
                if (r === "") {
                    await db.setValue(ctx, 'next_step', _requirements_pages[requirement]);
                    await db.setValue(ctx, 'callback_step', page_id);
                    return false;
                }
            }
            return true;
        },
        clear_requirements_data: async (ctx) => {
            let keys = Object.keys(_requirements_pages);
            for (let key of keys) {
                await db.setValue(ctx, key, "");
                // if (key == 'home_place' && config.places.length == 1) await db.setValue(ctx, key, "0");
                // console.log("page","clear_requirements_data", key);
            }
        },
        list: function () {
            config.pages.path = config.pages.path[config.pages.path.length - 1] == '/' ? config.pages.path : (config.pages.path + "/");
            let normalizedPath = path.join(__dirname, '../src', config.pages.path);
            let csstts = [];
            fs.readdirSync(normalizedPath).forEach(function (file) {
                let page_path = normalizedPath + file;
                csstts.push({ module: require(page_path), path: page_path });
            });
            return csstts;
        },
        route: (page_id, to) => {
            return `${page_id}-${to}`;
        }
    }
}

