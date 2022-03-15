let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let helpers = require("../../lib/helpers");
let db = require("../../lib/helpers/db");
let config = require("../../config.js");
let page = require("../../lib/paginator");

let page_config = {
    id: "EXAMPLE",
    name: "Пример",
    requirements: []
}

async function trigger(ctx) {
    if (ctx.updateType == 'callback_query') await handle_callback_query(ctx);
    if (ctx.updateType == 'message') await handle_message(ctx);
}

module.exports = { page_config, call: trigger }

async function handle_callback_query(ctx) {
    let callbackData = ctx.CallbackPath.current;
    if (callbackData.route != page_config.id) return false;

    let perms = await page.check_requirements(ctx, page_config.requirements, page_config.id);
    if (!perms) return;

    try {
        if (!callbackData.action) callbackData.action = "main";
        if (routes[callbackData.action]) {
            await routes[callbackData.action](ctx);
        } else {
            throw ("route not found: " + callbackData.action);
        }
    } catch (error) {
        console.error("ERROR ON page ID:", page_config.id, error);
    }
}

async function handle_message(ctx) {

}


let routes = {
    main: async (ctx) => {
        // straight page route code here

    }
}