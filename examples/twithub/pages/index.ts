import { Component } from "../../../src"

module.exports = Component(() => {
    return {
        actions: {
            async main() {
                this.clearChat();
                this.send({
                    text: `🦉 Welcome to TwitHub!\nNow you have own account.`,
                    buttons: [
                        [
                            { text: "📝 Make a post", page: "new_post" },
                            { text: "📚 My posts", page: "my_posts" },
                        ],
                        [
                            { text: "🌐 My Page", url: `/u/#${this.ctx.chatId}` },
                        ]
                    ]
                })
            }
        }
    }
});