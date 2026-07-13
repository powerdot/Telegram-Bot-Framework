"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
let fs = require("fs");
let path = require("path");
const componentExtensions = new Set([".js", ".cjs", ".ts", ".cts"]);
const declarationPattern = /\.d\.(?:ts|cts|mts)$/i;
function isComponentFile(file) {
    if (declarationPattern.test(file))
        return false;
    return componentExtensions.has(path.extname(file).toLowerCase());
}
function resolveDirectoryEntry(directory) {
    try {
        const resolved = require.resolve(directory);
        return isComponentFile(resolved) ? resolved : undefined;
    }
    catch {
        return undefined;
    }
}
function loadComponent(componentPath) {
    const loaded = require(componentPath);
    if (typeof loaded === "function")
        return loaded;
    if (typeof loaded?.default === "function")
        return loaded.default;
    return undefined;
}
function default_1({ config }) {
    return {
        list: function (componentType = "pages") {
            let components_path = config[componentType].path[config[componentType].path.length - 1] == '/' ? config[componentType].path : (config[componentType].path + "/");
            let csstts = [];
            if (!fs.existsSync(components_path))
                return [];
            const entries = fs.readdirSync(components_path, { withFileTypes: true })
                .sort((a, b) => a.name.localeCompare(b.name));
            entries.forEach(function (entry) {
                const entry_path = path.resolve(components_path, entry.name);
                let component_path;
                let id;
                if (entry.isDirectory()) {
                    component_path = resolveDirectoryEntry(entry_path);
                    id = entry.name;
                }
                else if (entry.isFile() && isComponentFile(entry.name)) {
                    component_path = entry_path;
                    id = path.basename(entry.name, path.extname(entry.name));
                }
                else {
                    return;
                }
                if (!component_path)
                    return;
                const componentModule = loadComponent(component_path);
                if (!componentModule) {
                    console.warn(`⚠️ Component entry does not export a function: ${component_path}`);
                    return;
                }
                csstts.push({ module: componentModule, path: component_path, id });
            });
            return csstts;
        }
    };
}
//# sourceMappingURL=paginator.js.map