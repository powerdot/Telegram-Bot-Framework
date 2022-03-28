import { ComponentExport } from "../../../lib/types";
let products = require("../assets/products");

let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        actions: {
            async main() {
                await this.clearChat();
                let user = this.user();
                let owned = await user.collection.findAll({});
                let checkoutButton = [];
                if (owned.length > 0) checkoutButton.push([{ text: `🛒 Checkout (${owned.length})`, page: "checkout" }]);

                this.send({
                    text: `Hey! 🛵 Welcome to the delivery bot!\n\n👉Please choose one of categories\nor 💬 text me the name of the product you want to find.`,
                    buttons: [
                        [{ text: "🍔 Burgers", action: "category_selected", data: "burgers" }],
                        [{ text: "🍟 Snacks", action: "category_selected", data: "snacks" }],
                        [{ text: "🍕 Pizzas", action: "category_selected", data: "pizzas" }],
                        [{ text: "🧁 Desserts", action: "category_selected", data: "desserts" }],
                        ...checkoutButton
                    ]
                });
            },
            async category_selected({ data }) {
                console.log("category_selected", data);
                let page = 0;
                let category = data;
                if (typeof data === "object" && Array.isArray(data)) {
                    page = data[0];
                    category = products.find(p => p.id == data[1])?.category;
                    if (!category) return;
                }

                let user = this.user();
                let owned = await user.collection.findAll({});

                let list_of_binded_products = [];
                for (let product of products.filter(product => product.category === category)) {
                    let product_owned = owned.filter(p => p.product_id === product.id).length;
                    list_of_binded_products.push({
                        ...product,
                        text: `${product_owned ? product_owned + ' ✕ ' : ''}${product.name} - $${product.price}`,
                        page: "index",
                        action: "productSelected",
                        data: product.id
                    })
                }

                let footer_buttons = [
                    { text: "⬅️ Back", page: 'index', action: "main" }
                ];

                if (owned.length > 0) footer_buttons.push({ text: `🛒 Checkout (${owned.length})`, page: "checkout", action: "main" });

                this.goToPlugin({
                    plugin: "list",
                    data: {
                        text: `Here is the list of ${category} 😋`,
                        list: list_of_binded_products,
                        footer_buttons: [footer_buttons],
                        page
                    }
                })
            },
            async productSelected({ data }) {
                let product_id = data[1];
                console.log("productSelected", data);

                let user = this.user();
                await user.collection.insert({ product_id });
                this.goToAction({ action: "category_selected", data: data });
            }
        }
    }
}

module.exports = page;