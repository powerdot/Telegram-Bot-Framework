let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let helpers = require("../../lib/helpers");
let db = require("../../lib/helpers/db");
let config = require("../../config.js");
let page = require("../../lib/paginator");
let backMenu = require("../../lib/helpers/clearAndOpenMainMenu");
let moment = require("moment");
let axios = require("axios").default;
let clear = require("../../lib/helpers/clearAndOpenMainMenu");


async function massPush(api_key, cards, shop_id, datetime, text) {
}

let page_config = {
    id: "SEND_PUSH",
    name: "Отправка пушей",
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
        // определяем номер карты админа
        await db.setValue(ctx, "card_number", '');

        // straight page route code here
        await db.setValue(ctx, page_config.id + "-card_number", "all");

        await ctx.editMessageText("Ух сейчас пошумим, мой господин 😉", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✌️ Одной карте", callback_data: route("card_number") }],
                    [{ text: "🤟 Всем картам", callback_data: route("input_text-multiple") }],
                    [{ text: "Отмена", callback_data: "cancel" }]
                ]
            }
        });
    },
    card_number: async (ctx) => {
        let text = "Огонь, напиши мне номер 💳 карты...";
        if (ctx.CallbackPath.current.data == 'error') text = "❗️ Не похоже на номер карты, попробуй еще раз)";
        let buttons = [
            [{ text: "Обратно", callback_data: route("main") }]
        ];
        // let card_number = await db.getValue(ctx, "card_number");
        // if(card_number != -1){
        //     buttons.unshift([{text: "На мою карту ("+card_number+")", callback_data: route('my_card')}]);
        // }
        await ctx.editMessageText(text, {
            reply_markup: { inline_keyboard: buttons }
        });
    },
    my_card: async (ctx) => {
        let card_number = await db.getValue(ctx, "card_number");
        await db.setValue(ctx, page_config.id + "-card_number", card_number);
        await db.setValue(ctx, 'next_step', page_config.id + "-input_text");
    },
    input_text: async (ctx) => {
        let text = "Давай придумаем текст для пуша 📝";
        if (ctx.CallbackPath.current.data == "multiple") {
            text = "Отправлю всем картам!\n\n" + text;
        }
        await ctx.editMessageText(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Отмена", callback_data: "cancel" }]
                ]
            }
        });
    },
    input_date: async (ctx) => {
        await db.setValue(ctx, page_config.id + "-date", '');
        await db.setValue(ctx, page_config.id + "-time", '');
        let text = "Невероятно! Отправим сразу или в конкретную дату и в конкретное время? 🗓";
        await ctx.editMessageText(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💥 Прямо сейчас", callback_data: route('pre_send') }],
                    [{ text: "🗓 Выбрать дату и время", callback_data: route('select_date') }],
                    [{ text: "Отмена", callback_data: "cancel" }]
                ]
            }
        });
    },
    select_date: async (ctx) => {
        let text = "🗓 Отправь, пожалуйста, дату в формате ДД.ММ.ГГГГ\nНапример, 01.02.2020\n\nПожалуйста, именно так, а то я могу запутаться 🤭";
        if (ctx.CallbackPath.current.data == 'error') text = "❗️ Я не смог прочитать дату, отправишь еще раз?\nФормат: ДД.ММ.ГГГГ";
        await ctx.editMessageText(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Обратно", callback_data: page_config.id + "-input_text" }],
                    [{ text: "Отмена", callback_data: "cancel" }]
                ]
            }
        });
    },
    select_time: async (ctx) => {
        let text = "⏰ Отправь, пожалуйста, время в формате ЧЧ:ММ\nНапример, 04:30\n\nПожалуйста, именно так, а то я могу запутаться 🤭";
        if (ctx.CallbackPath.current.data == 'error') text = "❗️ Я не смог прочитать время, отправишь еще раз?\nФормат: ЧЧ:ММ";
        await ctx.editMessageText(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Обратно", callback_data: page_config.id + "-select_date" }],
                    [{ text: "Отмена", callback_data: "cancel" }]
                ]
            }
        });
    },
    pre_send: async (ctx) => {
        let text = "И так... что же у нас получается:\n\n";

        let shop_name = await db.getValue(ctx, 'selected_shop_name');
        if (shop_name == '') shop_name = await db.getValue(ctx, 'shop_name');
        text += "📣 " + shop_name;
        text += '\n';

        let card_number = await db.getValue(ctx, page_config.id + "-card_number");
        if (card_number == "all") { text += "👨‍👩‍👧‍👦 Отправляем всем"; } else { text += "🙆‍♂️ Отправляем карте №" + card_number; }
        text += "\n";

        let date = await db.getValue(ctx, page_config.id + "-date");
        let time = await db.getValue(ctx, page_config.id + "-time");
        if (date == "") { text += "⏰ Прямо сейчас"; } else { text += `⏲ ${date} в ${time}`; }

        text += "\n\n📝 Следующий пуш:\n";
        let send_text = await db.getValue(ctx, page_config.id + "-text");
        text += `*${send_text}*`;

        await ctx.editMessageText(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📤 Отправить", callback_data: route('send') }],
                    [{ text: "Отмена", callback_data: "cancel" }]
                ]
            },
            parse_mode: "markdown"
        });
    },
    send: async (ctx) => {
        await backMenu(ctx, "Супер! Будет сделано, капитан! 🙃");
        let cards = await db.getValue(ctx, page_config.id + "-card_number");
        let shop_id = await db.getValue(ctx, "shop_id");
        let datetime = 'now'
        let date = await db.getValue(ctx, page_config.id + "-date");
        if (date != '') {
            let time = await db.getValue(ctx, page_config.id + "-time");
            datetime = date + " " + time;
        }
        let text = await db.getValue(ctx, page_config.id + "-text");
        let api_key = await db.getValue(ctx, "selected_APIKEY");
        if (api_key == '') api_key = await db.getValue(ctx, "APIKEY");
        await massPush(api_key, cards, shop_id, datetime, text);
    },
    text_routes: {
        card_number: async (ctx) => {
            let card_number = ctx.update.message.text;
            if (card_number != parseInt(card_number)) {
                await db.setValue(ctx, 'next_step', page_config.id + "-card_number-error");
                await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                await db.messages.removeMessages(ctx, true);
                return;
            }
            await db.setValue(ctx, page_config.id + "-card_number", card_number);
            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
            await db.setValue(ctx, 'next_step', route("input_text"))
        },
        input_text: async (ctx) => {
            let text = ctx.update.message.text;
            await db.setValue(ctx, 'next_step', route('input_date'));
            await db.setValue(ctx, page_config.id + "-text", text);
            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
        },
        select_date: async (ctx) => {
            let date = ctx.update.message.text;
            let m = moment(date, 'DD.MM.YYYY');
            console.log(m.format("DD.MM.YYYY"), date);
            if (m.format("DD.MM.YYYY") != date) {
                await db.setValue(ctx, 'next_step', page_config.id + "-select_date-error");
                await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                await db.messages.removeMessages(ctx, true);
                return;
            }

            await db.setValue(ctx, page_config.id + "-date", m.format("YYYY-MM-DD"));
            await db.setValue(ctx, 'next_step', route('select_time'));
            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
        },
        select_time: async (ctx) => {
            let time = ctx.update.message.text.split(":");

            if (time.length != 2 || time[0].length != 2 || !time[1]) {
                await db.setValue(ctx, 'next_step', page_config.id + "-select_time-error");
                await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
                await db.messages.removeMessages(ctx, true);
                return;
            }

            if (time[0] > 23) time[0] = 23;
            if (time[1] > 59) time[1] = 59;

            await db.setValue(ctx, page_config.id + "-time", time[0] + ":" + time[1]);
            await db.setValue(ctx, 'next_step', route('pre_send'));
            await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
            await db.messages.removeMessages(ctx, true);
        }
    }
}

function route(id) {
    return `${page_config.id}-${id}`;
}