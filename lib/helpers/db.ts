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
  const TokenGenerator = require('uuid-token-generator');
  const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);
  let moment = require("moment");
  let ObjectID = require('mongodb').ObjectID;


  async function getValue(ctx, key) {
    let data = await collection_UserData.findOne({ chatId: helpers.getChatId(ctx), name: key });
    data = data ? data.value : false;
    console.log("[GET value]", key, '->', data);
    return data;
  }

  async function setValue(ctx, key, value) {
    console.log("[SET value]", key, "=", value)
    return await collection_UserData.updateOne({ name: key, chatId: helpers.getChatId(ctx) }, { $set: { name: key, chatId: helpers.getChatId(ctx), value } }, { upsert: true });
  }

  async function removeValue(ctx, key) {
    return await collection_UserData.remove({ name: key, chatId: helpers.getChatId(ctx) });
  }

  async function removeMessages(ctx, onlyTrash) {
    let chatId = helpers.getChatId(ctx);
    let query = { chatId };
    let queryTrash = { chatId, trash: onlyTrash };
    let currentMessagesToRemove = await (await collection_BotMessageHistory.find(onlyTrash ? queryTrash : query)).toArray();
    // console.log("currentMessagesToRemove:", currentMessagesToRemove);
    if (currentMessagesToRemove.length == 0) return;
    for (let currentMessageToRemove of currentMessagesToRemove) {
      let messageId = currentMessageToRemove.messageId;
      if (!messageId) continue;
      //console.log("removing", messageId)
      try {
        bot.telegram.deleteMessage(chatId, messageId).catch(e => { });
      } catch (error) {
        // console.error("error deleting messageId:", chatId, messageId)
      }
      collection_BotMessageHistory.deleteOne({ chatId, messageId });
      collection_UserMessageHistory.deleteOne({ chatId, messageId });
    }
    return;
  }

  async function addToRemoveMessages(ctx, message_or_arrayMessages, trash) {
    if (trash === undefined) trash = false;
    let chatId = helpers.getChatId(ctx);
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

  async function markAllMessagesAsTrash(ctx) {
    let chatId = helpers.getChatId(ctx);
    let old_msgs = await collection_BotMessageHistory.find({ chatId }).toArray();
    let usr_msgs = await getUserMessages(ctx);
    let msgs = [...old_msgs, ...usr_msgs];
    for (let old_msg of msgs) {
      await addToRemoveMessages(chatId, old_msg.message, true);
    }
  }

  async function addUserMessage(ctx) {
    let chatId = helpers.getChatId(ctx);
    let message = ctx.update.message
    await collection_UserMessageHistory.insertOne({ chatId, message, messageId: message.message_id });
  }

  async function getUserMessages(ctx) {
    let chatId = helpers.getChatId(ctx);
    let messages = await collection_UserMessageHistory.find({ chatId }).toArray();
    if (!messages) messages = [];
    return messages;
  }

  async function getLastMessage(ctx) {
    let chatId = helpers.getChatId(ctx);
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
   * Создание токена, который хранит в себе данные
   * @param {Object} data Данные, сохраняемые за токеном
   * @returns Token ID
   */
  async function _webService_setDataToken(data, removeOldTokens) {
    let new_token_id = tokgen.generate();
    data.token_id = new_token_id;
    data.createdAt = moment();
    if (removeOldTokens) await collection_WebSerciveSecureTokens.remove({ user_id: data.user_id, createdAt: { $lte: moment().add(-1, 'minute') } });
    await collection_WebSerciveSecureTokens.insertOne(data).catch(function (e) {
      console.error('_webService_setDataToken error', e)
    });
    // console.log("> token created", new_token_id);

    return new_token_id;
  }

  async function _webService_getLastUserToken(ctx) {
    let user_id = helpers.getChatId(ctx);
    let f = await collection_WebSerciveSecureTokens.find({ user_id }).sort({ _id: -1 }).limit(1).toArray();
    return f.length == 0 ? false : f[0].token_id;
  }

  async function _webService_removeUserTokens(ctx) {
    let user_id = helpers.getChatId(ctx);
    await collection_WebSerciveSecureTokens.remove({ user_id });
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

  async function _Users_setGroup(user_id, group) {
    user_id = helpers.getChatId(user_id);
    let u = await collection_Users.findOne({ user_id });
    if (!u) {
      await collection_Users.insertOne({ user_id, group });
    } else {
      await collection_Users.updateOne({ user_id }, { $set: { group } }, { upsert: true });
    }
  }
  async function _Users_getGroup(user_id) {
    user_id = helpers.getChatId(user_id);
    if (config.admins[user_id]) return config.admins[user_id];
    let u = await collection_Users.findOne({ user_id });
    // console.log("u:",user_id,u)
    if (!u) return 'main';
    if (!u.group) u.group = "main";
    if (u.group == "") u.group = "main";
    return u.group;
  }
  async function _Users_getByGroup(group) {
    let us = await collection_Users.find({ group }).toArray();
    if (!us) us = [];
    return us;
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

  async function _UserDestroy(user_id) {
    await collection_Users.remove({ user_id });
    await collection_UserData.remove({ user_id });
    await collection_UserMessageHistory.remove({ user_id });
    await collection_BotMessageHistory.remove({ user_id });
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
      },
      destroy: _UserDestroy
    }
  }
}