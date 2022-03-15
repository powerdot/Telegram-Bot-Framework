let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
    return {
        id: "name",
        name: "имя",
        requirements: [],
        actions: {
            main: {
                handler(ctx) {
                    this.update({
                        ctx,
                        text: "скажи как тебя зовут?",
                        keyboard: [
                            [{ text: "назад", page: "index" }],
                        ]
                    })
                },
                textHandler: {
                    clearChat: true,
                    handler(ctx) {
                        let name = ctx.message.text;
                        this.send({
                            ctx,
                            text: `Привет, ${name}!`,
                            keyboard: [
                                [{ text: "назад", page: "index" }],
                            ]
                        })
                    }
                }
            }
        }
    };
}