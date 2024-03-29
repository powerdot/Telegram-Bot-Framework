import { ButtonsRowButton } from "../../../../src/types"
import backButton from "../../assets/backButton";
import menu from "./menu";

let categoriesButton: ButtonsRowButton[] = [{ text: "◀️ Back to Categories", action: "main" }];

let MiniSearch = require("./minisearch.min.js");
let miniSearch = new MiniSearch({
    fields: ['name'],
    storeFields: ['name', 'category', 'price'],
    searchOptions: {
        boost: { title: 2 },
        fuzzy: 2
    }
})
miniSearch.addAll(menu);

let defaultButtons = [
    [
        { text: "Snacks", action: "snacks" },
        { text: "Drinks", action: "drinks" },
    ],
    backButton,
];

import { Component } from "../../../../src"
module.exports = Component(() => {
    return {
        id: "menu",
        actions: {
            main: {
                handler() {
                    this.update({
                        text: `👉 Select category...\n💬 or send me text what you want to find.`,
                        buttons: defaultButtons
                    });
                },
                messageHandler({ text }) {
                    if (!text) return false;
                    let results = miniSearch.search(text);
                    if (results.length) {
                        this.update({
                            text: `🤌 Found ${results.length} items! Here they are:\n${results.map(item => `${item.name} - $${item.price}`).join("\n")}`,
                            buttons: defaultButtons
                        });
                    } else {
                        this.update({
                            text: `🥲 Nothing found!\nLook our categories:`,
                            buttons: defaultButtons
                        });
                    }
                }
            },
            drinks() {
                let drinks = menu.filter(x => x.category == 'drinks').map(x => `${x.name} - $${x.price}`).join("\n");
                this.update({
                    text: `☕️ Drinks\n\n${drinks}`,
                    buttons: [categoriesButton]
                });
            },
            snacks() {
                let snacks = menu.filter(x => x.category == 'snacks').map(x => `${x.name} - $${x.price}`).join("\n");
                this.update({
                    text: `🧁 Snacks\n\n${snacks}`,
                    buttons: [categoriesButton]
                });
            }
        }
    };
});