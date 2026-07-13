"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.declOfNum = declOfNum;
exports.parseCallbackPath = parseCallbackPath;
function declOfNum(number, titles) {
    let cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}
function parseCallbackPath(ctx) {
    if (ctx.updateType != 'callback_query')
        return false;
    let callback_data = ctx?.routeTo || ("data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined);
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
    if (routes.length == 0)
        return false;
    if (routes.length == 1 && routes[0] == "")
        return false;
    let next = routes.slice(1).join('/');
    if (next == '')
        next = false;
    return {
        current: result[0],
        all: result,
        next
    };
}
//# sourceMappingURL=index.js.map