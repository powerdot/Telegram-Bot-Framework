let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let helpers = require("../../lib/helpers");
let db = require("../../lib/helpers/db");
const Telegraf = require('telegraf');
let page = require("../../lib/paginator");
let config = require("../../config");
let clear = require("../../lib/helpers/clearAndOpenMainMenu");
let users = require("../../lib/helpers/users");

let page_config = {
    id: "send_messages",
    name: "Сообщения админам",
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
    ctx.text_route = route;

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
        await db.setValue(ctx, route('selected_one'), "");

        await ctx.editMessageText('Кому отправляем сообщение?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Конкретному админу 🕺', callback_data: route("selected_one") }],
                    [{ text: 'Всем админам 💃', callback_data: route("input_text") }],
                    [{ text: '⬅️ Вернуться обратно', callback_data: 'cancel' }],
                ]
            }
        });
    },
    selected_one: async (ctx) => {
        let text = 'Отправь мне id админа, которому отправить сообщение)';
        if (ctx.CallbackPath.current.data == 'error') text += "\n❗️ Не похоже на id...";

        await ctx.editMessageText(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⬅️ Отмена', callback_data: 'cancel' }],
                ]
            }
        });
    },
    input_text: async (ctx) => {
        await ctx.editMessageText('Отправь мней текст:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⬅️ Отмена', callback_data: 'cancel' }],
                ]
            }
        });
    },
    confirm: async (ctx) => {
        let selected_admin = await db.getValue(ctx, route("selected_one"));
        let text = await db.getValue(ctx, route("input_text"));
        let admins = selected_admin == "" ? "Всем админам" : `Одному админу ${selected_admin}`
        await ctx.editMessageText(`И так, шлем сообщения:\n\n${admins}\n${text}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🤟 Отправляй!', callback_data: route('confirm_yes') }],
                    [{ text: '⬅️ Отмена', callback_data: 'cancel' }],
                ]
            }
        });
    },
    confirm_yes: async (ctx) => {
        let selected_admin = await db.getValue(ctx, route("selected_one"));
        let text = await db.getValue(ctx, route("input_text"));

        let send_to = [];

        if (selected_admin == "") {
            //all
            let all_admins = await users.getAllAdmins();
            let admins_without_me = all_admins.filter(x => x != helpers.getChatId(ctx));
            send_to = admins_without_me;
        } else {
            //one
            send_to = [parseInt(selected_admin)];
        }

        console.log(" -- >> -- >> отправляю:", send_to);

        for (let a of send_to) {
            await clear(a, text);
        }

        await clear(ctx, "Сообщение отправлено 😉");
    },
    text_routes: {
        selected_one: async (ctx) => {
            let num = ctx.update.message.text;
            if (num != parseInt(num)) {
                await db.setValue(ctx, 'next_step', route(ctx.text_route, 'error'));
                await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                await db.messages.removeMessages(ctx, true);
                return;
            }
            await db.setValue(ctx, route('selected_one'), num);
            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
            await db.setValue(ctx, 'next_step', route("input_text"))
        },
        input_text: async (ctx) => {
            let text = ctx.update.message.text;
            await db.setValue(ctx, 'next_step', route('confirm'));
            await db.setValue(ctx, route("input_text"), text);
            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
        }
    }
}

function route(id, data) {
    return `${page_config.id}-${id}${data ? ('-' + data) : ''}`;
}