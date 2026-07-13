"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createStorage;
exports.resolveStorageConfig = resolveStorageConfig;
const database_1 = __importDefault(require("../startup_chain/database"));
const sqlite_1 = __importDefault(require("./sqlite"));
function resolveStorageConfig(storage, legacyMongo) {
    if (storage)
        return storage;
    if (legacyMongo)
        return { driver: "mongodb", ...legacyMongo };
    return { driver: "sqlite", filename: "./data/tbf.sqlite" };
}
function createStorage(config) {
    if (config.driver === "mongodb")
        return (0, database_1.default)(config);
    return (0, sqlite_1.default)(config);
}
//# sourceMappingURL=index.js.map