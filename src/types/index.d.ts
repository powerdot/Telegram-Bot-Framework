import { Telegraf, Markup, Context as TelegrafContext } from 'telegraf';
import { Application as ExpressApp } from "express"
import { Server as HttpServer } from "node:http";
import * as tt from 'typegram';
import type { StorageClient, StorageCollection, StorageConfig, StorageDatabase } from '../storage/types';

type TelegramMessage = tt.Message;

type CallbackPathRoute = {
    route?: string | undefined;
    action?: string | undefined;
    data?: string | undefined;
}

type CallbackPath = {
    current: CallbackPathRoute,
    all: Array<CallbackPathRoute>,
    next: string | false
} | boolean

interface TBFContext extends TelegrafContext {
    chatId?: number | null
    fromId?: number
    senderChatId?: number
    routeTo?: string
    routing: {
        type: string
        component?: string | undefined
        action?: string | undefined
        data?: string | number | Array<any> | any | undefined
        step?: string
        next_step?: string
        message?: undefined | TelegramMessage
        // messageTypes: string
        isMessageFromUser: boolean
    }
}

type ComponentActionArg = {
    ctx: TBFContext;
    data?: ComponentActionData;
    text?: string;
    photo?: tt.ChatPhoto;
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
    caption?: string;
}

type ButtonsRowButton = {
    text: string;
    action?: string | Function;
    page?: string;
    plugin?: string;
    data?: ComponentActionData;
    url?: string;
}
type ButtonsRow = Array<ButtonsRowButton>
type MessageButtons = Array<ButtonsRow>

type ComponentActionData = string | number | { [key: string]: any; } | Array<any> | boolean;

type KeyboardRowButton = {
    text: string;
    request_location?: boolean;
    request_contact?: boolean;
}
type KeyboardRow = Array<KeyboardRowButton>
type Keyboard = Array<KeyboardRow>

type ComponentActionHandlerThisSendArg = {
    text?: string,
    buttons?: MessageButtons,
    keyboard?: Keyboard,
    options?: Record<string, any>
}

type ComponentActionHandlerThisUpdateArg = {
    text?: string,
    buttons?: MessageButtons,
    keyboard?: Keyboard
}

type ChatAction = Parameters<TelegrafContext["sendChatAction"]>[0];
type ChatActionOptions = Record<string, any> & {
    intervalDuration?: number;
};

type goToData = any;
type pluginGoToData = {
    callback?: {
        page: string;
        action?: string,
    },
    [key: string]: any;
}

type PluginButton = {
    text: string;
    plugin: string;
    data: pluginGoToData
}

interface ComponentActionHandlerThisMethods {
    send: (arg: ComponentActionHandlerThisSendArg) => Promise<any>;
    reply: (arg: ComponentActionHandlerThisSendArg) => Promise<any>;
    update: (arg: ComponentActionHandlerThisUpdateArg) => Promise<any>;
    sendMediaGroup: (arg: ComponentActionHandlerThisSendArg & { media: any[], options?: object }) => Promise<any>;
    sendPhoto: (arg: { photo: any, options?: Record<string, any> }) => Promise<any>;
    sendVideo: (arg: { video: any, options?: Record<string, any> }) => Promise<any>;
    sendAnimation: (arg: { animation: any, options?: Record<string, any> }) => Promise<any>;
    sendAudio: (arg: { audio: any, options?: Record<string, any> }) => Promise<any>;
    sendDocument: (arg: { document: any, options?: Record<string, any> }) => Promise<any>;
    sendVoice: (arg: { voice: any, options?: Record<string, any> }) => Promise<any>;
    sendSticker: (arg: { sticker: any, options?: Record<string, any> }) => Promise<any>;
    sendLocation: (arg: { latitude: number, longitude: number, options?: Record<string, any> }) => Promise<any>;
    sendPoll: (arg: { question: string, options: any[], extra?: Record<string, any> }) => Promise<any>;
    sendChatAction: (action: ChatAction, options?: Record<string, any>) => Promise<any>;
    withChatAction: <T>(action: ChatAction, callback: () => Promise<T> | T, options?: ChatActionOptions) => Promise<T>;
    react: (reaction: string | Record<string, any> | Array<string | Record<string, any>>, options?: Record<string, any>) => Promise<any>;
    api: <T = any>(method: string, payload?: Record<string, any>) => Promise<T>;
    goToAction: (arg: { action: string, data?: goToData }) => Promise<any>;
    goToPage: (arg: { page: string, action?: string, data?: goToData }) => Promise<any>;
    goToComponent: (arg: { component: string, action?: string, data?: goToData, type: string }) => Promise<any>;
    goToPlugin: (arg: { plugin: string, action?: string, data: pluginGoToData }) => Promise<any>;
    clearChat: () => Promise<any>;
}

interface ComponentActionHandlerThisUserDefaultMethods {
    get: () => Promise<Object>;
    list: () => Promise<any>;
    getValue: (key: string) => Promise<any>;
    setValue: (key: string, value: any) => Promise<any>;
    removeValue: (key: string) => Promise<any>;
    destroy: () => Promise<any>;
    collection: DBUserCollection,
}

type ComponentActionHandlerThisUserAsyncMethods = {
    getCurrentRoute: () => Promise<{ page: string, action: string }>;
} & ComponentActionHandlerThisMethods;

type ComponentActionHandlerThis = {
    id: string;
    type: string;
    ctx: TBFContext;
    user(this: ComponentActionHandlerThis): ComponentActionHandlerThisUserDefaultMethods;
    userMethods(this: ComponentActionHandlerThis, arg: { user_id: number }): Promise<ComponentActionHandlerThisUserAsyncMethods>
} & ComponentActionHandlerThisMethods;

interface ComponentActionMessageHandler {
    (this: ComponentActionHandlerThis, arg: ComponentActionArg): any;
    clearChat?: boolean;
    chatAction?: ChatAction;
    chatActionOptions?: ChatActionOptions;
}

interface ComponentActionHandler {
    (this: ComponentActionHandlerThis, arg: ComponentActionArg): any;
    clearChat?: boolean;
    chatAction?: ChatAction;
    chatActionOptions?: ChatActionOptions;
    messageHandler?: ComponentActionMessageHandler;
}

type ComponentAction = ComponentActionHandler | {
    clearChat?: boolean;
    chatAction?: ChatAction;
    chatActionOptions?: ChatActionOptions;
    handler: ComponentActionHandler;
    messageHandler?: ComponentActionMessageHandler | {
        clearChat?: boolean;
        chatAction?: ChatAction;
        chatActionOptions?: ChatActionOptions;
        handler: ComponentActionMessageHandler;
    }
}

interface Component {
    id?: string;
    type?: string;
    name?: string;
    clearChatOnOpen?: boolean;
    actions: {
        "main": ComponentAction;
        [key: string]: ComponentAction;
    },
    events?: Partial<Record<string, (this: ComponentActionHandlerThis, ctx: TBFContext) => any>>,
    onCallbackQuery?: (ctx: TBFContext) => Promise<any>
    onMessage?: (ctx: TBFContext) => Promise<any>
    ctx?: TBFContext
    call?: (ctx: TBFContext) => Promise<any>
    open?: (arg: { ctx: TBFContext, data: goToData, action: string, clearChat?: boolean }) => Promise<any>
}

type ParseButtonsArg = {
    ctx: TBFContext;
    id: string;
    buttons: ButtonsRowButton[][];
}
type ParseButtonsReturn = Promise<tt.InlineKeyboardButton[][]>;
type ParseButtons = (arg: ParseButtonsArg) => ParseButtonsReturn;

type ComponentExportArg = {
    db?: DB;
    config?: any;
    // paginator?: any;
    parseButtons?: ParseButtons;
}

interface ComponentExport {
    (arg: ComponentExportArg): Component;
}


import { MongoClient, Collection as MongoCollection, WithId, Document, InsertOneResult, UpdateResult, DeleteResult, Collection } from 'mongodb';
import { Message } from 'typegram';
type MongoDataBase = StorageDatabase;

interface StartupChainInstances {
    bot: Telegraf<TBFContext>;
    database: MongoDataBase;
    app?: ExpressApp | undefined;
    server?: HttpServer | undefined;
}


type DatabaseMessage = {
    messageId: number;
    chatId: number;
    message: tt.Message,
    trash?: boolean | undefined;
} | undefined

type DBUserCollection = {
    find: (query?: object) => Promise<Record<string, any> | null>;
    findAll: (query?: object) => Promise<Array<Record<string, any>>>;
    insert: (value: object) => Promise<any>;
    update: (query: object, value: object) => Promise<any>;
    updateMany: (query: object, value: object) => Promise<any>;
    delete: (query: object) => Promise<any>;
    deleteMany: (query: object) => Promise<any>;
}

interface DB {
    bot: Telegraf<TBFContext>,
    client: StorageClient,
    messages: {
        bot: {
            getLastMessage: (ctx: TBFContext | number) => Promise<DatabaseMessage>;
            getMessages: (ctx: TBFContext | number, count: number) => Promise<DatabaseMessage[]>;
        },
        user: {
            addUserMessage: (ctx: TBFContext, message?: any) => Promise<void>;
            getUserMessages: (ctx: TBFContext | number) => Promise<DatabaseMessage[]>;
            addUserSpecialCommand: (ctx: TBFContext) => Promise<void>;
            getUserSpecialCommands: (ctx: TBFContext | number) => Promise<DatabaseMessage[]>;
            removeSpecialCommandsExceptLastOne: (ctx: TBFContext | number) => Promise<void>;
        }
        addToRemoveMessages: (ctx: TBFContext, message_or_arrayMessages: Array<tt.Message> | tt.Message, trash?: boolean | undefined) => Promise<void>;
        removeMessages: (ctx: TBFContext | number, onlyTrash?: boolean | undefined, removeSpecialCommands?: boolean | undefined) => Promise<void>;
        markAllMessagesAsTrash: (ctx: TBFContext | number) => Promise<void>,
        findOldMessages: (unix_lim: number) => Promise<DatabaseMessage[]>;
    },

    tempData: {
        add: (chatId: number, messagespase: string, uniqid: string, data: any) => Promise<void>;
        get: (messagespase: string, uniqid: string) => Promise<any>;
        remove: (messagespase: string) => Promise<void>;
    },

    removeMessage: (ctx: TBFContext | number, messageId: number, scope: string) => Promise<boolean>,
    setValue: (ctx: TBFContext | number, key: string, value: any) => Promise<any>,
    getValue: (ctx: TBFContext | number, key: string) => Promise<any>,
    removeValue: (ctx: TBFContext | number, key: string) => Promise<any>,

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
            destroy: (ctx: TBFContext | number) => Promise<any>,
        },
        destroy: (ctx: TBFContext | number) => Promise<any>,
        collection: (ctx: TBFContext | number, collection_name: string) => DBUserCollection
    },
    collections: {
        userData: StorageCollection,
        botMessageHistory: StorageCollection,
        userMessageHistory: StorageCollection,
        data: StorageCollection,
        users: StorageCollection,
        specialCommandsHistory: StorageCollection,
        userDataCollection: StorageCollection,
        tempData: StorageCollection,
        sharedData: StorageCollection
    }
}


interface PaginatorComponent {
    module: ComponentExport,
    path: string,
    id: string,
}
interface PaginatorReturn {
    list: (componentType: string) => PaginatorComponent[]
}

interface TBFPromiseReturn {
    bot: Telegraf<TBFContext>;
    app: ExpressApp | undefined;
    database: MongoDataBase;
    db: DB;
    pages: Component[],
    plugins: Component[],
    openPage: (arg: { ctx: TBFContext, page: string, data?: any, action?: string, clearChat?: boolean }) => Promise<boolean>;
    stop: (signal?: string) => Promise<void>;
}

interface TBFConfig {
    pages?: {
        path: string;
    },
    plugins?: {
        path: string;
    }
    autoRemoveMessages?: boolean;
    clearChatOnPageOpen?: boolean;
    spamProtection?: boolean;
    debug?: boolean;
    gracefulShutdown?: {
        handleSignals?: boolean;
    };
    chatActions?: {
        stopOnNavigation?: boolean;
    };
    webServer?: {
        port: any;
        address: string;
    }
}

interface TBFArgs {
    telegram: {
        token: string;
        apiUrl?: string;
    }
    webServer?: {
        module: any;
    },
    storage?: StorageConfig,
    /** @deprecated Use storage: { driver: "mongodb", ... } instead. */
    mongo?: {
        url?: string;
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
    components: Component[]
}


export {
    Telegraf,
    Markup,
    TelegrafContext,
    TBFContext,
    CallbackPath,
    CallbackPathRoute,
    Component,
    ComponentExport,
    MongoDataBase,
    ComponentActionHandlerThis,
    ComponentActionHandler,
    MessageButtons,
    ComponentActionData,
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
    ButtonsRow,
    tt,
    DatabaseMessage,
    PaginatorComponent,
    ParseButtons,
    ParseButtonsReturn,
    ComponentAction,
    ComponentActionHandlerThisUpdateArg,
    ComponentActionHandlerThisSendArg,
    PluginButton,
    StorageConfig,
    StorageDatabase,
    StorageCollection,
    ChatAction,
    ChatActionOptions
}
