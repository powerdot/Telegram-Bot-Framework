"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("../helpers");
var data_packer_1 = require("../data_packer");
exports.default = (function (_a) {
    var db = _a.db, components = _a.components, config = _a.config;
    return function (_ctx, next) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var ctx, step_, parseCallbackPath, parseStep, routing, _b, component;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        ctx = _ctx;
                        if (config.debug)
                            console.log('==============v');
                        return [4 /*yield*/, db.getValue(ctx, 'step')];
                    case 1:
                        step_ = _c.sent();
                        parseCallbackPath = (0, helpers_1.parseCallbackPath)(ctx);
                        parseStep = false;
                        if (step_) {
                            parseStep = {
                                route: step_.split("�")[0],
                                action: step_.split("�")[1],
                            };
                        }
                        routing = {
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
                        if (!(typeof parseCallbackPath == 'object')) return [3 /*break*/, 3];
                        routing.component = parseCallbackPath.current.route;
                        routing.action = parseCallbackPath.current.action;
                        _b = routing;
                        return [4 /*yield*/, data_packer_1.default.unpackData(parseCallbackPath.current.data, db, ctx)];
                    case 2:
                        _b.data = _c.sent();
                        _c.label = 3;
                    case 3:
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
                            console.log("[router] ctx", ctx);
                        if (config.debug)
                            console.log('==============');
                        if (routing.component) {
                            component = components.find(function (p) { return p.id == routing.component; });
                            if (component) {
                                (_a = component === null || component === void 0 ? void 0 : component.call) === null || _a === void 0 ? void 0 : _a.call(component, ctx);
                            }
                            else {
                                console.error("\uD83D\uDC94 Component with ID ".concat(routing.component, " not found."));
                            }
                        }
                        return [2 /*return*/, next()];
                }
            });
        });
    };
});
