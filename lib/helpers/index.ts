import type {
  Markup,
  Context,
  TBFContext,
  CallbackPath,
  CallbackPathRoute
} from "../types/"

function getChatId(ctx: TBFContext) {
  if (typeof ctx == 'string') return parseInt(ctx);
  if (typeof ctx == 'number') return ctx;
  let chat_data = ctx.update.message || ctx.update.callback_query.message;
  return chat_data.chat.id
}

function declOfNum(number, titles) {
  let cases = [2, 0, 1, 1, 1, 2];
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}



function parseCallbackPath(ctx) {
  if (ctx.updateType != 'callback_query') return false;
  let callback_data = ctx.callbackQuery.data; //.split("-")[0];
  // if (!callback_data) return false;
  // console.log(callback_data, ctx.update);
  // page-action-data/page-action-data/page-action-data
  // SELECT_HOMEPLACE-action/INPUT_PHONE-get/SEE_MENU--kek
  // [{route: 'SELECT_HOMEPLACE', action: 'action'}, {route: 'INPUT_PHONE', action: 'get'}, {route: 'SEE_MENU', data: 'kek'}]
  // current - index 0
  let result = [];
  let routes = callback_data.split("/");
  for (let route of routes) {
    let data = route.split("-");
    let r = {
      route: data[0],
      action: data[1],
      data: data[2]
    };
    result.push(r);
  }

  if (routes.length == 0) return false;
  if (routes.length == 1 && routes[0] == "") return false;

  let next = routes.slice(1).join('/');
  if (next == '') next = false;

  return {
    current: result[0],
    all: result,
    next
  }
}

module.exports = {
  getChatId,
  declOfNum,
  check_working_hours: require("./check_working_hours"),
  tastes: require("./tastes"),
  parseCallbackPath,
  serverIP: require("./server_ip")
}