import { ComponentExport } from "../../../lib/types"
import backButton from "../components/backButton";

let message = {
    text: `📷 What photos are you interested in?`,
    buttons: [
        [
            {
                text: "🍷 Bar",
                plugin: "gallery_viewer",
                data: {
                    callback: { page: 'gallery', action: 'backFromPlugin' },
                    params: { backButton: '◀️ Back to Categories' },
                    place: 'bar'
                },
            },
            {
                text: "🌝 Veranda",
                plugin: "gallery_viewer",
                data: {
                    callback: { page: 'gallery', action: 'backFromPlugin' },
                    params: { backButton: '◀️ Back to Categories' },
                    place: 'veranda'
                }
            }
        ],
        backButton
    ]
};

let page: ComponentExport = () => {
    return {
        id: "gallery",
        actions: {
            async main() {
                this.update(message);
            },
            backFromPlugin() {
                this.send(message);
            }
        }
    };
}

module.exports = page;