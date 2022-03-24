import { ComponentExport } from "../../../lib/types"
import backButton from "../components/backButton";

let page: ComponentExport = () => {
    return {
        id: "gallery",
        actions: {
            async main({ data }) {
                let action = "update";
                if (data == "clearall") {
                    await this.clearChat();
                    action = "send";
                }
                this[action]({
                    text: `📷 What photos are you interested in?`,
                    buttons: [
                        [
                            { text: "🍷 Bar", page: "gallery_viewer", data: ["bar"] },
                            { text: "🌝 Veranda", page: "gallery_viewer", data: ["veranda"] }
                        ],
                        backButton
                    ]
                });
            }
        }
    };
}

module.exports = page;