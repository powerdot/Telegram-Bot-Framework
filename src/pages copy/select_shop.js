let keyboard_builder = require("../../lib/helpers/keyboard_builder");
let helpers = require("../../lib/helpers");
let db = require("../../lib/helpers/db");
const Telegraf = require('telegraf');
let page = require("../../lib/paginator");
let config = require("../../config");
let clear = require("../../lib/helpers/clearAndOpenMainMenu");
let axios = require("axios").default;

let page_config = {
	id: "SELECT_SHOP",
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
	unselect: async (ctx) => {
		await db.setValue(ctx, 'selected_shop_name', '');
		await db.setValue(ctx, 'selected_APIKEY', '');
		await db.setValue(ctx, 'selected_franchise_domain', '');
		await db.setValue(ctx, 'selected_franchise_name', '');
		await db.setValue(ctx, 'selected_user_name', '');
		return await clear(ctx, 'Теперь вы сами по себе!');
	},
	text_routes: {
		main: async (ctx) => {
		}
	}
}

function route(id, data) {
	return `${page_config.id}-${id}${data ? ('-' + data) : ''}`;
}