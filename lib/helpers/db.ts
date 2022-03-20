import type { TBFContext } from "../types"

module.exports = (
  bot,
  { client,
    collection_UserData,
    collection_BotMessageHistory,
    collection_UserMessageHistory,
    collection_WebSerciveSecureTokens,
    collection_Data,
    collection_Users
  }) => {
  const config = require('../../config.js');
  let helpers = require("./index");
  let moment = require("moment");
  let ObjectID = require('mongodb').ObjectID;

  async function getValue(ctx: TBFContext, key) {
    let data = await collection_UserData.findOne({ chatId: ctx.chatId, name: key });
    data = data ? data.value : false;
    console.log("[GET value]", key, '->', data);
    return data;
  }

  async function setValue(ctx: TBFContext, key, value) {
    console.log("[SET value]", key, "=", value)
    return await collection_UserData.updateOne({ name: key, chatId: ctx.chatId }, { $set: { name: key, chatId: ctx.chatId, value } }, { upsert: true });
  }

  async function removeValue(ctx: TBFContext, key) {
    return await collection_UserData.remove({ name: key, chatId: ctx.chatId });
  }

  async function removeMessages(ctx: TBFContext, onlyTrash) {
    let chatId = ctx.chatId;
    let query = { chatId };
    let queryTrash = { chatId, trash: onlyTrash };
    let currentBotMessagesToRemove = await (await collection_BotMessageHistory.find(onlyTrash ? queryTrash : query)).toArray();
    console.log("[removeBotMessages]", currentBotMessagesToRemove.length, "messages to remove");
    // console.log("currentMessagesToRemove:", currentMessagesToRemove);
    if (currentBotMessagesToRemove.length != 0) {
      for (let currentMessageToRemove of currentBotMessagesToRemove) {
        let messageId = currentMessageToRemove.messageId;
        if (!messageId) continue;
        console.log("removing", messageId)
        try {
          bot.telegram.deleteMessage(chatId, messageId).catch(e => { });
        } catch (error) {
          // console.error("error deleting messageId:", chatId, messageId)
        }
        collection_BotMessageHistory.deleteOne({ chatId, messageId });
      }
    }
    let currentUserMessagesToRemove = await (await collection_UserMessageHistory.find(onlyTrash ? queryTrash : query)).toArray();
    console.log("[removeUserMessages]", currentUserMessagesToRemove.length, "messages to remove");
    if (currentUserMessagesToRemove.length != 0) {
      for (let currentMessageToRemove of currentUserMessagesToRemove) {
        let messageId = currentMessageToRemove.messageId;
        if (!messageId) continue;
        console.log("removing", messageId)
        try {
          bot.telegram.deleteMessage(chatId, messageId).catch(e => { });
        } catch (error) {
          // console.error("error deleting messageId:", chatId, messageId)
        }
        collection_UserMessageHistory.deleteOne({ chatId, messageId });
      }
    }
    return;
  }

  async function addToRemoveMessages(ctx: TBFContext, message_or_arrayMessages, trash) {
    if (trash === undefined) trash = false;
    let chatId = ctx.chatId;
    let messages = [];
    if (!Array.isArray(message_or_arrayMessages)) message_or_arrayMessages = [message_or_arrayMessages];
    messages = message_or_arrayMessages;
    for (let message of messages) {
      if (trash) console.log("к обязательному удалению:", message.message_id, trash)
      await collection_BotMessageHistory.insertOne({ chatId, message, messageId: message.message_id, trash }).catch(function (e) {
        console.error('addToRemoveMessages error', e)
      });
    }
  }

  async function markAllMessagesAsTrash(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let old_msgs = await collection_BotMessageHistory.find({ chatId }).toArray();
    let usr_msgs = await getUserMessages(ctx);
    let msgs = [...old_msgs, ...usr_msgs];
    for (let old_msg of msgs) {
      await addToRemoveMessages(ctx, old_msg.message, true);
    }
  }

  async function addUserMessage(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let message = ctx.update.message
    await collection_UserMessageHistory.insertOne({ chatId, message, messageId: message.message_id });
  }

  async function getUserMessages(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let messages = await collection_UserMessageHistory.find({ chatId }).toArray();
    if (!messages) messages = [];
    return messages;
  }

  async function getLastMessage(ctx: TBFContext) {
    let chatId = ctx.chatId;
    let msg = await collection_BotMessageHistory.find({ chatId }).sort({ messageId: -1 }).toArray();
    if (msg) {
      msg = msg.length == 0 ? false : msg[0];
    } else {
      msg = false;
    }
    return msg;
  }

  async function _webService_getDataFromToken(token_id) {
    return await collection_WebSerciveSecureTokens.findOne({ token_id })
  }



  /**
   * Сохранение какой-либо информации, например, отзыв
   * @param {String} type Тип данных, например, feedback
   * @param {Object} data Данные для сохранения
   */
  async function _DataAdd(type, data) {
    data.type = type;
    data.createdAt = moment();
    data.createdAtDate = new Date();
    await collection_Data.insertOne(data).catch(function (e) {
      console.error('db _DataAdd error', e)
    });
    return true;
  }

  async function _DataGet(type, query, sorting) {
    if (!sorting) sorting = {};
    query.type = type;
    let result = await collection_Data.find(query).sort(sorting).toArray();
    return result;
  }

  async function _DataUpdate(_id, data) {
    // console.log("_DataUpdate:",_id, data);
    let result = await collection_Data.updateOne({ _id: new ObjectID(_id) }, { $set: data }, { upsert: true });
    return result;
  }

  async function _Users_list() {
    let us = await collection_Users.find({}).toArray();
    if (!us) us = [];
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

  async function _UserDestroy(ctx: TBFContext) {
    await _UserDataDestroy(ctx)
    await collection_Users.deleteMany({ chatId: ctx.chatId });
    await collection_UserMessageHistory.deleteMany({ chatId: ctx.chatId });
    await collection_BotMessageHistory.deleteMany({ chatId: ctx.chatId });
  }

  async function _UserDataDestroy(ctx: TBFContext) {
    await collection_UserData.deleteMany({ chatId: ctx.chatId });
    await setValue(ctx, "next_step", false);
    await setValue(ctx, "step", false);
  }

  /**
   * Находит все сообщения пользователя и бота, которые меньше определенного времени в unix timestamp
   * @param {*} unix_lim 
   */
  async function findOldMessages(unix_lim) {
    let b = await collection_BotMessageHistory.find({ "message.date": { $lte: unix_lim } }).toArray();
    let u = await collection_BotMessageHistory.find({ "message.date": { $lte: unix_lim } }).toArray();
    return [...b, ...u];
  }

  return {
    bot,
    messages: {
      bot: {
        getLastMessage
      },
      user: {
        addUserMessage,
        getUserMessages
      },
      addToRemoveMessages,
      removeMessages,
      markAllMessagesAsTrash,
      findOldMessages
    },

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
      destroy: _UserDestroy
    }
  }
}