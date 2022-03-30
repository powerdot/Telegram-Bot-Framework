let moment = require("moment");

import { ComponentExport } from "../../../lib/types"

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        id: "name",
        name: "имя",
        actions: {
            main: {
                handler({ ctx, data }) {
                    let text = `скажи как тебя зовут?`;
                    if (data) text += `\nСудя по всему, ты ${data}`;
                    this.update({
                        text,
                        buttons: [
                            [{ text: "назад", page: "index" }],
                        ]
                    })
                },
                messageHandler({ text }) {
                    let name = text;
                    this.update({
                        text: `Привет, ${name}!`,
                        buttons: [
                            [{ text: "назад", page: "index" }],
                        ]
                    })
                }
            }
        }
    };
}

module.exports = page;