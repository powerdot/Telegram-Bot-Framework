import { TBFContext, TelegramMessage, DB, tt, DatabaseMessage, MongoDataBase, Telegraf } from "../types"

let moment = require("moment");
let ObjectID = require('mongodb').ObjectID;

export default (
  bot: Telegraf<TBFContext>,
  { client,
    collection_UserData,
    collection_BotMessageHistory,
    collection_UserMessageHistory,
    collection_Data,
    collection_Users,
    collection_specialCommandsHistory,
    collection_UserDataCollection,
    collection_TempData,
  }: MongoDataBase): DB => {

  async function getValue(ctx: TBFContext, key: string) {
    let data = await collection_UserData.findOne({ chatId: ctx.chatId, name: key });
    data = data ? data.value : undefined;
    console.log("[GET value]", key, '->', data);
    return data;
  }

  async function setValue(ctx: TBFContext, key: string, value: any) {
    console.log("[SET value]", key, "=", value)
    return await collection_UserData.updateOne({ name: key, chatId: ctx.chatId }, { $set: { name: key, chatId: ctx.chatId, value } }, { upsert: true });
  }

  async function removeValue(ctx: TBFContext, key: string) {
    console.log("[REMOVE value]", key);
    return await collection_UserData.deleteOne({ name: key, chatId: ctx.chatId });
  }

  async function TempDataAdd(chatId: number, messagespase: string, uniqid: string, data: any) {
    await collection_TempData.updateOne({ messagespase, uniqid, chatId }, { $set: { messagespase, uniqid, data, chatId } }, { upsert: true });
    console.log("[ADD TempData]", messagespase, uniqid, data);
    return;
  }

  async function TempDataGet(messagespase: string, uniqid: string) {
    let data = await collection_TempData.findOne({ messagespase, uniqid });
    data = data ? data.data : undefined;
    console.log("[GET TempData]", messagespase, uniqid, '->', data);
    return data;
  }

  async function TempDataRemove(messagespase: string) {
    console.log("[REMOVE TempData]", messagespase);
    await collection_TempData.deleteMany({ messagespase });
    return;
  }

  function parseQuery(query: { _id?: any } = {}) {
    let new_query = Object.assign({}, query);
    if (new_query.hasOwnProperty('_id')) {
      new_query._id = ObjectID(new_query._id);
    }
    return new_query;
  }

  function userCollection(ctx: TBFContext, collection_name: string) {
    return {
      find(query: object = {}) {
        return collection_UserDataCollection.findOne({ collection_name, chatId: ctx.chatId, ...parseQuery(query) });
      },
      findAll(query: object = {}) {
        return collection_UserDataCollection.find({ collection_name, chatId: ctx.chatId, ...parseQuery(query) }).toArray();
      },
      insert(value: object) {
        return collection_UserDataCollection.insertOne({ collection_name, chatId: ctx.chatId, ...value });
      },
      update(query: object, value: object) {
        return collection_UserDataCollection.updateOne({ collection_name, chatId: ctx.chatId, ...parseQuery(query) }, { $set: value });
      },
      updateMany(query: object, value: object) {
        return collection_UserDataCollection.updateMany({ collection_name, chatId: ctx.chatId, ...parseQuery(query) }, { $set: value });
      },
      delete(query: object) {
        return collection_UserDataCollection.deleteOne({ collection_name, chatId: ctx.chatId, ...parseQuery(query) });
      },
      deleteMany(query: object) {
        return collection_UserDataCollection.deleteMany({ collection_name, chatId: ctx.chatId, ...parseQuery(query) });
      }
    }
  }

  async function removeMessages(ctx: TBFContext, onlyTrash: boolean) {
    let chatId = ctx.chatId;
    let query = { chatId };
    let queryTrash = { chatId, trash: onlyTrash };
    let currentBotMessagesToRemove: (DatabaseMessage)[] = await (await collection_BotMessageHistory.find<DatabaseMessage>(onlyTrash ? queryTrash : query)).toArray();
    console.log("[removeBotMessages]", currentBotMessagesToRemove.length, "messages to remove");
    // console.log("currentMessagesToRemove:", currentMessagesToRemove);
    if (currentBotMessagesToRemove.length != 0) {
      for (let currentMessageToRemove of currentBotMessagesToRemove) {
        let messageId = currentMessageToRemove?.messageId;
        if (!messageId) continue;
        removeMessage(ctx, messageId, 'bot')
      }
    }
    let currentUserMessagesToRemove: DatabaseMessage[] = await (await collection_UserMessageHistory.find<DatabaseMessage>(onlyTrash ? queryTrash : query)).toArray();
    console.log("[removeUserMessages]", currentUserMessagesToRemove.length, "messages to remove");
    if (currentUserMessagesToRemove.length != 0) {
      for (let currentMessageToRemove of currentUserMessagesToRemove) {
        let messageId = currentMessageToRemove.messageId;
        if (!messageId) continue;
        removeMessage(ctx, messageId, 'user')
      }
    }
    return;
  }

  async function addToRemoveMessages(ctx: TBFContext, message_or_arrayMessages: tt.Message | tt.Message[], trash: boolean) {
    if (trash === undefined) trash = false;
    let chatId = ctx.chatId;
    let messages: TelegramMessage[] = [];
    if (!Array.isArray(message_or_arrayMessages)) message_or_arrayMessages = [message_or_arrayMessages];
    messages = message_or_arrayMessages;
    console.log("[addToRemoveMessages]", messages);
    for (let message of messages) {
      if (trash) console.log("к обязательному удалению:", message, message.message_id, trash);
      let selectedCollection = message.from.is_bot ? collection_BotMessageHistory : collection_UserMessageHistory;
      await selectedCollection.insertOne({ chatId, message, messageId: message.message_id, trash } as DatabaseMessage).catch(function (e) {
        console.error('addToRemoveMessages error', e)
      });
    }
  }

  async function removeMessage(ctx: TBFContext, messageId: number, scope = 'bot') {
    let chatId = ctx.chatId;
    console.log("removing", chatId, messageId)
    let selectedCollection = scope === 'bot' ? collection_BotMessageHistory : collection_UserMessageHistory;
    await selectedCollection.deleteOne({ chatId, messageId });
    try {
      bot.telegram.deleteMessage(chatId, messageId).catch(e => { });
    } catch (error) { }
    return true;
  }

  async function markAllMessagesAsTrash(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let old_msgs: DatabaseMessage[] = await collection_BotMessageHistory.find<DatabaseMessage>({ chatId }).toArray();
    let usr_msgs = await getUserMessages(ctx);
    let msgs = [...old_msgs, ...usr_msgs];
    for (let old_msg of msgs) {
      await addToRemoveMessages(ctx, old_msg.message, true);
    }
  }

  async function addUserMessage(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let message = ctx.message
    await collection_UserMessageHistory.insertOne({ chatId, message, messageId: message.message_id } as DatabaseMessage);
  }

  async function getUserMessages(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let messages: DatabaseMessage[] = await collection_UserMessageHistory.find<DatabaseMessage>({ chatId }).toArray();
    if (!messages) messages = [];
    return messages;
  }

  async function getLastMessage(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let msgs: DatabaseMessage[] = await collection_BotMessageHistory.find<DatabaseMessage>({ chatId }).sort({ messageId: -1 }).toArray();
    let msg: DatabaseMessage;
    if (msgs) {
      msg = msgs.length == 0 ? undefined : msgs[0];
    } else {
      msg = undefined;
    }
    return msg;
  }

  async function botGetMessages(ctx: TBFContext, count: number = 10) {
    let chatId = ctx.chatId;
    let messages: DatabaseMessage[] = await collection_BotMessageHistory.find<DatabaseMessage>({ chatId }).sort({ messageId: -1 }).limit(count).toArray();
    if (!messages) messages = [];
    return messages;
  }


  /**
   * Сохранение какой-либо информации, например, отзыв
   * @param {String} type Тип данных, например, feedback
   * @param {Object} data Данные для сохранения
   */
  async function _DataAdd(type: string, data: any) {
    data.type = type;
    data.createdAt = moment();
    data.createdAtDate = new Date();
    await collection_Data.insertOne(data).catch(function (e) {
      console.error('db _DataAdd error', e)
    });
    return true;
  }

  async function _DataGet(type: string, query: any, sorting: any) {
    if (!sorting) sorting = {};
    query.type = type;
    let result = await collection_Data.find(query).sort(sorting).toArray();
    return result;
  }

  async function _DataUpdate(_id: string, data: any) {
    // console.log("_DataUpdate:",_id, data);
    let result = await collection_Data.updateOne({ _id: new ObjectID(_id) }, { $set: data }, { upsert: true });
    return result;
  }

  async function _Users_list() {
    let us = await collection_Users.find({}).toArray();
    if (!us) us = [];
    return us;
  }

  async function _UserData_get(user_id: number) {
    let data = await collection_UserData.find({ chatId: user_id }).toArray();
    let user_object = {};
    for (let d of data) {
      user_object[d.name] = d.value;
    }
    return user_object;
  }

  async function _UserDestroy(ctx: TBFContext) {
    await _UserDataDestroy(ctx)
    await collection_Users.deleteMany({ chatId: ctx.chatId });
    await collection_UserMessageHistory.deleteMany({ chatId: ctx.chatId });
    await collection_BotMessageHistory.deleteMany({ chatId: ctx.chatId });
  }

  async function _UserDataDestroy(ctx: TBFContext) {
    await collection_UserData.deleteMany({ chatId: ctx.chatId });
    await collection_UserDataCollection.deleteMany({ chatId: ctx.chatId });
    await collection_TempData.deleteMany({ chatId: ctx.chatId });
    await setValue(ctx, "step", false);
  }

  async function _addUserSpecialCommand(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let message = ctx.message
    console.log("_addUserSpecialCommand", chatId, message);
    await collection_specialCommandsHistory.insertOne({ chatId, message, messageId: message.message_id } as DatabaseMessage);
  }

  async function _getUserSpecialCommands(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let messages: DatabaseMessage[] = await collection_specialCommandsHistory.find<DatabaseMessage>({ chatId }).toArray();
    if (!messages) messages = [];
    console.log("_getUserSpecialCommands", messages);
    return messages;
  }

  async function _removeSpecialCommandsExceptLastOne(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let messages = await _getUserSpecialCommands(ctx);
    let lastMessage = messages[messages.length - 1];
    console.log("_removeSpecialCommandsExceptLastOne:", messages, lastMessage);
    for (let message of messages) {
      if (message.messageId != lastMessage.messageId) {
        await collection_specialCommandsHistory.deleteOne({ chatId, messageId: message.messageId });
        try {
          await ctx.telegram.deleteMessage(chatId, message.messageId);
        } catch (error) { }
      }
    }
  }


  /**
   * Находит все сообщения пользователя и бота, которые меньше определенного времени в unix timestamp
   * @param {*} unix_lim 
   */
  async function findOldMessages(unix_lim: number) {
    let b: DatabaseMessage[] = await collection_BotMessageHistory.find<DatabaseMessage>({ "message.date": { $lte: unix_lim } }).toArray();
    let u: DatabaseMessage[] = await collection_BotMessageHistory.find<DatabaseMessage>({ "message.date": { $lte: unix_lim } }).toArray();
    return [...b, ...u];
  }

  return {
    bot,
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
    }
  }
}