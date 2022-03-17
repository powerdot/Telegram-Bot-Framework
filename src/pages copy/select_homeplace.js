let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let helpers = require("../../lib/helpers");
let db = require("../../lib/helpers/db");
const Telegraf = require('telegraf');
let page = require("../../lib/paginator");
let config = require("../../config");

let page_config = {
	id: "SELECT_HOMEPLACE",
	name: "Выберите заведение",
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

	if (config.places.length == 1) {
		let callback_step = await db.getValue(ctx, "callback_step");
		await db.setValue(ctx, "home_place", "0");
		await db.setValue(ctx, 'next_step', callback_step);
		await db.setValue(ctx, "callback_step", "");
		return;
	}

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
	if ((await db.getValue(ctx, 'step')) != 'homeplace_check_nearest_location') return;

	try {
		await db.messages.addToRemoveMessages(ctx, ctx.update.message);
		await db.messages.removeMessages(ctx, false);

		switch (ctx.updateSubTypes[0]) {
			case "location":
				let nearest = helpers.nearestPlace(ctx.update.message.location.latitude, ctx.update.message.location.longitude);
				await db.setValue(ctx, "step", "main_menu");
				if (nearest) {
					await db.setValue(ctx, 'home_place', nearest.id);
					let action = await db.getValue(ctx, "last_action");
					let new_message = await ctx.replyWithMarkdown(`Ближайшее заведение до Вас — ${nearest.name} 😉`, { reply_markup: { inline_keyboard: await keyboard_builder.main_menu(ctx) } });
					await db.setValue(ctx, "last_action", "");
					ctx.callbackQuery = { data: action, message: new_message };
					ctx.update.message.message_id = new_message.message_id;
					ctx.updateType = "callback_query";
					return;
				} else {
					await db.setValue(ctx, 'home_place', "");
					await ctx.replyWithMarkdown(`К сожалению, в радиусе 20 км нет ни одного нашего заведения 😭`, { reply_markup: { inline_keyboard: await keyboard_builder.main_menu(ctx) } });
				}
				break;
			case "text":
				if (ctx.update.message.text.toLowerCase().indexOf("отмен") != -1) {
					await db.setValue(ctx, "step", "main_menu");
					return await ctx.replyWithMarkdown("Возвращаемся в меню! 😉", { reply_markup: { inline_keyboard: await keyboard_builder.main_menu(ctx) } });
				}
				if (ctx.update.message.text.toLowerCase().indexOf("обратно") != -1) {
					await db.setValue(ctx, "step", "homeplace_select");
					return await ctx.replyWithMarkdown(`Выберете одно из заведений:`, { reply_markup: { inline_keyboard: keyboard_builder.places() } });
				}
				break;
			default:
				break;
		}
	} catch (error) {
		console.error("error on homeplace_check_nearest_location", error)
	}
}


let routes = {
	main: async (ctx) => {
		await ctx.editMessageText(`Выберете одно из заведений:`, { reply_markup: { inline_keyboard: keyboard_builder.places() } });
	},
	set: async (ctx) => {
		await db.setValue(ctx, "home_place", ctx.CallbackPath.current.data);
		let callback_step = await db.getValue(ctx, "callback_step");
		if (callback_step === "") {
			await ctx.editMessageText("Отличный выбор, я запомнил это место для Вас 😉", { reply_markup: { inline_keyboard: await keyboard_builder.main_menu(ctx) } });
		} else {
			await db.setValue(ctx, 'next_step', callback_step);
			await db.setValue(ctx, "callback_step", "");
		}
	},
	action: async (ctx) => {
		await db.setValue(ctx, "last_action", ctx.CallbackPath.current.data);
		await ctx.editMessageText(`Выберете одно из заведений:`, { reply_markup: { inline_keyboard: keyboard_builder.places() } });
	},
	find_nearest: async (ctx) => {
		await db.setValue(ctx, "step", 'homeplace_check_nearest_location')//replyWithMarkdown
		await ctx.editMessageText("Помогите мне определить Ваше местоположение 🙏", {
			reply_markup: Telegraf.Markup.inlineKeyboard([])
		});
		await ctx.replyWithMarkdown("На месте клавиатуры сейчас должна появиться кнопка \"Поделиться геопозицией\".\n\nИли самостоятельно отправьте мне Вашу геопозицию.\n⬇️ через эту кнопку :)", {
			reply_markup: {
				keyboard: [
					[{ text: "📍 Поделиться геопозицией", request_location: true }],
					[{ text: "⬅️ Вернуться обратно" }],
					[{ text: "Отмена" }]
				],
				resize_keyboard: true,
				one_time_keyboard: true
			}
		});
	}
}