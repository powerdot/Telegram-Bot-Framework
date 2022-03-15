let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
    return {
        id: "random",
        name: "рандом",
        requirements: [],
        actions: {
            main(ctx) {
                this.update({
                    ctx,
                    text: "выбери в каких числах хочешь:",
                    keyboard: [
                        [{ text: "0-10", action: "r10" }],
                        [{ text: "0-100", action: "r100" }],
                        [{ text: "выйти", page: "index" }]
                    ]
                })
            },
            r10(ctx) {
                this.update({
                    ctx,
                    text: Math.floor(Math.random() * 10),
                    keyboard: [
                        [{ text: "еще раз!", action: "r10" }],
                        [{ text: "вернуться к числам", action: "main" }],
                        [{ text: "выйти", page: "index" }],
                    ]
                })
            },
            r100(ctx) {
                this.update({
                    ctx,
                    text: Math.floor(Math.random() * 100),
                    keyboard: [
                        [{ text: "еще раз!", action: "r100" }],
                        [{ text: "вернуться к числам", action: "main" }],
                        [{ text: "выйти", page: "index" }],
                    ]
                })
            }
        }
    };
}