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
var moment = require("moment");
var ObjectID = require('mongodb').ObjectID;
exports.default = (function (bot, _a) {
    var client = _a.client, collection_UserData = _a.collection_UserData, collection_BotMessageHistory = _a.collection_BotMessageHistory, collection_UserMessageHistory = _a.collection_UserMessageHistory, collection_Data = _a.collection_Data, collection_Users = _a.collection_Users, collection_specialCommandsHistory = _a.collection_specialCommandsHistory, collection_UserDataCollection = _a.collection_UserDataCollection, collection_TempData = _a.collection_TempData;
    function getValue(ctx, key) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_UserData.findOne({ chatId: ctx.chatId, name: key })];
                    case 1:
                        data = _a.sent();
                        data = data ? data.value : undefined;
                        console.log("[GET value]", key, '->', data);
                        return [2 /*return*/, data];
                }
            });
        });
    }
    function setValue(ctx, key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[SET value]", key, "=", value);
                        return [4 /*yield*/, collection_UserData.updateOne({ name: key, chatId: ctx.chatId }, { $set: { name: key, chatId: ctx.chatId, value: value } }, { upsert: true })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    function removeValue(ctx, key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[REMOVE value]", key);
                        return [4 /*yield*/, collection_UserData.deleteOne({ name: key, chatId: ctx.chatId })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    function TempDataAdd(chatId, messagespase, uniqid, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_TempData.updateOne({ messagespase: messagespase, uniqid: uniqid, chatId: chatId }, { $set: { messagespase: messagespase, uniqid: uniqid, data: data, chatId: chatId } }, { upsert: true })];
                    case 1:
                        _a.sent();
                        console.log("[ADD TempData]", messagespase, uniqid, data);
                        return [2 /*return*/];
                }
            });
        });
    }
    function TempDataGet(messagespase, uniqid) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_TempData.findOne({ messagespase: messagespase, uniqid: uniqid })];
                    case 1:
                        data = _a.sent();
                        data = data ? data.data : undefined;
                        console.log("[GET TempData]", messagespase, uniqid, '->', data);
                        return [2 /*return*/, data];
                }
            });
        });
    }
    function TempDataRemove(messagespase) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[REMOVE TempData]", messagespase);
                        return [4 /*yield*/, collection_TempData.deleteMany({ messagespase: messagespase })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function parseQuery(query) {
        if (query === void 0) { query = {}; }
        var new_query = Object.assign({}, query);
        if (new_query.hasOwnProperty('_id')) {
            new_query._id = ObjectID(new_query._id);
        }
        return new_query;
    }
    function userCollection(ctx, collection_name) {
        return {
            find: function (query) {
                if (query === void 0) { query = {}; }
                return collection_UserDataCollection.findOne(__assign({ collection_name: collection_name, chatId: ctx.chatId }, parseQuery(query)));
            },
            findAll: function (query) {
                if (query === void 0) { query = {}; }
                return collection_UserDataCollection.find(__assign({ collection_name: collection_name, chatId: ctx.chatId }, parseQuery(query))).toArray();
            },
            insert: function (value) {
                return collection_UserDataCollection.insertOne(__assign({ collection_name: collection_name, chatId: ctx.chatId }, value));
            },
            update: function (query, value) {
                return collection_UserDataCollection.updateOne(__assign({ collection_name: collection_name, chatId: ctx.chatId }, parseQuery(query)), { $set: value });
            },
            updateMany: function (query, value) {
                return collection_UserDataCollection.updateMany(__assign({ collection_name: collection_name, chatId: ctx.chatId }, parseQuery(query)), { $set: value });
            },
            delete: function (query) {
                return collection_UserDataCollection.deleteOne(__assign({ collection_name: collection_name, chatId: ctx.chatId }, parseQuery(query)));
            },
            deleteMany: function (query) {
                return collection_UserDataCollection.deleteMany(__assign({ collection_name: collection_name, chatId: ctx.chatId }, parseQuery(query)));
            }
        };
    }
    function removeMessages(ctx, onlyTrash) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, query, queryTrash, currentBotMessagesToRemove, _i, currentBotMessagesToRemove_1, currentMessageToRemove, messageId, currentUserMessagesToRemove, _a, currentUserMessagesToRemove_1, currentMessageToRemove, messageId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        chatId = ctx.chatId;
                        query = { chatId: chatId };
                        queryTrash = { chatId: chatId, trash: onlyTrash };
                        return [4 /*yield*/, collection_BotMessageHistory.find(onlyTrash ? queryTrash : query)];
                    case 1: return [4 /*yield*/, (_b.sent()).toArray()];
                    case 2:
                        currentBotMessagesToRemove = _b.sent();
                        console.log("[removeBotMessages]", currentBotMessagesToRemove.length, "messages to remove");
                        // console.log("currentMessagesToRemove:", currentMessagesToRemove);
                        if (currentBotMessagesToRemove.length != 0) {
                            for (_i = 0, currentBotMessagesToRemove_1 = currentBotMessagesToRemove; _i < currentBotMessagesToRemove_1.length; _i++) {
                                currentMessageToRemove = currentBotMessagesToRemove_1[_i];
                                messageId = currentMessageToRemove === null || currentMessageToRemove === void 0 ? void 0 : currentMessageToRemove.messageId;
                                if (!messageId)
                                    continue;
                                removeMessage(ctx, messageId, 'bot');
                            }
                        }
                        return [4 /*yield*/, collection_UserMessageHistory.find(onlyTrash ? queryTrash : query)];
                    case 3: return [4 /*yield*/, (_b.sent()).toArray()];
                    case 4:
                        currentUserMessagesToRemove = _b.sent();
                        console.log("[removeUserMessages]", currentUserMessagesToRemove.length, "messages to remove");
                        if (currentUserMessagesToRemove.length != 0) {
                            for (_a = 0, currentUserMessagesToRemove_1 = currentUserMessagesToRemove; _a < currentUserMessagesToRemove_1.length; _a++) {
                                currentMessageToRemove = currentUserMessagesToRemove_1[_a];
                                messageId = currentMessageToRemove.messageId;
                                if (!messageId)
                                    continue;
                                removeMessage(ctx, messageId, 'user');
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    function addToRemoveMessages(ctx, message_or_arrayMessages, trash) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, messages, _i, messages_1, message, selectedCollection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (trash === undefined)
                            trash = false;
                        chatId = ctx.chatId;
                        messages = [];
                        if (!Array.isArray(message_or_arrayMessages))
                            message_or_arrayMessages = [message_or_arrayMessages];
                        messages = message_or_arrayMessages;
                        console.log("[addToRemoveMessages]", messages);
                        _i = 0, messages_1 = messages;
                        _a.label = 1;
                    case 1:
                        if (!(_i < messages_1.length)) return [3 /*break*/, 4];
                        message = messages_1[_i];
                        if (trash)
                            console.log("к обязательному удалению:", message, message.message_id, trash);
                        selectedCollection = message.from.is_bot ? collection_BotMessageHistory : collection_UserMessageHistory;
                        return [4 /*yield*/, selectedCollection.insertOne({ chatId: chatId, message: message, messageId: message.message_id, trash: trash }).catch(function (e) {
                                console.error('addToRemoveMessages error', e);
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function removeMessage(ctx, messageId, scope) {
        if (scope === void 0) { scope = 'bot'; }
        return __awaiter(this, void 0, void 0, function () {
            var chatId, selectedCollection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        console.log("removing", chatId, messageId);
                        selectedCollection = scope === 'bot' ? collection_BotMessageHistory : collection_UserMessageHistory;
                        return [4 /*yield*/, selectedCollection.deleteOne({ chatId: chatId, messageId: messageId })];
                    case 1:
                        _a.sent();
                        try {
                            bot.telegram.deleteMessage(chatId, messageId).catch(function (e) { });
                        }
                        catch (error) { }
                        return [2 /*return*/, true];
                }
            });
        });
    }
    function markAllMessagesAsTrash(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, old_msgs, usr_msgs, msgs, _i, msgs_1, old_msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        return [4 /*yield*/, collection_BotMessageHistory.find({ chatId: chatId }).toArray()];
                    case 1:
                        old_msgs = _a.sent();
                        return [4 /*yield*/, getUserMessages(ctx)];
                    case 2:
                        usr_msgs = _a.sent();
                        msgs = __spreadArray(__spreadArray([], old_msgs, true), usr_msgs, true);
                        _i = 0, msgs_1 = msgs;
                        _a.label = 3;
                    case 3:
                        if (!(_i < msgs_1.length)) return [3 /*break*/, 6];
                        old_msg = msgs_1[_i];
                        return [4 /*yield*/, addToRemoveMessages(ctx, old_msg.message, true)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function addUserMessage(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        message = ctx.message;
                        return [4 /*yield*/, collection_UserMessageHistory.insertOne({ chatId: chatId, message: message, messageId: message.message_id })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function getUserMessages(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        return [4 /*yield*/, collection_UserMessageHistory.find({ chatId: chatId }).toArray()];
                    case 1:
                        messages = _a.sent();
                        if (!messages)
                            messages = [];
                        return [2 /*return*/, messages];
                }
            });
        });
    }
    function getLastMessage(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, msgs, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        return [4 /*yield*/, collection_BotMessageHistory.find({ chatId: chatId }).sort({ messageId: -1 }).toArray()];
                    case 1:
                        msgs = _a.sent();
                        if (msgs) {
                            msg = msgs.length == 0 ? undefined : msgs[0];
                        }
                        else {
                            msg = undefined;
                        }
                        return [2 /*return*/, msg];
                }
            });
        });
    }
    function botGetMessages(ctx, count) {
        if (count === void 0) { count = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var chatId, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        return [4 /*yield*/, collection_BotMessageHistory.find({ chatId: chatId }).sort({ messageId: -1 }).limit(count).toArray()];
                    case 1:
                        messages = _a.sent();
                        if (!messages)
                            messages = [];
                        return [2 /*return*/, messages];
                }
            });
        });
    }
    /**
     * Сохранение какой-либо информации, например, отзыв
     * @param {String} type Тип данных, например, feedback
     * @param {Object} data Данные для сохранения
     */
    function _DataAdd(type, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data.type = type;
                        data.createdAt = moment();
                        data.createdAtDate = new Date();
                        return [4 /*yield*/, collection_Data.insertOne(data).catch(function (e) {
                                console.error('db _DataAdd error', e);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    }
    function _DataGet(type, query, sorting) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!sorting)
                            sorting = {};
                        query.type = type;
                        return [4 /*yield*/, collection_Data.find(query).sort(sorting).toArray()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
    function _DataUpdate(_id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_Data.updateOne({ _id: new ObjectID(_id) }, { $set: data }, { upsert: true })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
    function _Users_list() {
        return __awaiter(this, void 0, void 0, function () {
            var us;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_Users.find({}).toArray()];
                    case 1:
                        us = _a.sent();
                        if (!us)
                            us = [];
                        return [2 /*return*/, us];
                }
            });
        });
    }
    function _UserData_get(user_id) {
        return __awaiter(this, void 0, void 0, function () {
            var data, user_object, _i, data_1, d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_UserData.find({ chatId: user_id }).toArray()];
                    case 1:
                        data = _a.sent();
                        user_object = {};
                        for (_i = 0, data_1 = data; _i < data_1.length; _i++) {
                            d = data_1[_i];
                            user_object[d.name] = d.value;
                        }
                        return [2 /*return*/, user_object];
                }
            });
        });
    }
    function _UserDestroy(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _UserDataDestroy(ctx)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, collection_Users.deleteMany({ chatId: ctx.chatId })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, collection_UserMessageHistory.deleteMany({ chatId: ctx.chatId })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, collection_BotMessageHistory.deleteMany({ chatId: ctx.chatId })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function _UserDataDestroy(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_UserData.deleteMany({ chatId: ctx.chatId })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, collection_UserDataCollection.deleteMany({ chatId: ctx.chatId })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, collection_TempData.deleteMany({ chatId: ctx.chatId })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, setValue(ctx, "step", false)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function _addUserSpecialCommand(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        message = ctx.message;
                        console.log("_addUserSpecialCommand", chatId, message);
                        return [4 /*yield*/, collection_specialCommandsHistory.insertOne({ chatId: chatId, message: message, messageId: message.message_id })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function _getUserSpecialCommands(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        return [4 /*yield*/, collection_specialCommandsHistory.find({ chatId: chatId }).toArray()];
                    case 1:
                        messages = _a.sent();
                        if (!messages)
                            messages = [];
                        console.log("_getUserSpecialCommands", messages);
                        return [2 /*return*/, messages];
                }
            });
        });
    }
    function _removeSpecialCommandsExceptLastOne(ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var chatId, messages, lastMessage, _i, messages_2, message, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chatId = ctx.chatId;
                        return [4 /*yield*/, _getUserSpecialCommands(ctx)];
                    case 1:
                        messages = _a.sent();
                        lastMessage = messages[messages.length - 1];
                        console.log("_removeSpecialCommandsExceptLastOne:", messages, lastMessage);
                        _i = 0, messages_2 = messages;
                        _a.label = 2;
                    case 2:
                        if (!(_i < messages_2.length)) return [3 /*break*/, 8];
                        message = messages_2[_i];
                        if (!(message.messageId != lastMessage.messageId)) return [3 /*break*/, 7];
                        return [4 /*yield*/, collection_specialCommandsHistory.deleteOne({ chatId: chatId, messageId: message.messageId })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, ctx.telegram.deleteMessage(chatId, message.messageId)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    /**
     * Находит все сообщения пользователя и бота, которые меньше определенного времени в unix timestamp
     * @param {*} unix_lim
     */
    function findOldMessages(unix_lim) {
        return __awaiter(this, void 0, void 0, function () {
            var b, u;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, collection_BotMessageHistory.find({ "message.date": { $lte: unix_lim } }).toArray()];
                    case 1:
                        b = _a.sent();
                        return [4 /*yield*/, collection_BotMessageHistory.find({ "message.date": { $lte: unix_lim } }).toArray()];
                    case 2:
                        u = _a.sent();
                        return [2 /*return*/, __spreadArray(__spreadArray([], b, true), u, true)];
                }
            });
        });
    }
    return {
        bot: bot,
        messages: {
            bot: {
                getLastMessage: getLastMessage,
                getMessages: botGetMessages
            },
            user: {
                addUserMessage: addUserMessage,
                getUserMessages: getUserMessages,
                addUserSpecialCommand: _addUserSpecialCommand,
                getUserSpecialCommands: _getUserSpecialCommands,
                removeSpecialCommandsExceptLastOne: _removeSpecialCommandsExceptLastOne,
            },
            addToRemoveMessages: addToRemoveMessages,
            removeMessages: removeMessages,
            markAllMessagesAsTrash: markAllMessagesAsTrash,
            findOldMessages: findOldMessages
        },
        tempData: {
            add: TempDataAdd,
            get: TempDataGet,
            remove: TempDataRemove
        },
        removeMessage: removeMessage,
        setValue: setValue,
        getValue: getValue,
        removeValue: removeValue,
        data: {
            get: _DataGet,
            add: _DataAdd,
            update: _DataUpdate
        },
        users: {
            list: _Users_list
        },
        user: {
            data: {
                get: _UserData_get,
                destroy: _UserDataDestroy
            },
            destroy: _UserDestroy,
            collection: userCollection
        }
    };
});
