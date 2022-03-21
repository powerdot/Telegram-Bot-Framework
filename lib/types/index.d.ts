import { Telegraf, Markup, Context as TelegrafContext } from 'telegraf';
import { Application as ExpressApp } from "express"
import * as tt from 'telegraf/typings/telegram-types';

type TelegramMessage = tt.Message;

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
    chatId?: number | null
    routeTo?: string
    routing: {
        type: string
        page?: string
        action?: string
        data?: string
        step?: string
        next_step?: string
        message?: TelegramMessage
        messageTypes: Array<string>
        isMessageFromUser: boolean
    }
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
    goToPage: (page: string, action?: string) => Promise<any>;
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
    textHandler?: PageActionTextHandler | {
        clearChat?: boolean;
        handler: PageActionTextHandler;
    }
}

interface Page {
    id: string;
    name: string;
    actions: {
        "main": PageAction;
        [key: string]: PageAction;
    },
    onCallbackQuery?: (ctx: TBFContext) => Promise<any>
    onMessage?: (ctx: TBFContext) => Promise<any>
    ctx?: TBFContext
    call?: (ctx: TBFContext) => Promise<any>
    onOpen?: (ctx: TBFContext) => Promise<any>,
    open?: (ctx: TBFContext) => Promise<any>,
}


type PageExportArg = {
    db?: DB;
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
    collection_Users: MongoCollection,
    collection_specialCommandsHistory: MongoCollection,
}

interface StartupChainInstances {
    bot: Telegraf<TBFContext>;
    database: MongoDataBase;
    app: ExpressApp | undefined;
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
            addUserSpecialCommand: (ctx: TBFContext) => Promise<any>;
            getUserSpecialCommands: (ctx: TBFContext) => Promise<any>;
            removeSpecialCommandsExceptLastOne: (ctx: TBFContext) => Promise<any>;
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
            get: (chatId: number) => Promise<any>,
            destroy: (ctx: TBFContext) => Promise<any>,
        },
        destroy: (ctx: TBFContext) => Promise<any>,
    }
}


interface PaginatorReturn {
    list: () => Array<{ module: any, path: string }>
    route: (page_id: string, to: string) => string
}

interface TBFPromiseReturn {
    bot: Telegraf<TBFContext>;
    app: ExpressApp;
    database: MongoDataBase;
    db: DB;
    pages: Page[],
    openPage: (arg: { ctx: TBFContext, pageId: string }) => Promise<Error | boolean>;
}

interface TBFConfig {
    pages?: {
        path: string;
    }
    autoRemoveMessages?: boolean;
    debug?: boolean;
}

interface TBFArgs {
    telegram: {
        token: string;
        apiUrl?: string;
    }
    webServer?: {
        address: string;
        port: number | string;
        module?: any;
    },
    mongo?: {
        url: string;
        dbName: string;
    },
    config?: TBFConfig
}

interface TBF {
    create: (arg?: TBFArgs) => Promise<TBFPromiseReturn>
}

interface WebServerArgs {
    bot: Telegraf<TBFContext>;
    database: MongoDataBase;
    db: DB;
    pages: Page[]
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
    PageActionHandler,
    MessageButtons,
    PageActionData,
    StartupChainInstances,
    DB,
    PaginatorReturn,
    TBF,
    TBFPromiseReturn,
    WebServerArgs,
    TelegramMessage,
    TBFArgs,
    TBFConfig
}