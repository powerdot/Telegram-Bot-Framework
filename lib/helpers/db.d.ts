import { TBFContext, DB, MongoDataBase, Telegraf, TBFConfig } from "../types";
declare const _default: (bot: Telegraf<TBFContext>, { client, collection_UserData, collection_BotMessageHistory, collection_UserMessageHistory, collection_Data, collection_Users, collection_specialCommandsHistory, collection_UserDataCollection, collection_TempData, }: MongoDataBase, config: TBFConfig) => DB;
export default _default;
