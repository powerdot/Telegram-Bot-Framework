import { Application } from "express";
import { TBFConfig, WebServerArgs } from "../types";
export default function ({ module, }: {
    module: (args: WebServerArgs) => {};
}, config: TBFConfig | undefined): Promise<Application | undefined> | undefined;
