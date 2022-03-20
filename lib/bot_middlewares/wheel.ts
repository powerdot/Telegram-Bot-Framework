import type { DB, TBFContext, Page, CallbackPath } from "../types"

let helpers = require("../helpers");
import dataPacker from "../dataPacker";

module.exports = ({ db, pages }: { db: DB, pages: Page[] }) => {
    return async function (_ctx: TBFContext, next) {
        let ctx = _ctx;
        // console.log('==============v')
        let next_ = await db.getValue(ctx, 'next_step');
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
            page: undefined,
            action: undefined,
            data: undefined,
            step: step_,
            next_step: next_,
            message: undefined
        };
        ctx.routing = routing;
        if (ctx.updateType == 'message') routing.message = ctx.update.message;
        if (parseCallbackPath) {
            routing.page = parseCallbackPath.current.route;
            routing.action = parseCallbackPath.current.action;
            routing.data = dataPacker.unpackData(parseCallbackPath.current.data);
        }
        if (parseStep) {
            if (!routing.page) routing.page = parseStep.route;
            if (!routing.action) routing.action = parseStep.action;
        }
        console.log("route", routing);
        console.log("parseCallbackPath", parseCallbackPath.current);
        console.log("parseStep", parseStep);
        console.log("next_step", next_);
        console.log('==============');

        ctx.CallbackPath = helpers.parseCallbackPath(ctx);
        if (routing.page) {
            let page = pages.find(p => p.id == routing.page);
            if (page) page.call(ctx)
        }
        return next();
    }
}