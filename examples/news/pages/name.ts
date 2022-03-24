let moment = require("moment");

import { PageExport } from "../../../lib/types"

let page: PageExport = ({ db, config, paginator }) => {
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
                messageHandler({ ctx }) {
                    let name = ctx.message.text;
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