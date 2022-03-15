let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
    return {
        id: "index",
        name: "Главная страница",
        requirements: [],
        actions: {
            main: {
                handler(ctx) {
                    this.send({
                        ctx,
                        text: "Привет- привет!",
                        keyboard: [
                            [{ text: "меню", action: "menu" }],
                            [{ text: "помощь", action: "help" }],
                            [{ text: "случайные числа", page: "random" }],
                            [{ text: "привет username", page: "name" }]
                        ]
                    })
                },
                clearChat: true
            },
            menu(ctx) {
                this.update({
                    ctx,
                    text: "Выбери покушать: салат или сыр.",
                    keyboard: [
                        [{ text: "назад!", action: "main" }],
                    ]
                })
            },
            help(ctx) {
                this.update({
                    ctx,
                    text: "Бог тебе в помощь.",
                    keyboard: [
                        [{ text: "спасибо!", action: "main" }],
                        [{ text: "в меню", action: "menu" }],
                    ]
                })
            }
        }
    };
}