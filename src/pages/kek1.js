let moment = require("moment");

module.exports = ({ db, config, paginator, routeToPage }) => {
    return {
        id: "kek1",
        name: "KEK1",
        requirements: [],
        actions: {
            main: {
                clearChat: true,
                async handler(ctx) {
                    await ctx.send({
                        ctx, text: "kek1!", keyboard:
                            [
                                [{ text: "back", page: "index" }]
                            ]
                    });
                }
            }

        }
    }
}