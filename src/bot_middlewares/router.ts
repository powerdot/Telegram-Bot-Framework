import type { DB, TBFContext, Component, CallbackPath, TBFConfig } from "../types"

import { parseCallbackPath as ParseCallbackPath } from "../helpers";
import dataPacker from "../data_packer";

export default ({ db, components, config }: { db: DB, components: Component[], config: TBFConfig }) => {
    return async function (_ctx: TBFContext, next: Function) {
        let ctx = _ctx;
        if (config.debug) console.log('==============v')
        let step_ = await db.getValue(ctx, 'step');
        let parseCallbackPath: CallbackPath = ParseCallbackPath(ctx);
        let parseStep: any = false;
        if (step_) {
            parseStep = {
                route: step_.split("�")[0],
                action: step_.split("�")[1],
            }
        }
        let routing: typeof ctx.routing = {
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
            routing.data = await dataPacker.unpackData(parseCallbackPath.current.data, db, ctx);
        }
        if (parseStep) {
            if (!routing.component) routing.component = parseStep.route;
            if (!routing.action) routing.action = parseStep.action;
        }
        if (config.debug) console.log("[router] Route", routing);
        if (config.debug) console.log("[router] ParseCallbackPath", parseCallbackPath);
        if (config.debug) console.log("[router] ParseStep", parseStep);
        if (config.debug) console.log("[router] ctx", ctx);
        if (config.debug) console.log('==============');

        if (routing.component) {
            let component = components.find(p => p.id == routing.component);
            if (component) {
                component?.call?.(ctx)
            } else {
                console.error(`💔 Component with ID ${routing.component} not found.`);
            }
        }
        return next();
    }
}