let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let helpers = require("../../lib/helpers");
let db = require("../../lib/helpers/db");
let config = require("../../config.js");
let page = require("../../lib/paginator");
let clearAndOpenMainMenu = require("../../lib/helpers/clearAndOpenMainMenu");
let users = require("../../lib/helpers/users");

let page_config = {
    id: "SUPER_ADMIN_USERS",
    name: "Права пользователей",
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
        // straight page route code here
        await ctx.editMessageText(`Выбери действие, мой повелитель`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Назначить админом 👑", callback_data: page_config.id + "-add_to_admins" }],
                    [{ text: "Лишить прав 🔪", callback_data: page_config.id + "-remove_from_admins" }],
                    [{ text: "Отмена", callback_data: "cancel" }],
                ]
            }
        });
    },
    add_to_admins: async (ctx) => {
        let msg = {
            'lets_start': "Отлично, давай приступим.",
            'error': "❌ Что-то не похоже на код, давай еще раз."
        };
        if (!ctx.CallbackPath.current.data) ctx.CallbackPath.current.data = 'lets_start';
        // console.log("ctx.CallbackPath.current.data:",ctx.CallbackPath.current.data);
        let prepend_msg = msg[ctx.CallbackPath.current.data];
        await ctx.editMessageText(`${prepend_msg}\nМне нужен ID пользователя, которого я сделаю администратором.\n\nДля этого нужно попросить человека сказать некоторые заветные цифры из бота @get_me_bot\n\nСразу как он их тебе скажет, напиши или перешли их мне ✍️`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "⬅️ Обратно", callback_data: page_config.id + "-back" }],
                ]
            }
        });
    },
    select_shop_id: async (ctx) => {
        let msg = {
            'lets_start': "Какой у админа shop_id",
            'error': "❌ Что-то не похоже на shop_id, давай еще раз."
        };
        if (!ctx.CallbackPath.current.data) ctx.CallbackPath.current.data = 'lets_start';
        let prepend_msg = msg[ctx.CallbackPath.current.data];
        let my_shop_id = await db.getValue(ctx, "shop_id");
        let my_shop_name = await db.getValue(ctx, "shop_name");
        console.log([{ text: `Мой - ${my_shop_id}, ${my_shop_name}`, callback_data: page_config.id + "-quick_select_shop_id-" + my_shop_id }])
        await ctx.editMessageText(`${prepend_msg}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: `Мой - ${my_shop_id}, ${my_shop_name}`, callback_data: page_config.id + "-quick_select_shop_id-" + my_shop_id }],
                    [{ text: "⬅️ Обратно", callback_data: page_config.id + "-back" }]
                ]
            }
        });
    },
    quick_select_shop_id: async (ctx) => {
        let my_shop_id = ctx.CallbackPath.current.data;
        await db.setValue(ctx, 'next_step', page_config.id + "-select_card_number");
        await db.setValue(ctx, page_config.id + "-shop_id", my_shop_id);
    },
    select_card_number: async (ctx) => {
        let msg = {
            'lets_start': "Какой у админа номер карты? Или отправь -1, если не знаешь, брат",
            'error': "❌ Что-то не похоже на номер карты, давай еще раз."
        };
        if (!ctx.CallbackPath.current.data) ctx.CallbackPath.current.data = 'lets_start';
        let prepend_msg = msg[ctx.CallbackPath.current.data];
        await ctx.editMessageText(`${prepend_msg}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🤷‍♂️ Не знаю", callback_data: page_config.id + "-dontknow_select_card_number" }],
                    [{ text: "⬅️ Обратно", callback_data: page_config.id + "-back" }]
                ]
            }
        });
    },
    dontknow_select_card_number: async (ctx) => {
        await db.setValue(ctx, page_config.id + "-card_number", -1);
        await done(ctx);
    },
    remove_from_admins: async (ctx) => {
        let user_list = [];

        let users_admin = await db.users.group.getAllByGroup('admin');
        let users_super_admin = await db.users.group.getAllByGroup('super_admin');
        let admins = [...users_admin, ...users_super_admin];

        // console.log('admins:',admins);

        for (let admin of admins) {
            let user = await db.getValue(admin.user_id, 'user');
            if (!user) user = { first_name: "(не использовал)" };
            user_list.push([{ text: `[${admin.group}] ${admin.user_id} - ${user.first_name}`, callback_data: page_config.id + '-select_lustrate-' + admin.user_id }]);
        }

        user_list.push([{ text: "⬅️ Обратно", callback_data: page_config.id + "-back" }]);

        // console.log(user_list);

        let msg = "О великий 🙏";
        if (ctx.CallbackPath.current.data == 'cancel') msg = "Вы помиловали пользователя 😍"

        let msg_after = "Только не удаляйте меня, а вот этих можно:";
        if (user_list.length == 1) msg_after = "\nЗдесь пусто, похоже, кроме меня и тебя никто больше не имеет прав администратора 😅"

        await ctx.editMessageText(`${msg}\n${msg_after}`, {
            reply_markup: {
                inline_keyboard: user_list
            }
        });
    },
    select_lustrate: async (ctx) => {
        let user_id = ctx.CallbackPath.current.data;
        let user = await db.getValue(user_id, 'user');
        if (!user) user = { first_name: "Неизвестно 🤔" };

        await ctx.editMessageText(`🙏 Мой господин\nКазнить нельзя помиловать?`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '😈 Казнить', callback_data: page_config.id + '-lustrate-' + user_id }],
                    [{ text: '😇 Помиловать', callback_data: page_config.id + '-remove_from_admins-cancel' }],
                ]
            }
        });
    },
    lustrate: async (ctx) => {
        let user_id = ctx.CallbackPath.current.data;

        await db.users.group.set(user_id, 'main');

        await db.setValue(user_id, 'shop_id', "");
        await db.setValue(user_id, 'shop_name', "");
        await db.setValue(user_id, 'card_number', "");

        await seq.TelegramAdmin.destroy({ where: { user_id } });

        await db.webService.secureTokens.remove(user_id);
        await clearAndOpenMainMenu(ctx, `Мой господин, я убрал у холопа права на админку!`);
        await clearAndOpenMainMenu(user_id, "К сожалению, у тебя нет доступа больше ко мне :(");
    },
    back: async (ctx) => {
        await db.setValue(ctx, 'step', "");
        await db.setValue(ctx, 'next_step', page_config.id + "-main");
    },
    //text routes
    text_routes: {
        add_to_admins: async (ctx) => {
            let code = ctx.update.message.text;

            if (code != parseInt(code)) {
                await db.setValue(ctx, 'next_step', page_config.id + "-add_to_admins-error");
                await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                await db.messages.removeMessages(ctx, true);
                return;
            }

            await db.setValue(ctx, 'next_step', page_config.id + "-select_shop_id");
            await db.setValue(ctx, page_config.id + "-user_id", code);

            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
        },
        select_shop_id: async (ctx) => {
            let shop_id = ctx.update.message.text;
            if (shop_id != parseInt(shop_id)) {
                await db.setValue(ctx, 'next_step', page_config.id + "-select_shop_id-error");
                await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                await db.messages.removeMessages(ctx, true);
                return;
            }
            await db.setValue(ctx, 'next_step', page_config.id + "-select_card_number");
            await db.setValue(ctx, page_config.id + "-shop_id", shop_id);

            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
        },
        select_card_number: async (ctx) => {
            let card_number = ctx.update.message.text;
            if (card_number != parseInt(card_number)) {
                await db.setValue(ctx, 'next_step', page_config.id + "-select_card_number-error");
                await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                await db.messages.removeMessages(ctx, true);
                return;
            }
            await db.setValue(ctx, page_config.id + "-card_number", card_number);
            await done(ctx);
        }
    }
}

async function done(ctx) {
    let user_tg_id = await db.getValue(ctx, page_config.id + "-user_id");
    let shop_id = await db.getValue(ctx, page_config.id + "-shop_id");
    let card_number = await db.getValue(ctx, page_config.id + "-card_number");
    // card_number

    await seq.TelegramAdmin.upsert({
        user_id: user_tg_id,
        shop_id,
        card_number
    });

    let shop = await seq.Shops.findOne({ where: { id: shop_id } });
    await db.setValue(user_tg_id, 'shop_id', shop_id);
    await db.setValue(user_tg_id, 'shop_name', shop.name);
    await db.setValue(user_tg_id, 'card_number', card_number);

    await db.users.group.set(user_tg_id, 'admin');
    await clearAndOpenMainMenu(ctx, `Отлично, теперь пользователь с ID ${user_tg_id}, shop_id ${shop_id}, card_number ${card_number} - администратор!`);
    await clearAndOpenMainMenu(user_tg_id, `Поздравляю 🎉 Теперь ты администратор!\nНадеюсь, мы сработаемся 😉`);
}