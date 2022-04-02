"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function declOfNum(number, titles) {
    var cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}
function parseCallbackPath(ctx) {
    if (ctx.updateType != 'callback_query')
        return false;
    var callback_data = (ctx === null || ctx === void 0 ? void 0 : ctx.routeTo) || ("data" in ctx.callbackQuery ? ctx.callbackQuery.data : undefined);
    // current - index 0
    var result = [];
    var routes = callback_data.split("/");
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        var data = route.split("�");
        var r = {
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
    var next = routes.slice(1).join('/');
    if (next == '')
        next = false;
    return {
        current: result[0],
        all: result,
        next: next
    };
}
exports.default = {
    declOfNum: declOfNum,
    parseCallbackPath: parseCallbackPath,
    serverIP: require("./server_ip")
};
