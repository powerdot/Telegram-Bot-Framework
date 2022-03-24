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
    photo?: tt.MessagePhoto;
    video?: tt.Video;
    animation?: tt.Animation;
    document?: tt.Document;
    voice?: tt.Voice;
    audio?: tt.Audio;
    poll?: tt.Poll;
    sticker?: tt.Sticker;
    location?: tt.Location;
    contact?: tt.Contact;
    venue?: tt.Venue;
    game?: tt.Game;
    invoice?: tt.Invoice;
    dice?: tt.Dice;
}

type ButtonsRowButton = {
    text: string;
    action?: string | Function;
    page?: string;
    data?: PageActionData;
    url?: string;
}
type ButtonsRow = Array<ButtonsRowButton>
type MessageButtons = Array<ButtonsRow>

type PageActionData = string | number | { [key: string]: any; } | Array<any> | boolean;

type KeyboardRowButton = {
    text: string;
    request_location?: boolean;
    request_contact?: boolean;
}
type KeyboardRow = Array<KeyboardRowButton>
type Keyboard = Array<KeyboardRow>

type PageActionHandlerThisSendArg = {
    text?: string,
    images?: Array<string>,
    buttons?: MessageButtons,
    keyboard?: Keyboard
}

type PageActionHandlerThisUpdateArg = {
    text?: string,
    buttons?: MessageButtons,
    keyboard?: Keyboard
}

type goToData = any;

interface PageActionHandlerThisMethods {
    id: string;
    send: (arg: PageActionHandlerThisSendArg) => Promise<any>;
    update: (arg: PageActionHandlerThisUpdateArg) => Promise<any>;
    goToAction: (arg: { action: string, data?: goToData }) => Promise<any>;
    goToPage: (arg: { page: string, action?: string, data?: goToData }) => Promise<any>;
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

interface PageActionMessageHandler {
    (this: PageActionHandlerThis, arg: PageActionArg): any;
    clearChat?: boolean;
}

interface PageActionHandler {
    (this: PageActionHandlerThis, arg: PageActionArg): any;
    clearChat?: boolean;
    messageHandler?: PageActionMessageHandler;
}

type PageAction = PageActionHandler | {
    clearChat?: boolean;
    handler: PageActionHandler;
    messageHandler?: PageActionMessageHandler | {
        clearChat?: boolean;
        handler: PageActionMessageHandler;
    }
}

interface Page {
    id: string;
    name?: string;
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
    parseButtons?: any;
}

interface PageExport {
    (arg: PageExportArg): Page;
}


import { MongoClient, Collection as MongoCollection, FindCursor, WithId, Document, InsertOneResult, UpdateResult, DeleteResult } from 'mongodb/mongodb';
import { Message } from 'typegram';
interface MongoDataBase {
    client: MongoClient,
    collection_UserData: MongoCollection,
    collection_BotMessageHistory: MongoCollection,
    collection_UserMessageHistory: MongoCollection,
    collection_Data: MongoCollection,
    collection_Users: MongoCollection,
    collection_specialCommandsHistory: MongoCollection,
    collection_UserDataCollection: MongoCollection,
}

interface StartupChainInstances {
    bot: Telegraf<TBFContext>;
    database: MongoDataBase;
    app: ExpressApp | undefined;
}


type DatabaseMessage = {
    messageId: number;
    chatId: number;
    message: tt.Message,
    trash?: boolean | undefined;
} | undefined

interface DB {
    bot: Telegraf<TBFContext>,
    messages: {
        bot: {
            getLastMessage: (ctx: TBFContext) => Promise<DatabaseMessage>;
            getMessages: (ctx: TBFContext, count: number) => Promise<DatabaseMessage[]>;
        },
        user: {
            addUserMessage: (ctx: TBFContext, message?: any) => Promise<void>;
            getUserMessages: (ctx: TBFContext) => Promise<DatabaseMessage[]>;
            addUserSpecialCommand: (ctx: TBFContext) => Promise<void>;
            getUserSpecialCommands: (ctx: TBFContext) => Promise<DatabaseMessage[]>;
            removeSpecialCommandsExceptLastOne: (ctx: TBFContext) => Promise<void>;
        },
        addToRemoveMessages: (ctx: TBFContext, message_or_arrayMessages: Array<tt.Message> | tt.Message, trash?: boolean | undefined) => Promise<void>;
        removeMessages: (ctx: TBFContext, onlyTrash?: boolean | undefined) => Promise<void>;
        markAllMessagesAsTrash: (ctx: TBFContext) => Promise<void>,
        findOldMessages: (unix_lim: number) => Promise<DatabaseMessage[]>;
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
        collection: (ctx: TBFContext, collection_name: string) => {
            find: (query: object) => Promise<WithId<Document>>;
            findAll: (query: object) => Promise<Array<WithId<Document>>>;
            insert: (value: object) => Promise<InsertOneResult<Document>>;
            update: (query: object, value: object) => Promise<UpdateResult>;
            updateMany: (query: object, value: object) => Promise<Document | UpdateResult>;
            delete: (query: object) => Promise<DeleteResult>;
            deleteMany: (query: object) => Promise<DeleteResult>;
        }
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
    TBFConfig,
    ButtonsRowButton,
    tt,
    DatabaseMessage
}