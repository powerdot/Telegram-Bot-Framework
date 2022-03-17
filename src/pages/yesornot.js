let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
    return {
        id: "yesornot",
        name: "да или нет",
        requirements: [],
        actions: {
            main: {
                clearChat: true,
                handler({ ctx }) {
                    this.send({
                        text: "скажи, да или нет?",
                        keyboard: [
                            [{ text: "Да" }, { text: "Нет" }],
                            [{ text: "Назад" }],
                        ]
                    })
                },
                textHandler: {
                    clearChat: true,
                    async handler({ ctx, text }) {
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
                            await this.goToPage("index")
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