import { ComponentExport } from "../../../src/types"
let moment = require("moment");

let page: ComponentExport = ({ db, config }) => {
    return {
        actions: {
            async main() {
                // this.clearChat();
                let user = this.user();
                let posts = await user.collection.findAll({ type: "post" });
                console.log("user posts", posts);

                // If 0 posts
                if (posts.length == 0) {
                    return this.update({
                        text: "Seems like you have no posts yet.",
                        buttons: [
                            [{ text: "✏️ Make a post", page: "new_post" }],
                            [{ text: "◀️ Back", page: "index" }],
                        ]
                    })
                }

                posts = posts.sort((a, b) => moment(b.createdAt) - moment(a.createdAt));

                // If posts exists
                let PostsButtons = [];
                for (let i = 0; i < posts.length; i++) {
                    let post = posts[i];
                    PostsButtons.push([{ text: `Post from ${moment(post.createdAt).format("DD.MM HH:mm")}`, page: "post", data: post._id }]);
                }
                PostsButtons.push([{ text: "◀️ Back", page: "index" }]);

                this.update({
                    text: "✈️ Here are your posts.",
                    buttons: PostsButtons
                })
            }
        }
    }
}

module.exports = page;