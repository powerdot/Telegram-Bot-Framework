let fs = require("fs");
let path = require("path");
import type {
    PaginatorReturn
} from "./types"

export default function ({ config }): PaginatorReturn {
    return {
        list: function (componentType = "pages") {
            let components_path = config[componentType].path[config[componentType].path.length - 1] == '/' ? config[componentType].path : (config[componentType].path + "/");
            let csstts = [];
            if (!fs.existsSync(components_path)) return [];
            fs.readdirSync(components_path).forEach(function (file) {
                let component_path = path.resolve(components_path, file);
                csstts.push({ module: require(component_path), path: component_path, id: file.split(".")[0] });
            });
            return csstts;
        }
    }
}

