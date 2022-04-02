"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var startup_chain_1 = require("./startup_chain");
var db_1 = require("./helpers/db");
var page_loader_1 = require("./page_loader");
var set_ids_1 = require("./bot_middlewares/set_ids");
var spam_1 = require("./bot_middlewares/spam");
var mark_user_messages_1 = require("./bot_middlewares/mark_user_messages");
var router_1 = require("./bot_middlewares/router");
var auto_remove_messages_1 = require("./auto_remove_messages");
var Create = function (_a) {
    var _b;
    var webServer = _a.webServer, telegram = _a.telegram, mongo = _a.mongo, config = _a.config;
    var default_config = {
        pages: {
            path: "./pages",
        },
        plugins: {
            path: "./plugins",
        },
        autoRemoveMessages: true,
        debug: false,
        webServer: {
            port: 8080,
            address: "",
        }
    };
    var _config = Object.assign(default_config, config);
    if ((_b = _config.webServer) === null || _b === void 0 ? void 0 : _b.address)
        _config.webServer.address = _config.webServer.address.replace('//localhost', '//127.0.0.1');
    return new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (0, startup_chain_1.default)({ webServer: webServer, telegram: telegram, mongo: mongo, config: _config }).then(function (_a) {
                var bot = _a.bot, app = _a.app, database = _a.database;
                return __awaiter(void 0, void 0, void 0, function () {
                    var db, _b, pages, plugins, components, return_data;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                db = (0, db_1.default)(bot, database);
                                _b = (0, page_loader_1.default)({ db: db, config: _config }), pages = _b.pages, plugins = _b.plugins;
                                components = __spreadArray(__spreadArray([], pages, true), plugins, true);
                                bot.use((0, set_ids_1.default)());
                                bot.use((0, spam_1.default)());
                                bot.use((0, mark_user_messages_1.default)({ db: db }));
                                return_data = {
                                    bot: bot,
                                    app: app,
                                    database: database,
                                    db: db,
                                    pages: pages,
                                    plugins: plugins,
                                    openPage: function (_a) {
                                        var ctx = _a.ctx, pageId = _a.pageId;
                                        return new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                                            var found_page;
                                            return __generator(this, function (_a) {
                                                found_page = components.find(function (page) { return page.id === pageId; });
                                                if (!found_page)
                                                    return [2 /*return*/, reject(new Error("Component not found: " + pageId))];
                                                found_page.open(ctx);
                                                return [2 /*return*/, resolve(true)];
                                            });
                                        }); });
                                    }
                                };
                                return [4 /*yield*/, resolve(return_data)];
                            case 1:
                                _c.sent();
                                if (config.autoRemoveMessages)
                                    (0, auto_remove_messages_1.default)({ db: db });
                                // Engine router
                                bot.use((0, router_1.default)({ db: db, components: components }));
                                // Starting web server
                                if (app && (webServer === null || webServer === void 0 ? void 0 : webServer.module))
                                    app.use(webServer.module({ bot: bot, db: db, config: config, components: components, database: database }));
                                return [2 /*return*/];
                        }
                    });
                });
            });
            return [2 /*return*/];
        });
    }); });
};
exports.default = Create;
