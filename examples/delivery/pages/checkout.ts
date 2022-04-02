import { ComponentExport } from "../../../src/types";
let products = require("../assets/products");

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        actions: {
            async main({ data }) {
                let user = this.user();
                let owned = await user.collection.findAll({});
                let uniq_owned_ids = new Set(owned.map(x => x.product_id));
                let uniq_owned = products.filter(x => uniq_owned_ids.has(x.id));
                let page = Number(data) || 0;

                let sum = 0;
                let list_of_products = [];
                for (let product of uniq_owned) {
                    let count = owned.filter(x => x.product_id === product.id).length;
                    sum += count * product.price;
                    list_of_products.push({
                        ...product,
                        text: `${count} ✕ ${product.name} - $${product.price * count}`,
                        page: "product",
                        action: "main",
                        data: [2, product.id]
                    })
                }

                let footer_buttons = [
                    { text: "⬅️ Back", page: 'index', action: "main" },
                    { text: "🗑 Clear", page: 'checkout', action: "clear_cart" }
                ];
                if (owned.length > 0) footer_buttons.push({ text: `🛍 Buy for $${sum}`, page: "checkout", action: "buy" });

                this.goToPlugin({
                    plugin: "list",
                    data: {
                        text: `🤑 Goods in your cart:`,
                        list: list_of_products,
                        footer_buttons: [footer_buttons],
                        page
                    }
                })
            },
            async buy() {
                let user = this.user();
                await user.collection.deleteMany({});
                this.update({
                    text: `🛍 Thank you for your purchase!`,
                    buttons: [
                        [
                            { text: "🏠 Home", page: 'index', action: "main" }
                        ]
                    ]
                })
            },
            async clear_cart() {
                let user = this.user();
                await user.collection.deleteMany({});
                this.goToPage({ page: "index" });
            }
        }
    }
}

module.exports = page;