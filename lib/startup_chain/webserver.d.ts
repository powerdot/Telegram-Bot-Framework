import { Application } from "express";
export default function ({ module, }: {
    module: any;
}, config: any): Promise<Application>;
