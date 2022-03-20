import type {
  Markup,
  TBFContext,
  CallbackPath,
  CallbackPathRoute
} from "../types/"


function declOfNum(number: number, titles: string[]) {
  let cases = [2, 0, 1, 1, 1, 2];
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}



function parseCallbackPath(ctx: TBFContext) {
  if (ctx.updateType != 'callback_query') return false;
  let callback_data = ctx?.routeTo || ctx.callbackQuery?.data;

  // current - index 0
  let result = [];
  let routes = callback_data.split("/");
  for (let route of routes) {
    let data = route.split("�");
    let r = {
      route: data[0],
      action: data[1],
      data: data[2]
    };
    result.push(r);
  }

  if (routes.length == 0) return false;
  if (routes.length == 1 && routes[0] == "") return false;

  let next: string | boolean = routes.slice(1).join('/');
  if (next == '') next = false;

  return {
    current: result[0],
    all: result,
    next
  }
}

module.exports = {
  declOfNum,
  check_working_hours: require("./check_working_hours"),
  tastes: require("./tastes"),
  parseCallbackPath,
  serverIP: require("./server_ip")
}