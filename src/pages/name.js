let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
    return {
        id: "name",
        name: "имя",
        requirements: [],
        actions: {
            main: {
                handler({ ctx }) {
                    this.update({
                        text: "скажи как тебя зовут?",
                        buttons: [
                            [{ text: "назад", page: "index" }],
                        ]
                    })
                },
                textHandler: {
                    clearChat: true,
                    handler({ ctx }) {
                        let name = ctx.message.text;
                        this.send({
                            text: `Привет, ${name}!`,
                            buttons: [
                                [{ text: "назад", page: "index" }],
                            ]
                        })
                    }
                }
            }
        }
    };
}