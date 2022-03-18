import { Telegraf, Markup, Context as TelegrafContext } from 'telegraf';
import { Application as ExpressApp } from "express"

type CallbackPathRoute = {
    route: string;
    action: string;
    data: string;
}

type CallbackPath = {
    current: CallbackPathRoute,
    all: Array<CallbackPathRoute>,
    next: string | false
}

interface TBFContext extends TelegrafContext {
    CallbackPath?: CallbackPath | false
    updateSubTypes?: Array<string>
    chat_id?: number | null
    routeTo?: string
}

type PageActionArg = {
    ctx: TBFContext;
    data?: PageActionData;
    text?: string;
}

type ButtonsRowButton = {
    text: string;
    action?: string | Function;
    page?: string;
    data?: PageActionData;
}
type ButtonsRow = Array<ButtonsRowButton>
type MessageButtons = Array<ButtonsRow>

type PageActionData = string | number | object | Array<any> | boolean;

type KeyboardRowButton = {
    text: string;
}
type KeyboardRow = Array<KeyboardRowButton>
type Keyboard = Array<KeyboardRow>

type PageActionHandlerThisSendArg = { text: string, buttons?: MessageButtons, keyboard?: Keyboard }

interface PageActionHandlerThisMethods {
    id: string;
    send: (arg: PageActionHandlerThisSendArg) => Promise<any>;
    update: (arg: PageActionHandlerThisSendArg) => Promise<any>;
    goToAction: (action: string) => Promise<any>;
    goToPage: (page: string, action: string) => Promise<any>;
    clearChat: () => Promise<any>;
    user: (arg?: { user_id }) => {
        get: () => Promise<Object>;
        list: () => Promise<any>;
        getValue: (key: string) => Promise<any>;
        setValue: (key: string, value: any) => Promise<any>;
        removeValue: (key: string) => Promise<any>;
        destroy: () => Promise<any>;
    }
}

type PageActionHandlerThis = {
    ctx: TBFContext;
} & PageActionHandlerThisMethods;

interface PageActionTextHandler {
    (this: PageActionHandlerThis, arg: PageActionArg): any;
    clearChat?: boolean;
}

interface PageActionHandler {
    (this: PageActionHandlerThis, arg: PageActionArg): any;
    clearChat?: boolean;
    textHandler?: PageActionTextHandler;
}

type PageAction = PageActionHandler | {
    clearChat?: boolean;
    handler: PageActionHandler;
    textHandler?: PageActionTextHandler;
}

interface Page {
    id: string;
    name: string;
    requirements: Array<string>;
    actions: {
        "main": PageAction;
        [key: string]: PageAction;
    },
    onCallbackQuery?: (ctx: TBFContext) => Promise<any>
    onMessage?: (ctx: TBFContext) => Promise<any>
    ctx?: TBFContext
    call?: (ctx: TBFContext) => Promise<any>
    trigger?: (ctx: TBFContext) => Promise<any>
    onOpen?: (ctx: TBFContext) => Promise<any>
}


type PageExportArg = {
    db?: any;
    config?: any;
    paginator?: any;
}

interface PageExport {
    (arg: PageExportArg): Page;
}


import { MongoClient, Collection as MongoCollection } from 'mongodb/mongodb';
interface MongoDataBase {
    client: MongoClient,
    collection_UserData: MongoCollection,
    collection_BotMessageHistory: MongoCollection,
    collection_UserMessageHistory: MongoCollection,
    collection_Data: MongoCollection,
    collection_Users: MongoCollection
}

interface StartupChainInstances {
    bot: Telegraf<TBFContext>;
    database: MongoDataBase;
    app: ExpressApp;
}

interface DB {
    bot: Telegraf<TBFContext>,
    messages: {
        bot: {
            getLastMessage: (ctx: TBFContext) => Promise<any>;
        },
        user: {
            addUserMessage: (ctx: TBFContext, message?: any) => Promise<any>;
            getUserMessages: (ctx: TBFContext) => Promise<any>;
        },
        addToRemoveMessages: (ctx: TBFContext, message_or_arrayMessages: Array<object> | object, trash?: boolean | undefined) => Promise<any>;
        removeMessages: (ctx: TBFContext, onlyTrash?: boolean | undefined) => Promise<any>;
        markAllMessagesAsTrash: (ctx: TBFContext) => Promise<any>,
        findOldMessages: (unix_lim: number) => Promise<any>;
    },

    setValue: (ctx: TBFContext, key: string, value: any) => Promise<any>,
    getValue: (ctx: TBFContext, key: string) => Promise<any>,
    removeValue: (ctx: TBFContext, key: string) => Promise<any>,

    data: {
        get: (type: any, query: any, sorting: any) => Promise<any>,
        add: (type: any, data: any) => Promise<any>,
        update: (_id: any, data: any) => Promise<any>,
    },
    users: {
        list: () => Promise<any>,
    },
    user: {
        data: {
            get: (user_id: number) => Promise<any>,
        },
        destroy: (user_id: number) => Promise<any>,
    }
}
export {
    Telegraf,
    Markup,
    TelegrafContext,
    TBFContext,
    CallbackPath,
    CallbackPathRoute,
    Page,
    PageExport,
    MongoDataBase,
    PageActionHandlerThis,
    MessageButtons,
    PageActionData,
    StartupChainInstances,
    DB
}