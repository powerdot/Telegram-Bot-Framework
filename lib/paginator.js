"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
function default_1(_a) {
    var config = _a.config;
    return {
        list: function (componentType) {
            if (componentType === void 0) { componentType = "pages"; }
            var components_path = config[componentType].path[config[componentType].path.length - 1] == '/' ? config[componentType].path : (config[componentType].path + "/");
            var csstts = [];
            if (!fs.existsSync(components_path))
                return [];
            fs.readdirSync(components_path).forEach(function (file) {
                var component_path = path.resolve(components_path, file);
                csstts.push({ module: require(component_path), path: component_path, id: file.split(".")[0] });
            });
            return csstts;
        }
    };
}
exports.default = default_1;
