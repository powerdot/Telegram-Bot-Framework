let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let db = require("../../lib/helpers/db");
const Telegraf = require('telegraf');
let phone = require("phone");

let page = require("../../lib/paginator");

let page_config = {
    id: "INPUT_PHONE",
    name: "Укажите номер телефона",
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
    try {
        if ((await db.getValue(ctx, 'step')) != 'input_phone_get') return;

        await db.messages.addToRemoveMessages(ctx, ctx.update.message, true);
        await db.messages.removeMessages(ctx, true);

        let phone_number;

        switch (ctx.updateSubTypes[0]) {
            case "contact":
                phone_number = ctx.update.message.contact.phone_number;
                phone_number = phone(phone_number, "RU");
                if (phone_number.length == 0) {
                    await ctx.replyWithMarkdown('delete', "Прости, я не смог распознать твой номер телефона!\nДавай попробуем еще раз?");
                    await db.setValue(ctx, 'next_step', 'INPUT_PHONE');
                    return;
                }
                await db.setValue(ctx, 'phone', phone_number[0]);
                let callback_step = await db.getValue(ctx, "callback_step");
                await db.setValue(ctx, 'next_step', callback_step);
                await db.setValue(ctx, "callback_step", "");
                await ctx.replyWithMarkdown('Отлично! Я записал твой номер телефона)');
                break;
            case "text":
                if (ctx.update.message.text.toLowerCase().indexOf("отмен") != -1) {
                    await db.setValue(ctx, "step", "main_menu");
                    return await ctx.replyWithMarkdown("Возвращаемся в меню! 😉", { reply_markup: { inline_keyboard: await keyboard_builder.main_menu(ctx) } });
                } else {
                    // text of phone number
                    phone_number = phone(ctx.update.message.text, "RU");
                    // console.log("got phone message:", ctx.update.message.text, phone_number);
                    if (phone_number.length == 0) {
                        await ctx.replyWithMarkdown('delete', "Прости, я не смог распознать твой номер телефона!\nДавай попробуем еще раз?");
                        await db.setValue(ctx, 'next_step', 'INPUT_PHONE');
                        return;
                    }
                    await db.setValue(ctx, 'phone', phone_number[0]);
                    let callback_step = await db.getValue(ctx, "callback_step");
                    await db.setValue(ctx, 'next_step', callback_step);
                    await db.setValue(ctx, "callback_step", "");
                    await ctx.replyWithMarkdown('Отлично! Я записал твой номер телефона)');
                }
                break;
            default:
                break;
        }
    } catch (error) {
        console.error("error on input_phone second middleware:", error)
    }
}

let routes = {
    main: async (ctx) => {
        // straight page route code here
        await db.setValue(ctx, "step", 'input_phone_get')
        let x = await ctx.editMessageText("Подскажите, пожалуйста, Ваш номер телефона 📞😉", {
            reply_markup: Telegraf.Markup.inlineKeyboard([])
        });
        await db.messages.addToRemoveMessages(ctx, x, true);
        await ctx.replyWithMarkdown('delete', "На месте клавиатуры сейчас должна появиться кнопка \"Поделиться телефоном\".\n\nИли самостоятельно отправьте мне Ваш контакт.\n⬇️ через эту кнопку :)", {
            reply_markup: {
                keyboard: [
                    [{ text: "📲 Поделиться телефоном", request_contact: true }],
                    [{ text: "Отмена" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }
}