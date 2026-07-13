import { Application } from "express";
import { Server } from "node:http";
import { TBFConfig, WebServerArgs } from "../types";
export default function ({ module, }: {
    module: (args: WebServerArgs) => {};
}, config: TBFConfig | undefined): Promise<{
    app: Application;
    server: Server;
} | undefined> | undefined;
