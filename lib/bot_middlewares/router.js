"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
const data_packer_1 = __importDefault(require("../data_packer"));
exports.default = ({ db, components, config }) => {
    return async function (_ctx, next) {
        let ctx = _ctx;
        if (config.debug)
            console.log('==============v');
        const isRoutableUpdate = ctx.updateType === "message" || ctx.updateType === "callback_query";
        let step_ = isRoutableUpdate ? await db.getValue(ctx, 'step') : undefined;
        let parseCallbackPath = (0, helpers_1.parseCallbackPath)(ctx);
        let parseStep = false;
        if (step_) {
            parseStep = {
                route: step_.split("�")[0],
                action: step_.split("�")[1],
            };
        }
        let routing = {
            type: ctx.updateType,
            component: undefined,
            action: undefined,
            data: undefined,
            step: step_,
            message: undefined,
            isMessageFromUser: false
        };
        ctx.routing = routing;
        if (ctx.updateType == 'message') {
            routing.message = "message" in ctx.update ? ctx.update.message : undefined;
            routing.isMessageFromUser = true;
        }
        if (typeof parseCallbackPath == 'object') {
            routing.component = parseCallbackPath.current.route;
            routing.action = parseCallbackPath.current.action;
            routing.data = await data_packer_1.default.unpackData(parseCallbackPath.current.data, db, ctx);
        }
        if (parseStep) {
            if (!routing.component)
                routing.component = parseStep.route;
            if (!routing.action)
                routing.action = parseStep.action;
        }
        if (config.debug)
            console.log("[router] Route", routing);
        if (config.debug)
            console.log("[router] ParseCallbackPath", parseCallbackPath);
        if (config.debug)
            console.log("[router] ParseStep", parseStep);
        if (config.debug)
            console.log("[router] Context", {
                updateId: ctx.update?.update_id,
                updateType: ctx.updateType,
                chatId: ctx.chatId,
                fromId: ctx.fromId,
                senderChatId: ctx.senderChatId,
            });
        if (config.debug)
            console.log('==============');
        if (routing.component) {
            let component = components.find(p => p.id == routing.component);
            if (component) {
                await component.call?.(ctx);
            }
            else {
                console.error(`💔 Component with ID ${routing.component} not found.`);
            }
        }
        else {
            const eventComponents = components.filter(component => component.events?.[ctx.updateType]);
            for (const component of eventComponents)
                await component.call?.(ctx);
        }
        return next();
    };
};
//# sourceMappingURL=router.js.map