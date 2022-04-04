import { Component } from "../../../src"
let moment = require("moment");

module.exports = Component(() => {
    return {
        actions: {
            async main({ data }) {
                let _id = data;
                let user = this.user();
                let post = await user.collection.find({ _id });
                if (!post) return this.update({
                    text: "Post not found.",
                    buttons: [
                        [{ text: "◀️ Back", page: "index" }],
                    ]
                })

                this.update({
                    text: `<i>From ${moment(post.createdAt).format('DD.MM.YYYY HH:mm')}</i>\n\n<b>${post.text}</b>`,
                    buttons: [
                        [{ text: "🗑 Remove", action: "ask_remove", data: post._id }],
                        [{ text: "◀️ Back to Menu", page: "index" }, { text: "◀️ Back to Posts", page: "my_posts" },]
                    ]
                })
            },
            async ask_remove({ data }) {
                let _id = data;
                this.update({
                    text: "Are you sure you want to remove this post?",
                    buttons: [
                        [{ text: "❌ No", action: "main", data: _id },
                        { text: "✅ Yes", action: "remove", data: _id }],
                    ]
                })
            },
            async remove({ data }) {
                let _id = data;
                let user = this.user();
                await user.collection.delete({ _id });

                this.update({
                    text: "Post was removed.",
                    buttons: [
                        [{ text: "◀️ Back to Menu", page: "index" }, { text: "◀️ Back to Posts", page: "my_posts" },],
                    ]
                })
            }
        }
    }
});