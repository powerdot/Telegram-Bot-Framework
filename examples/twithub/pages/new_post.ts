import { ComponentExport } from "../../../lib/types"

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        actions: {
            main: {
                async handler() {
                    let user = this.user();
                    let posts_count = (await user.collection.findAll({ type: "post" })).length;
                    if (posts_count >= 5) {
                        return this.update({
                            text: "❌ Sorry, you can't make more than 5 posts.\nRemove some posts to make new one.",
                            buttons: [
                                [{ text: "📚 My posts", page: "my_posts" }],
                                [{ text: "◀️ Back", page: "index" }],
                            ]
                        })
                    }

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
                    let posts_count = (await user.collection.findAll({ type: "post" })).length;
                    if (posts_count >= 5) return this.goToAction({ action: "main" });

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