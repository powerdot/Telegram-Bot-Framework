import { ComponentActionHandlerThisUpdateArg, PluginButton } from "../../../src/types"
import backButton from "../assets/backButton";

function GoToGallery(name: string, place: string): PluginButton {
    return {
        text: name,
        plugin: "gallery_viewer",
        data: {
            callback: {
                page: "gallery",
                action: "backFromPlugin"
            },
            params: { backButton: '◀️ Back to Categories' },
            place
        }
    }
}

let message: ComponentActionHandlerThisUpdateArg = {
    text: `📷 What photos are you interested in?`,
    buttons: [
        [
            GoToGallery("🍷 Bar", "bar"),
            GoToGallery("🌝 Veranda", "veranda")
        ],
        backButton
    ]
};

import { Component } from "../../../src";
module.exports = Component(() => {
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
});