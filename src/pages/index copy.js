let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
    return {
        id: "index1",
        name: "Отправка пушей",
        requirements: [],
        actions: {
            main: {
                clearChat: true,
                async handler(ctx) {
                    await this.send({
                        ctx, text: "привет, красавчик)", keyboard: [
                            [{ text: "123", page: "kek1" }],
                            [
                                { text: "234", action: "justaction" },
                                { text: "345", action: "textaction" },
                            ],
                            [{ text: "картошки", action: "cards" }],
                        ]
                    });
                }
            },

            async justaction(ctx) {
                await this.update({
                    ctx, text: "Спосибо шо нажал)", keyboard: [
                        [{ text: "нозод", action: "main" }]
                    ]
                });
            },

            textaction: {
                async handler(ctx) {
                    await this.update({
                        ctx, text: "Спосибо шо нажалус на act2\nОтправь мне цифру > 5", keyboard: [
                            [{ text: "отменитус", action: "main" }]
                        ]
                    });
                },
                textHandler: {
                    clearChat: true,
                    async handler(ctx) {
                        let num = ctx.message.text;
                        if (num != Number(num)) {
                            return await this.send({
                                ctx, text: "Эй, это не цифра", keyboard: [
                                    [{ text: "ещё раз", action: "textaction" }],
                                    [{ text: "выходос", action: "main" }]
                                ]
                            });
                        }

                        await this.send({
                            ctx, text: `Ты отправил цифру ${num} и она ${(num > 5 ? "больше" : "меньше")}`,
                            keyboard: [[{ text: "супер", action: "main" }]]
                        });
                    }
                },
            },

            cards: {
                async handler(ctx) {
                    await this.update({ ctx, text: "Отправь номер карты" });
                },
                async textHandler(ctx) {
                    await this.goToAction(ctx, "cards_message");
                }
            },
            async cards_message(ctx) {
                this.clearChat(ctx);
                await this.send({
                    ctx, text: "это последний шаг", keyboard: [
                        [{ text: "выход", action: "main" }]
                    ]
                });
            }
        }
    };
}