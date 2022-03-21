let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
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