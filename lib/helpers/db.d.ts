import { TBFContext, DB, MongoDataBase, Telegraf } from "../types";
declare const _default: (bot: Telegraf<TBFContext>, { client, collection_UserData, collection_BotMessageHistory, collection_UserMessageHistory, collection_Data, collection_Users, collection_specialCommandsHistory, collection_UserDataCollection, collection_TempData, }: MongoDataBase) => DB;
export default _default;
