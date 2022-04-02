let fs = require("fs");
let path = require("path");
import type {
    PaginatorReturn
} from "./types"

module.exports = function ({ config }): PaginatorReturn {
    return {
        list: function (componentType = "pages") {
            let components_path = config[componentType].path[config[componentType].path.length - 1] == '/' ? config[componentType].path : (config[componentType].path + "/");
            let normalizedPath = path.join(__dirname, '../', components_path);
            let csstts = [];
            if (!fs.existsSync(normalizedPath)) return [];
            fs.readdirSync(normalizedPath).forEach(function (file) {
                let component_path = normalizedPath + file;
                csstts.push({ module: require(component_path), path: component_path, id: file.split(".")[0] });
            });
            return csstts;
        }
    }
}

