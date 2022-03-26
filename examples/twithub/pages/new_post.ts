import { ComponentExport } from "../../../lib/types"

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        actions: {
            main: {
                handler() {
                    return this.update({
                        text: "📝 Let's make a post!\n\nJust send me <b>text</b> of your post.\n<i>Max post length is 70 symbols.</i>",
                        buttons: [
                            [{ text: "◀️ Cancel", page: "index" }],
                        ]
                    })
                },
                async messageHandler({ text }) {
                    if (!text) return;
                    let clearedText = text.trim();
                    if (clearedText.length > 70) return;

                    let user = this.user();
                    await user.collection.insert({
                        type: "post",
                        text: clearedText,
                        createdAt: new Date(),
                    });

                    this.update({
                        text: "✨ Cool, your post was created!",
                        buttons: [
                            [{ text: "🌐 Watch it Online", url: `/u/#${this.ctx.chatId}` }],
                            [{ text: "📚 My posts", page: "my_posts" }],
                            [{ text: "◀️ Back", page: "index" }],
                        ]
                    })
                }
            }
        }
    }
}

module.exports = page;