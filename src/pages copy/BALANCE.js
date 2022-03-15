let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let helpers = require("../../lib/helpers");
let db = require("../../lib/helpers/db");
let config = require("../../config.js");
let page = require("../../lib/paginator");
let moment = require("moment");
let axios = require("axios").default;
const clearAndOpenMainMenu = require("../../lib/helpers/clearAndOpenMainMenu");


let page_config = {
    id: "BALANCE",
    name: "Счёт пользователя",
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
            await db.setValue(ctx, "step", page_config.id + "-" + callbackData.action);
        } else {
            throw ("route not found: " + callbackData.action);
        }
    } catch (error) {
        console.error("ERROR ON page ID:", page_config.id, error);
    }
}

async function handle_message(ctx) {
    if (ctx.updateSubTypes.length != 1 || ctx.updateSubTypes[0] != 'text') return;
    let step = await db.getValue(ctx, 'step');
    let id = step.split("-")[0];
    if (id != page_config.id) return;
    let route = step.split("-")[1];

    try {
        if (routes.text_routes[route]) {
            await routes.text_routes[route](ctx);
        } else {
            throw ("route not found: " + route);
        }
    } catch (error) {
        console.error("ERROR ON page ID:", page_config.id, error);
    }
}


let routes = {
    main: async (ctx) => {

    },
    create_payment: async (ctx) => {
        let text = 'Отлично, отправьте мне сумму, на которую будем пополнять...';
        if (ctx.CallbackPath.current.data == 'error') text = "❗️ Не похоже на сумму, попробуй еще раз!";
        await ctx.editMessageText(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⬅️ Вернуться", callback_data: "cancel" }]
                ]
            }
        });
    },
    success: async (ctx) => {
        let url = await db.getValue(ctx, page_config.id + "-payment_url");

        await ctx.editMessageText(`Супер, вот ссылка для оплаты:\n\n${url}\nПерейдите по ней.`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⬅️ В меню", callback_data: "cancel" }]
                ]
            }
        });
    },
    text_routes: {
        create_payment: async (ctx) => {
        }
    }
}

function route(id) {
    return `${page_config.id}-${id}`;
}