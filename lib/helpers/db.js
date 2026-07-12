"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
let getChatId = (ctx) => {
    if (typeof ctx === "number")
        return ctx;
    if (typeof ctx === "string")
        return Number(ctx);
    if (typeof ctx === "object")
        return Number(ctx.chatId);
    return -1;
};
exports.default = (bot, { client, collection_UserData, collection_BotMessageHistory, collection_UserMessageHistory, collection_Data, collection_Users, collection_specialCommandsHistory, collection_UserDataCollection, collection_TempData, collection_SharedData }, config) => {
    async function getValue(ctx, key) {
        let chatId = getChatId(ctx);
        let data = await collection_UserData.findOne({ chatId, name: key });
        data = data ? data.value : undefined;
        if (config.debug)
            console.log("[GET value]", key, '->', data);
        return data;
    }
    async function setValue(ctx, key, value) {
        if (config.debug)
            console.log("[SET value]", key, "=", value);
        let chatId = getChatId(ctx);
        return await collection_UserData.updateOne({ name: key, chatId }, { $set: { name: key, chatId, value } }, { upsert: true });
    }
    async function removeValue(ctx, key) {
        if (config.debug)
            console.log("[REMOVE value]", key);
        let chatId = getChatId(ctx);
        return await collection_UserData.deleteOne({ name: key, chatId });
    }
    async function TempDataAdd(chatId, messagespase, uniqid, data) {
        await collection_TempData.updateOne({ messagespase, uniqid, chatId }, { $set: { messagespase, uniqid, data, chatId } }, { upsert: true });
        if (config.debug)
            console.log("[ADD TempData]", messagespase, uniqid, data);
        return;
    }
    async function TempDataGet(messagespase, uniqid) {
        let data = await collection_TempData.findOne({ messagespase, uniqid });
        data = data ? data.data : undefined;
        if (config.debug)
            console.log("[GET TempData]", messagespase, uniqid, '->', data);
        return data;
    }
    async function TempDataRemove(messagespase) {
        if (config.debug)
            console.log("[REMOVE TempData]", messagespase);
        await collection_TempData.deleteMany({ messagespase });
        return;
    }
    function parseQuery(query = {}) {
        let new_query = Object.assign({}, query);
        if (new_query.hasOwnProperty('_id')) {
            new_query._id = new mongodb_1.ObjectId(new_query._id);
        }
        return new_query;
    }
    function userCollection(ctx, collection_name) {
        let chatId = getChatId(ctx);
        return {
            find(query = {}) {
                return collection_UserDataCollection.findOne({ collection_name, chatId, ...parseQuery(query) });
            },
            findAll(query = {}) {
                return collection_UserDataCollection.find({ collection_name, chatId, ...parseQuery(query) }).toArray();
            },
            insert(value) {
                return collection_UserDataCollection.insertOne({ collection_name, chatId, ...value });
            },
            update(query, value) {
                return collection_UserDataCollection.updateOne({ collection_name, chatId, ...parseQuery(query) }, { $set: value });
            },
            updateMany(query, value) {
                return collection_UserDataCollection.updateMany({ collection_name, chatId, ...parseQuery(query) }, { $set: value });
            },
            delete(query) {
                return collection_UserDataCollection.deleteOne({ collection_name, chatId, ...parseQuery(query) });
            },
            deleteMany(query) {
                return collection_UserDataCollection.deleteMany({ collection_name, chatId, ...parseQuery(query) });
            }
        };
    }
    async function removeMessages(ctx, onlyTrash, removeSpecialCommands = false) {
        let chatId = getChatId(ctx);
        let query = { chatId };
        let queryTrash = { chatId, trash: onlyTrash };
        let currentBotMessagesToRemove = await (await collection_BotMessageHistory.find(onlyTrash ? queryTrash : query)).toArray();
        if (config.debug)
            console.log("[removeBotMessages]", currentBotMessagesToRemove.length, "messages to remove");
        if (currentBotMessagesToRemove.length != 0) {
            for (let currentMessageToRemove of currentBotMessagesToRemove) {
                let messageId = currentMessageToRemove?.messageId;
                if (!messageId)
                    continue;
                removeMessage(ctx, messageId, 'bot');
            }
        }
        let currentUserMessagesToRemove = await (await collection_UserMessageHistory.find(onlyTrash ? queryTrash : query)).toArray();
        if (config.debug)
            console.log("[removeUserMessages]", currentUserMessagesToRemove.length, "messages to remove");
        if (currentUserMessagesToRemove.length != 0) {
            for (let currentMessageToRemove of currentUserMessagesToRemove) {
                let messageId = currentMessageToRemove?.messageId;
                if (!messageId)
                    continue;
                removeMessage(ctx, messageId, 'user');
            }
        }
        if (removeSpecialCommands && !onlyTrash) {
            let currentSpecialCommandsToRemove = await (await collection_specialCommandsHistory.find(query)).toArray();
            if (config.debug)
                console.log("[removeSpecialCommands]", currentSpecialCommandsToRemove.length, "messages to remove");
            if (currentSpecialCommandsToRemove.length != 0) {
                for (let currentMessageToRemove of currentSpecialCommandsToRemove) {
                    let messageId = currentMessageToRemove?.messageId;
                    if (!messageId)
                        continue;
                    removeMessage(ctx, messageId, 'special');
                }
            }
        }
        return;
    }
    async function addToRemoveMessages(ctx, message_or_arrayMessages, trash) {
        if (trash === undefined)
            trash = false;
        let chatId = getChatId(ctx);
        let messages = [];
        if (!Array.isArray(message_or_arrayMessages))
            message_or_arrayMessages = [message_or_arrayMessages];
        messages = message_or_arrayMessages;
        if (config.debug)
            console.log("[addToRemoveMessages]", messages);
        for (let message of messages) {
            if (trash && config.debug)
                console.log("[addToRemoveMessages] Will be deleted:", message, message.message_id, trash);
            let selectedCollection = message?.from?.is_bot ? collection_BotMessageHistory : collection_UserMessageHistory;
            await selectedCollection.insertOne({ chatId, message, messageId: message.message_id, trash }).catch(function (e) {
                console.error('addToRemoveMessages error', e);
            });
        }
    }
    async function removeMessage(ctx, messageId, scope = 'bot') {
        let chatId = getChatId(ctx);
        if (config.debug)
            console.log("[removeMessage] Removing", chatId, messageId);
        let selectedCollection;
        if (scope === 'bot')
            selectedCollection = collection_BotMessageHistory;
        if (scope === 'user')
            selectedCollection = collection_UserMessageHistory;
        if (scope === 'special')
            selectedCollection = collection_specialCommandsHistory;
        await selectedCollection.deleteOne({ chatId, messageId });
        try {
            bot.telegram.deleteMessage(chatId, messageId).catch(e => { });
        }
        catch (error) { }
        return true;
    }
    async function markAllMessagesAsTrash(ctx) {
        let chatId = getChatId(ctx);
        let old_msgs = await collection_BotMessageHistory.find({ chatId }).toArray();
        let usr_msgs = await getUserMessages(ctx);
        let msgs = [...old_msgs, ...usr_msgs];
        for (let old_msg of msgs) {
            await addToRemoveMessages(ctx, old_msg.message, true);
        }
    }
    async function addUserMessage(ctx) {
        let chatId = getChatId(ctx);
        let message = ctx.message;
        await collection_UserMessageHistory.insertOne({ chatId, message, messageId: message.message_id });
    }
    async function getUserMessages(ctx) {
        let chatId = getChatId(ctx);
        let messages = await collection_UserMessageHistory.find({ chatId }).toArray();
        if (!messages)
            messages = [];
        return messages;
    }
    async function getLastMessage(ctx) {
        let chatId = getChatId(ctx);
        let msgs = await collection_BotMessageHistory.find({ chatId }).sort({ messageId: -1 }).toArray();
        let msg;
        if (msgs) {
            msg = msgs.length == 0 ? undefined : msgs[0];
        }
        else {
            msg = undefined;
        }
        return msg;
    }
    async function botGetMessages(ctx, count = 10) {
        let chatId = getChatId(ctx);
        let messages = await collection_BotMessageHistory.find({ chatId }).sort({ messageId: -1 }).limit(count).toArray();
        if (!messages)
            messages = [];
        return messages;
    }
    /**
     * Сохранение какой-либо информации, например, отзыв
     * @param {String} type Тип данных, например, feedback
     * @param {Object} data Данные для сохранения
     */
    async function _DataAdd(type, data) {
        data.type = type;
        data.createdAt = new Date();
        data.createdAtDate = new Date();
        await collection_Data.insertOne(data).catch(function (e) {
            console.error('db _DataAdd error', e);
        });
        return true;
    }
    async function _DataGet(type, query, sorting) {
        if (!sorting)
            sorting = {};
        query.type = type;
        let result = await collection_Data.find(query).sort(sorting).toArray();
        return result;
    }
    async function _DataUpdate(_id, data) {
        let result = await collection_Data.updateOne({ _id: new mongodb_1.ObjectId(_id) }, { $set: data }, { upsert: true });
        return result;
    }
    async function _Users_list() {
        let us = await collection_Users.find({}).toArray();
        if (!us)
            us = [];
        return us;
    }
    async function _UserData_get(user_id) {
        let data = await collection_UserData.find({ chatId: user_id }).toArray();
        let user_object = {};
        for (let d of data) {
            user_object[d.name] = d.value;
        }
        return user_object;
    }
    async function _UserDestroy(ctx) {
        let chatId = getChatId(ctx);
        await _UserDataDestroy(ctx);
        await collection_Users.deleteMany({ chatId });
        await collection_UserMessageHistory.deleteMany({ chatId });
        await collection_BotMessageHistory.deleteMany({ chatId });
    }
    async function _UserDataDestroy(ctx) {
        let chatId = getChatId(ctx);
        await collection_UserData.deleteMany({ chatId });
        await collection_UserDataCollection.deleteMany({ chatId });
        await collection_TempData.deleteMany({ chatId });
        await setValue(ctx, "step", false);
    }
    async function _addUserSpecialCommand(ctx) {
        let chatId = getChatId(ctx);
        let message = ctx.message;
        if (config.debug)
            console.log("[_addUserSpecialCommand]", chatId, message);
        await collection_specialCommandsHistory.insertOne({ chatId, message, messageId: message.message_id });
    }
    async function _getUserSpecialCommands(ctx) {
        let chatId = getChatId(ctx);
        let messages = await collection_specialCommandsHistory.find({ chatId }).toArray();
        if (!messages)
            messages = [];
        if (config.debug)
            console.log("[_getUserSpecialCommands]", messages);
        return messages;
    }
    async function _removeSpecialCommandsExceptLastOne(ctx) {
        let chatId = getChatId(ctx);
        let messages = await _getUserSpecialCommands(ctx);
        let lastMessage = messages[messages.length - 1];
        if (config.debug)
            console.log("[_removeSpecialCommandsExceptLastOne]:", messages, lastMessage);
        for (let message of messages) {
            if (message.messageId != lastMessage.messageId) {
                await collection_specialCommandsHistory.deleteOne({ chatId, messageId: message.messageId });
                try {
                    await ctx.telegram.deleteMessage(chatId, message.messageId);
                }
                catch (error) { }
            }
        }
    }
    /**
     * Находит все сообщения пользователя и бота, которые меньше определенного времени в unix timestamp
     * @param {*} unix_lim
     */
    async function findOldMessages(unix_lim, withSpecialCommands = false) {
        let b = await collection_BotMessageHistory.find({ "message.date": { $lte: unix_lim } }).toArray();
        let u = await collection_UserMessageHistory.find({ "message.date": { $lte: unix_lim } }).toArray();
        let uc = [];
        if (withSpecialCommands)
            uc = await collection_specialCommandsHistory.find({ "message.date": { $lte: unix_lim } }).toArray();
        return [...b, ...u, ...uc];
    }
    return {
        bot,
        client,
        messages: {
            bot: {
                getLastMessage,
                getMessages: botGetMessages
            },
            user: {
                addUserMessage,
                getUserMessages,
                addUserSpecialCommand: _addUserSpecialCommand,
                getUserSpecialCommands: _getUserSpecialCommands,
                removeSpecialCommandsExceptLastOne: _removeSpecialCommandsExceptLastOne,
            },
            addToRemoveMessages,
            removeMessages,
            markAllMessagesAsTrash,
            findOldMessages
        },
        tempData: {
            add: TempDataAdd,
            get: TempDataGet,
            remove: TempDataRemove
        },
        removeMessage,
        setValue,
        getValue,
        removeValue,
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
        },
        collections: {
            botMessageHistory: collection_BotMessageHistory,
            userMessageHistory: collection_UserMessageHistory,
            specialCommandsHistory: collection_specialCommandsHistory,
            users: collection_Users,
            userData: collection_UserData,
            userDataCollection: collection_UserDataCollection,
            tempData: collection_TempData,
            data: collection_Data,
            sharedData: collection_SharedData
        }
    };
};
//# sourceMappingURL=db.js.map