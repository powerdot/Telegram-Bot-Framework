import type { DB, TBFContext, Component, CallbackPath } from "../types"

let helpers = require("../helpers");
import dataPacker from "../data_packer";

module.exports = ({ db, components }: { db: DB, components: Component[] }) => {
    return async function (_ctx: TBFContext, next) {
        let ctx = _ctx;
        console.log('==============v')
        let step_ = await db.getValue(ctx, 'step');
        let parseCallbackPath: CallbackPath = helpers.parseCallbackPath(ctx);
        let parseStep: any = false;
        if (step_) {
            parseStep = {
                route: step_.split("�")[0],
                action: step_.split("�")[1],
            }
        }
        let routing = {
            type: ctx.updateType,
            component: undefined,
            action: undefined,
            data: undefined,
            step: step_,
            message: undefined,
            messageTypes: ctx.updateSubTypes,
            isMessageFromUser: false
        };
        ctx.routing = routing;
        if (ctx.updateType == 'message') {
            routing.message = ctx.update.message;
            routing.isMessageFromUser = true;
        }
        if (parseCallbackPath) {
            routing.component = parseCallbackPath.current.route;
            routing.action = parseCallbackPath.current.action;
            routing.data = await dataPacker.unpackData(parseCallbackPath.current.data, db, ctx);
        }
        if (parseStep) {
            if (!routing.component) routing.component = parseStep.route;
            if (!routing.action) routing.action = parseStep.action;
        }
        console.log("route", routing);
        console.log("parseCallbackPath", parseCallbackPath.current);
        console.log("parseStep", parseStep);
        console.log("ctx", ctx);
        console.log('==============');

        if (routing.component) {
            let component = components.find(p => p.id == routing.component);
            if (component) component.call(ctx)
        }
        return next();
    }
}