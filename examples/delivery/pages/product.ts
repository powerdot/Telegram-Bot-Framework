import { ComponentExport } from "../../../src/types";
let products = require("../assets/products");

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        actions: {
            async main({ data }) {
                console.log("product", data)
                let product_id = data[1][1];
                let product = products.find(x => x.id === product_id);

                await this.clearChat();
                await this.sendMediaGroup({
                    media: [{ type: 'photo', media: product.image }]
                });

                this.goToAction({
                    action: 'product_info',
                    data
                })
            },
            async product_info({ data }) {
                console.log("product_info", data)
                let list_page = data[0];
                let from_page = data[1][0];
                let product_id = data[1][1];
                let update_or_send = data[2] == 1 ? 'update' : 'send';
                let removeFromCartButton = [];
                let minusButton = [];
                let product = products.find(x => x.id === product_id);

                let user = this.user();
                let owned = await user.collection.findAll({ product_id });
                if (owned.length > 0) {
                    removeFromCartButton.push([{ text: "🗑 Remove from cart", action: "amount_change", data: [list_page, [from_page, product_id], 0] }]);
                    minusButton.push({ text: "-1", action: "amount_change", data: [list_page, [from_page, product_id], -1] });
                }

                console.log("owned", owned.length)

                await this[update_or_send]({
                    text: `<b>${product.name}</b> for <b>$${product.price}${owned.length ? ' — you got ' + owned.length : ''}</b>\n\n<i>There is description of this tasties product.</i>`,
                    buttons: [
                        [
                            ...minusButton,
                            { text: owned.length ? "+1" : "🛒 Add to cart", action: "amount_change", data: [list_page, [from_page, product_id], 1] },
                        ],
                        ...removeFromCartButton,
                        [
                            { text: '⬅️ Back', action: 'back', data: [list_page, from_page, product_id] }
                        ]
                    ]
                });
            },
            async amount_change({ data }) {
                let product_id = data[1][1];
                let count = data[2];
                console.log("amount_change", data);

                let user = this.user();
                if (count === 0) await user.collection.deleteMany({ product_id });
                if (count === -1) await user.collection.delete({ product_id });
                if (count === 1) await user.collection.insert({ product_id });

                this.goToAction({ action: "product_info", data: [data[0], [data[1][0], data[1][1]], 1] });
            },
            async back({ data }) {
                let list_page = data[0];
                let from_page = data[1];
                let product_id = data[2];
                let backRouter = { page: undefined, action: undefined, data: [] };
                if (from_page == 0) {
                    backRouter = { page: "index", action: "category_selected", data: [list_page, product_id] };
                } else if (from_page == 1) {
                    backRouter = { page: "index", action: "main", data: [] };
                } else if (from_page == 2) {
                    backRouter = { page: "checkout", action: "main", data: list_page };
                }
                let botMessages = await db.messages.bot.getMessages(this.ctx, 2);
                let imageMessage = botMessages.find(x => "photo" in x.message);
                await db.removeMessage(this.ctx, imageMessage.messageId, 'bot');
                this.goToPage(backRouter);
            }
        }
    }
}

module.exports = page;