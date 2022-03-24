import { ComponentExport } from "../../../lib/types"

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        id: "random",
        name: "рандом",
        actions: {
            main({ ctx }) {
                this.update({
                    text: "выбери в каких числах хочешь:",
                    buttons: [
                        [{ text: "0-10", action: "r10" }],
                        [{ text: "0-100", action: "r100" }],
                        [{ text: "выйти", page: "index" }]
                    ]
                })
            },
            r10({ ctx }) {
                this.update({
                    text: Math.floor(Math.random() * 10).toString(),
                    buttons: [
                        [{ text: "еще раз!", action: "r10" }],
                        [{ text: "вернуться к числам", action: "main" }],
                        [{ text: "выйти", page: "index" }],
                    ]
                })
            },
            r100({ ctx }) {
                this.update({
                    text: Math.floor(Math.random() * 100).toString(),
                    buttons: [
                        [{ text: "еще раз!", action: "r100" }],
                        [{ text: "вернуться к числам", action: "main" }],
                        [{ text: "выйти", page: "index" }],
                    ]
                })
            }
        }
    };
}

module.exports = page;