"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var data_packer_1 = require("./data_packer");
var paginator_1 = require("./paginator");
var loadedComponents = [];
function loader(_a) {
    var _this_1 = this;
    var _b;
    var db = _a.db, config = _a.config, inputComponents = _a.inputComponents, componentType = _a.componentType;
    function removeMessageWrapper(sendKey, args) {
        if (args === void 0) { args = []; }
        return __awaiter(this, void 0, void 0, function () {
            var sent;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (_a = this.ctx.telegram)[sendKey].apply(_a, __spreadArray([this.ctx.chatId], args, false))];
                    case 1:
                        sent = _b.sent();
                        return [4 /*yield*/, db.messages.addToRemoveMessages(this.ctx, sent, false)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, sent];
                }
            });
        });
    }
    function routeToAction(ctx, id, action, data) {
        var _this_1 = this;
        if (action === void 0) { action = 'main'; }
        return new Promise(function (resolve, reject) { return __awaiter(_this_1, void 0, void 0, function () {
            var parsedData, compiled, compiled_bytes_length, messagespace, uniqid, tempdata_identifier;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        parsedData = data_packer_1.default.packData(data);
                        compiled = "".concat(id, "\uFFFD").concat(action).concat(parsedData ? ('�' + parsedData) : '');
                        compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
                        if (!(compiled_bytes_length > 64)) return [3 /*break*/, 2];
                        messagespace = (((_b = (_a = ctx.callbackQuery) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.message_id) || ((_c = ctx.message) === null || _c === void 0 ? void 0 : _c.message_id)).toString();
                        uniqid = Math.floor(Math.random() * 99999).toString();
                        tempdata_identifier = 'X' + messagespace + "." + uniqid;
                        return [4 /*yield*/, db.tempData.add(ctx.chatId, messagespace, uniqid, data)];
                    case 1:
                        _d.sent();
                        compiled = "".concat(id, "\uFFFD").concat(action, "\uFFFD").concat(tempdata_identifier);
                        compiled_bytes_length = Buffer.byteLength(compiled, 'utf8');
                        if (compiled_bytes_length > 64) {
                            return [2 /*return*/, reject(new Error("Data is too long. Allowed 64 bytes. Now is ".concat(compiled_bytes_length, ".\nTry shortening the title of page or action or cut sending data.\n").concat(compiled)))];
                        }
                        _d.label = 2;
                    case 2: return [2 /*return*/, resolve(compiled)];
                }
            });
        }); });
    }
    var parseButtons = function (_a) {
        var _this_1 = this;
        var ctx = _a.ctx, id = _a.id, _b = _a.buttons, buttons = _b === void 0 ? [] : _b;
        return new Promise(function (resolve, reject) { return __awaiter(_this_1, void 0, void 0, function () {
            var inline_buttons, _i, buttons_1, row, new_row, _a, row_1, button, callback_data, url, component_name;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        inline_buttons = [];
                        _i = 0, buttons_1 = buttons;
                        _b.label = 1;
                    case 1:
                        if (!(_i < buttons_1.length)) return [3 /*break*/, 14];
                        row = buttons_1[_i];
                        if (!row)
                            return [3 /*break*/, 13];
                        new_row = [];
                        _a = 0, row_1 = row;
                        _b.label = 2;
                    case 2:
                        if (!(_a < row_1.length)) return [3 /*break*/, 12];
                        button = row_1[_a];
                        callback_data = void 0;
                        url = void 0;
                        component_name = button.page || button.plugin;
                        if (!(button.action && component_name)) return [3 /*break*/, 4];
                        return [4 /*yield*/, routeToAction(ctx, component_name, button.action.toString(), button.data)];
                    case 3:
                        callback_data = _b.sent();
                        return [3 /*break*/, 10];
                    case 4:
                        if (!button.action) return [3 /*break*/, 7];
                        if (!(typeof button.action == "function")) return [3 /*break*/, 5];
                        callback_data = button.action();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, routeToAction(ctx, id, button.action, button.data)];
                    case 6:
                        callback_data = _b.sent();
                        _b.label = 7;
                    case 7:
                        if (!component_name) return [3 /*break*/, 9];
                        return [4 /*yield*/, routeToAction(ctx, component_name, 'main', button.data)];
                    case 8:
                        callback_data = _b.sent();
                        _b.label = 9;
                    case 9:
                        if (button.url) {
                            url = button.url.indexOf("http") == 0 ? button.url : config.webServer.address + button.url;
                            if (config.debug)
                                console.log("url:", url);
                        }
                        _b.label = 10;
                    case 10:
                        new_row.push({
                            text: button.text,
                            callback_data: callback_data,
                            url: url
                        });
                        _b.label = 11;
                    case 11:
                        _a++;
                        return [3 /*break*/, 2];
                    case 12:
                        inline_buttons.push(new_row);
                        _b.label = 13;
                    case 13:
                        _i++;
                        return [3 /*break*/, 1];
                    case 14:
                        if (config.debug)
                            console.log("inline_buttons:", inline_buttons);
                        return [2 /*return*/, resolve(inline_buttons)];
                }
            });
        }); });
    };
    function extractHandler(action) {
        var action_fn = typeof action == "function" ? action : action.handler;
        return action_fn;
    }
    var components = [];
    var _loop_1 = function (page) {
        var pageObject;
        try {
            pageObject = page.module({
                db: db,
                config: config,
                parseButtons: parseButtons
            });
            if (!pageObject.id)
                pageObject.id = page.id;
        }
        catch (error) {
            console.error('📛', "Component loading error:", page.path, error);
            return "continue";
        }
        if (loadedComponents.find(function (x) { return x.id == pageObject.id; })) {
            console.error('📛', "Component with same id:", pageObject.id, '- skipped', page.path);
            return "continue";
        }
        var binding = {
            id: pageObject.id,
            type: pageObject.type,
            ctx: null,
            send: function (_a) {
                var _b = _a.text, text = _b === void 0 ? "" : _b, _c = _a.buttons, buttons = _c === void 0 ? [] : _c, _d = _a.keyboard, keyboard = _d === void 0 ? [] : _d;
                return __awaiter(this, void 0, void 0, function () {
                    var _this, options, inline_buttons, reply_keyboard, message;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                _this = this;
                                if (text === undefined)
                                    throw new Error("send() text is empty");
                                options = {
                                    reply_markup: {
                                        inline_keyboard: [],
                                        keyboard: [],
                                        resize_keyboard: true,
                                        one_time_keyboard: true
                                    }
                                };
                                if (!(buttons.length > 0)) return [3 /*break*/, 2];
                                return [4 /*yield*/, parseButtons({ ctx: _this.ctx, id: _this.id, buttons: buttons })];
                            case 1:
                                inline_buttons = _e.sent();
                                options.reply_markup.inline_keyboard = inline_buttons;
                                return [3 /*break*/, 3];
                            case 2:
                                options.reply_markup.inline_keyboard = [];
                                _e.label = 3;
                            case 3:
                                if (keyboard.length > 0) {
                                    reply_keyboard = keyboard;
                                    options.reply_markup.keyboard = reply_keyboard;
                                }
                                else {
                                    options.reply_markup.keyboard = [];
                                }
                                return [4 /*yield*/, _this.ctx.telegram.sendMessage(_this.ctx.chatId, text, __assign(__assign({}, options), { parse_mode: 'HTML' }))];
                            case 4:
                                message = _e.sent();
                                return [4 /*yield*/, db.messages.addToRemoveMessages(_this.ctx, [message], false)];
                            case 5:
                                _e.sent();
                                return [2 /*return*/, message];
                        }
                    });
                });
            },
            update: function (_a) {
                var _b = _a.text, text = _b === void 0 ? "" : _b, _c = _a.buttons, buttons = _c === void 0 ? [] : _c, _d = _a.keyboard, keyboard = _d === void 0 ? [] : _d;
                return __awaiter(this, void 0, void 0, function () {
                    var options, inline_buttons, reply_keyboard, lastBotMessage, edited, e_1;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                if (text === undefined)
                                    throw new Error("update() text is empty");
                                options = {
                                    reply_markup: {
                                        inline_keyboard: [],
                                        keyboard: []
                                    }
                                };
                                if (!(buttons.length > 0)) return [3 /*break*/, 2];
                                return [4 /*yield*/, parseButtons({ ctx: this.ctx, id: this.id, buttons: buttons })];
                            case 1:
                                inline_buttons = _e.sent();
                                options.reply_markup.inline_keyboard = inline_buttons;
                                return [3 /*break*/, 3];
                            case 2:
                                options.reply_markup.inline_keyboard = [];
                                _e.label = 3;
                            case 3:
                                if (buttons.length > 0) {
                                    reply_keyboard = keyboard;
                                    options.reply_markup.keyboard = reply_keyboard;
                                }
                                else {
                                    options.reply_markup.keyboard = [];
                                }
                                if (!this.ctx.routing.isMessageFromUser) return [3 /*break*/, 10];
                                return [4 /*yield*/, db.messages.bot.getLastMessage(this.ctx)];
                            case 4:
                                lastBotMessage = _e.sent();
                                if (!lastBotMessage) return [3 /*break*/, 10];
                                if (config.debug)
                                    console.log("message to update:", lastBotMessage);
                                edited = void 0;
                                _e.label = 5;
                            case 5:
                                _e.trys.push([5, 7, , 8]);
                                return [4 /*yield*/, this.ctx.telegram.editMessageText(this.ctx.chatId, lastBotMessage.messageId, undefined, text, __assign(__assign({}, options), { parse_mode: 'HTML' }))];
                            case 6:
                                edited = _e.sent();
                                return [3 /*break*/, 8];
                            case 7:
                                e_1 = _e.sent();
                                console.warn("⚠️", "Warning:", e_1);
                                return [3 /*break*/, 8];
                            case 8: return [4 /*yield*/, db.messages.removeMessages(this.ctx, true)];
                            case 9:
                                _e.sent();
                                return [2 /*return*/, edited];
                            case 10: return [4 /*yield*/, this.ctx.editMessageText(text, __assign(__assign({}, options), { parse_mode: 'HTML' }))];
                            case 11: return [2 /*return*/, _e.sent()];
                        }
                    });
                });
            },
            sendMediaGroup: function (_a) {
                var _b = _a.media, media = _b === void 0 ? [] : _b, _c = _a.options, options = _c === void 0 ? {} : _c;
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_d) {
                        if (media.length === 0)
                            throw new Error("sendMediaGroup() media is empty");
                        return [2 /*return*/, removeMessageWrapper.bind(this)('sendMediaGroup', [media, options])];
                    });
                });
            },
            goToComponent: function (_a) {
                var component = _a.component, _b = _a.action, action = _b === void 0 ? "main" : _b, data = _a.data, _c = _a.type, type = _c === void 0 ? "" : _c;
                return __awaiter(this, void 0, void 0, function () {
                    var _this, found_component, action_fn;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                if (!type)
                                    return [2 /*return*/, Error("goToComponent() type is empty")];
                                _this = this;
                                found_component = loadedComponents.find(function (x) { return x.id == component && x.type == type; });
                                if (!found_component) return [3 /*break*/, 2];
                                return [4 /*yield*/, db.setValue(_this.ctx, "step", component + "�" + action)];
                            case 1:
                                _d.sent();
                                action_fn = extractHandler(found_component.actions[action]);
                                action_fn.bind(__assign(__assign({}, _this), { id: component }))({ ctx: _this.ctx, data: data });
                                return [3 /*break*/, 3];
                            case 2: throw new Error("goToComponent() component not found: " + component);
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            },
            goToPage: function (_a) {
                var page = _a.page, _b = _a.action, action = _b === void 0 ? "main" : _b, data = _a.data;
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_c) {
                        this.goToComponent({ component: page, action: action, data: data, type: "page" });
                        return [2 /*return*/];
                    });
                });
            },
            goToPlugin: function (_a) {
                var plugin = _a.plugin, _b = _a.action, action = _b === void 0 ? "main" : _b, data = _a.data;
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_c) {
                        this.goToComponent({ component: plugin, action: action, data: data, type: "plugin" });
                        return [2 /*return*/];
                    });
                });
            },
            goToAction: function (_a) {
                var action = _a.action, data = _a.data;
                return __awaiter(this, void 0, void 0, function () {
                    var _this, current_page, page_action, action_fn;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _this = this;
                                current_page = loadedComponents.find(function (x) { return x.id == _this.id; });
                                page_action = current_page.actions[action];
                                if (!page_action) return [3 /*break*/, 2];
                                return [4 /*yield*/, db.setValue(_this.ctx, "step", _this.id + "�" + action)];
                            case 1:
                                _b.sent();
                                action_fn = extractHandler(page_action);
                                action_fn.bind(__assign(__assign({}, _this), { id: _this.id }))({ ctx: _this.ctx, data: data });
                                return [3 /*break*/, 3];
                            case 2: throw new Error("goToAction() action not found: " + action);
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            },
            clearChat: function () {
                return __awaiter(this, void 0, void 0, function () {
                    var _this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _this = this;
                                return [4 /*yield*/, db.messages.removeMessages(_this.ctx)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            },
            user: function (_a) {
                var _this_1 = this;
                var _b = _a === void 0 ? { user_id: false } : _a, _c = _b.user_id, user_id = _c === void 0 ? false : _c;
                var _this = this;
                return {
                    get: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var chat_id;
                            return __generator(this, function (_a) {
                                chat_id = user_id || _this.ctx.chatId;
                                return [2 /*return*/, db.user.data.get(chat_id)];
                            });
                        });
                    },
                    list: function () { return __awaiter(_this_1, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, db.users.list()];
                    }); }); },
                    getValue: function (key) { return __awaiter(_this_1, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, db.getValue(user_id || _this.ctx, key)];
                    }); }); },
                    setValue: function (key, value) { return __awaiter(_this_1, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, db.setValue(user_id || _this.ctx, key, value)];
                    }); }); },
                    removeValue: function (key) { return __awaiter(_this_1, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, db.removeValue(user_id || _this.ctx, key)];
                    }); }); },
                    destroy: function () { return __awaiter(_this_1, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, db.user.destroy(user_id || _this.ctx.chatId)];
                    }); }); },
                    collection: db.user.collection(_this.ctx, user_id || _this.ctx.chatId)
                };
            }
        };
        if ((_b = pageObject === null || pageObject === void 0 ? void 0 : pageObject.actions) === null || _b === void 0 ? void 0 : _b.main) {
            var main_fn = extractHandler(pageObject.actions.main);
            main_fn.bind(binding);
        }
        if (!pageObject.onCallbackQuery) {
            pageObject.onCallbackQuery = function (ctx) { return __awaiter(_this_1, void 0, void 0, function () {
                var ctx_action, action, action_fn, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            pageObject.ctx = ctx;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 8, , 9]);
                            ctx_action = ctx.routing.action;
                            if (!ctx_action)
                                ctx_action = "main";
                            action = pageObject.actions[ctx_action];
                            if (!action) return [3 /*break*/, 6];
                            if (!action.clearChat) return [3 /*break*/, 3];
                            return [4 /*yield*/, db.messages.removeMessages(ctx)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            action_fn = extractHandler(action);
                            return [4 /*yield*/, db.setValue(ctx, "step", pageObject.id + "�" + ctx_action)];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, action_fn.bind(__assign(__assign({}, binding), { ctx: ctx }))({ ctx: ctx, data: ctx.routing.data })];
                        case 5:
                            _a.sent();
                            return [3 /*break*/, 7];
                        case 6: throw ("action not found: " + ctx_action);
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            error_1 = _a.sent();
                            console.error("onCallbackQuery ERROR ON PAGE \"".concat(pageObject.id, "\":"), error_1);
                            return [3 /*break*/, 9];
                        case 9: return [2 /*return*/];
                    }
                });
            }); };
        }
        if (!pageObject.onMessage) {
            pageObject.onMessage = function (ctx) { return __awaiter(_this_1, void 0, void 0, function () {
                var action, handler, handler_fn, result, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!ctx.routing.message)
                                return [2 /*return*/];
                            if (config.debug)
                                console.log("onMessage:", ctx.routing.message);
                            action = ctx.routing.action;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 11, , 12]);
                            handler = pageObject.actions[action].messageHandler;
                            return [4 /*yield*/, db.messages.addToRemoveMessages(ctx, ctx.message, true)];
                        case 2:
                            _a.sent();
                            if (config.debug)
                                console.log("messageHandler:", handler);
                            if (!handler) return [3 /*break*/, 8];
                            if (!handler.clearChat) return [3 /*break*/, 4];
                            return [4 /*yield*/, db.messages.removeMessages(ctx)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            handler_fn = extractHandler(handler);
                            return [4 /*yield*/, handler_fn.bind(__assign(__assign({}, binding), { ctx: ctx }))({
                                    ctx: ctx,
                                    text: "text" in ctx.message ? ctx.message.text : undefined,
                                    photo: "photo" in ctx.message ? ctx.message.photo : undefined,
                                    video: "video" in ctx.message ? ctx.message.video : undefined,
                                    animation: "animation" in ctx.message ? ctx.message.animation : undefined,
                                    document: "document" in ctx.message ? ctx.message.document : undefined,
                                    voice: "voice" in ctx.message ? ctx.message.voice : undefined,
                                    audio: "audio" in ctx.message ? ctx.message.audio : undefined,
                                    poll: "poll" in ctx.message ? ctx.message.poll : undefined,
                                    sticker: "sticker" in ctx.message ? ctx.message.sticker : undefined,
                                    location: "location" in ctx.message ? ctx.message.location : undefined,
                                    contact: "contact" in ctx.message ? ctx.message.contact : undefined,
                                    venue: "venue" in ctx.message ? ctx.message.venue : undefined,
                                    game: "game" in ctx.message ? ctx.message.game : undefined,
                                    invoice: "invoice" in ctx.message ? ctx.message.invoice : undefined,
                                    dice: "dice" in ctx.message ? ctx.message.dice : undefined,
                                })];
                        case 5:
                            result = _a.sent();
                            if (!(typeof result === "boolean")) return [3 /*break*/, 7];
                            if (!!result) return [3 /*break*/, 7];
                            return [4 /*yield*/, db.messages.removeMessages(ctx, true)];
                        case 6:
                            _a.sent();
                            _a.label = 7;
                        case 7:
                            if (config.debug)
                                console.log("MESSAGE", ctx.message);
                            return [3 /*break*/, 10];
                        case 8: return [4 /*yield*/, db.messages.removeMessages(ctx, true)];
                        case 9:
                            _a.sent();
                            _a.label = 10;
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            error_2 = _a.sent();
                            console.error("onMessage ERROR ON PAGE \"".concat(pageObject.id, "\":"), error_2);
                            return [3 /*break*/, 12];
                        case 12: return [2 /*return*/];
                    }
                });
            }); };
        }
        if (!pageObject.call) {
            pageObject.call = function (ctx) { return __awaiter(_this_1, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (config.debug)
                                console.log("call", pageObject.id, ctx.routing);
                            if (!(ctx.routing.type == 'callback_query')) return [3 /*break*/, 2];
                            return [4 /*yield*/, pageObject.onCallbackQuery(ctx)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            if (!(ctx.routing.type == 'message')) return [3 /*break*/, 4];
                            return [4 /*yield*/, pageObject.onMessage(ctx)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            }); };
        }
        if (!pageObject.onOpen)
            pageObject.onOpen = function () { return __awaiter(_this_1, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); };
        if (!pageObject.open)
            pageObject.open = function (_a) {
                var ctx = _a.ctx, data = _a.data, action = _a.action;
                return __awaiter(this, void 0, void 0, function () {
                    var act, action_fn;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                act = action || 'main';
                                action_fn = extractHandler(pageObject.actions[act]);
                                return [4 /*yield*/, db.messages.removeMessages(ctx)];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, action_fn.bind(__assign(__assign({}, binding), { ctx: ctx }))({ ctx: ctx, data: data })];
                            case 2:
                                _b.sent();
                                return [4 /*yield*/, db.setValue(ctx, "step", pageObject.id + "�main")];
                            case 3:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            };
        components.push(__assign(__assign({}, pageObject), { type: componentType }));
    };
    for (var _i = 0, inputComponents_1 = inputComponents; _i < inputComponents_1.length; _i++) {
        var page = inputComponents_1[_i];
        _loop_1(page);
    }
    return { components: components };
}
exports.default = (function (_a) {
    var db = _a.db, config = _a.config;
    var paginator = (0, paginator_1.default)({ config: config });
    var pages_components = paginator.list("pages");
    var pages = loader({ db: db, config: config, inputComponents: pages_components, componentType: 'page' }).components;
    loadedComponents.push.apply(loadedComponents, pages);
    console.log("✅", "Loader: ".concat(pages.length, " ").concat(pages.length == 1 ? 'page' : 'pages', " loaded!"));
    var plugins_components = paginator.list("plugins");
    var plugins = loader({ db: db, config: config, inputComponents: plugins_components, componentType: 'plugin' }).components;
    loadedComponents.push.apply(loadedComponents, plugins);
    console.log("✅", "Loader: ".concat(plugins.length, " ").concat(plugins.length == 1 ? 'plugin' : 'plugins', " loaded!"));
    return { pages: pages, plugins: plugins, paginator: paginator };
});
