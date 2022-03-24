import { ComponentExport } from "../../../lib/types"

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        id: "yesornot",
        name: "да или нет",
        actions: {
            main: {
                clearChat: true,
                handler() {
                    this.send({
                        text: "скажи, да или нет?",
                        keyboard: [
                            [{ text: "Да" }, { text: "Нет" }],
                            [{ text: "Отмена" }],
                            [{ text: "Назад" }],
                        ]
                    })
                },
                messageHandler: {
                    clearChat: true,
                    async handler({ text }) {
                        if (text == "Да") {
                            this.send({
                                text: "Супер! Ты сказал да!",
                                buttons: [
                                    [{ text: "назад", page: "index" }],
                                ]
                            })
                        } else if (text == "Нет") {
                            this.send({
                                text: "эх! Ты сказал нет!",
                                buttons: [
                                    [{ text: "назад", page: "index" }],
                                ]
                            })
                        } else if (text == "Назад") {
                            await this.goToPage({ page: "index" })
                        } else if (text == "Отмена") {
                            await this.goToAction({ action: "main" })
                        } else {
                            this.send({
                                text: "Я не понял(\nскажи, да или нет?",
                                keyboard: [
                                    [{ text: "Да" }, { text: "Нет" }],
                                    [{ text: "Назад" }],
                                ]
                            })
                        }
                    }
                }
            }
        }
    };
}

module.exports = page;