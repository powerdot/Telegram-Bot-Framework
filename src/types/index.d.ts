import { Telegraf, Markup, Context as TelegrafContext } from 'telegraf';
import { Application as ExpressApp } from "express"
import * as tt from 'telegraf/src/core/types/typegram';

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
    keyboard?: Keyboard
}

type ComponentActionHandlerThisUpdateArg = {
    text?: string,
    buttons?: MessageButtons,
    keyboard?: Keyboard
}

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
    update: (arg: ComponentActionHandlerThisUpdateArg) => Promise<any>;
    sendMediaGroup: (arg: ComponentActionHandlerThisSendArg & { media: any[], options?: object }) => Promise<any>;
    goToAction: (arg: { action: string, data?: goToData }) => Promise<any>;
    goToPage: (arg: { page: string, action?: string, data?: goToData }) => Promise<any>;
    goToComponent: (arg: { component: string, action?: string, data?: goToData, type: string }) => Promise<any>;
    goToPlugin: (arg: { plugin: string, action?: string, data: pluginGoToData }) => Promise<any>;
    clearChat: () => Promise<any>;
}

type ComponentActionHandlerThis = {
    id: string;
    type: string;
    ctx: TBFContext;
    user: (arg?: { user_id }) => {
        get: () => Promise<Object>;
        list: () => Promise<any>;
        getValue: (key: string) => Promise<any>;
        setValue: (key: string, value: any) => Promise<any>;
        removeValue: (key: string) => Promise<any>;
        destroy: () => Promise<any>;
        collection: DBUserCollection,
        methods: ComponentActionHandlerThisMethods
    }
} & ComponentActionHandlerThisMethods;

interface ComponentActionMessageHandler {
    (this: ComponentActionHandlerThis, arg: ComponentActionArg): any;
    clearChat?: boolean;
}

interface ComponentActionHandler {
    (this: ComponentActionHandlerThis, arg: ComponentActionArg): any;
    clearChat?: boolean;
    messageHandler?: ComponentActionMessageHandler;
}

type ComponentAction = ComponentActionHandler | {
    clearChat?: boolean;
    handler: ComponentActionHandler;
    messageHandler?: ComponentActionMessageHandler | {
        clearChat?: boolean;
        handler: ComponentActionMessageHandler;
    }
}

interface Component {
    id?: string;
    type?: string;
    name?: string;
    actions: {
        "main": ComponentAction;
        [key: string]: ComponentAction;
    },
    onCallbackQuery?: (ctx: TBFContext) => Promise<any>
    onMessage?: (ctx: TBFContext) => Promise<any>
    ctx?: TBFContext
    call?: (ctx: TBFContext) => Promise<any>
    open?: (arg: { ctx: TBFContext, data: goToData, action: string }) => Promise<any>
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


import { MongoClient, Collection as MongoCollection, FindCursor, WithId, Document, InsertOneResult, UpdateResult, DeleteResult, Collection } from 'mongodb/mongodb';
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
    collection_TempData: MongoCollection,
    collection_SharedData: MongoCollection,
}

interface StartupChainInstances {
    bot: Telegraf<TBFContext>;
    database: MongoDataBase;
    app?: ExpressApp | undefined;
}


type DatabaseMessage = {
    messageId: number;
    chatId: number;
    message: tt.Message,
    trash?: boolean | undefined;
} | undefined

type DBUserCollection = {
    find: (query: object) => Promise<WithId<Document>>;
    findAll: (query: object) => Promise<Array<WithId<Document>>>;
    insert: (value: object) => Promise<InsertOneResult<Document>>;
    update: (query: object, value: object) => Promise<UpdateResult>;
    updateMany: (query: object, value: object) => Promise<Document | UpdateResult>;
    delete: (query: object) => Promise<DeleteResult>;
    deleteMany: (query: object) => Promise<DeleteResult>;
}

interface DB {
    bot: Telegraf<TBFContext>,
    client: MongoClient,
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
        get: (messagespase: string, uniqid: string) => Promise<WithId<Document>>;
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
        userData: Collection,
        botMessageHistory: Collection,
        userMessageHistory: Collection,
        data: Collection,
        users: Collection,
        specialCommandsHistory: Collection,
        userDataCollection: Collection,
        tempData: Collection,
        sharedData: Collection
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
    openPage: (arg: { ctx: TBFContext, page: string, data?: any, action?: string }) => Promise<Error | boolean>;
}

interface TBFConfig {
    pages?: {
        path: string;
    },
    plugins?: {
        path: string;
    }
    autoRemoveMessages?: boolean;
    debug?: boolean;
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
    PluginButton
}