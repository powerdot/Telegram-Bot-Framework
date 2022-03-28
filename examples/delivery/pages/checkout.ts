import { ComponentExport } from "../../../lib/types";
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
                        page: "checkout",
                        action: "edit_product",
                        data: product.id
                    })
                }

                let footer_buttons = [
                    { text: "⬅️ Back", page: 'index', action: "main" }
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
            async edit_product({ data }) {
                console.log("edit_product", data);
                let page = data[0];
                let product_id = data[1];
                let product = products.find(x => x.id === product_id);

                let user = this.user();
                let owned = await user.collection.findAll({});
                let product_count = owned.filter(x => x.product_id === product.id).length;

                this.update({
                    text: `<b>${product_count} ${product.name}</b> for <b>$${product.price}</b>`,
                    buttons: [
                        [
                            { text: "-1", action: "amount_change", data: [page, product.id, -1] },
                            { text: "+1", action: "amount_change", data: [page, product.id, 1] }
                        ],
                        [{ text: "❌ Remove from cart", action: "ask_remove", data }],
                        [{ text: "⬅️ Back", action: "main", data: page }]
                    ]
                })

            },
            async amount_change({ data }) {
                let page = data[0];
                let product_id = data[1];
                let amount = data[2];
                let user = this.user();

                if (amount < 0) {
                    await user.collection.delete({ product_id });
                } else {
                    await user.collection.insert({ product_id });
                }

                this.goToAction({ action: "edit_product", data: [page, product_id] });
            },
            async ask_remove({ data }) {
                console.log("ask_remove", data);
                let product_id = data[1];
                let product = products.find(x => x.id === product_id);
                this.update({
                    text: `Are you sure you want to remove ${product.name} from your cart?`,
                    buttons: [
                        [
                            { text: "⬅️ No", action: "edit_product", data },
                            { text: "🗑 Yes", action: "remove", data }
                        ]
                    ]
                })
            },
            async remove({ data }) {
                let product_id = data[1];
                let user = this.user();
                await user.collection.deleteMany({ product_id });
                this.goToAction({ action: "main", data: data[0] });
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
            }
        }
    }
}

module.exports = page;